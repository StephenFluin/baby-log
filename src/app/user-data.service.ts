import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
    limitToLast,
    onValue,
    orderByChild,
    push,
    query,
    ref,
    remove,
    set,
    update,
} from 'firebase/database';
import { Auth } from './auth.service';
import { FIREBASE_DB, snapshotList } from './firebase';

import { parse, parseISO, formatISO } from 'date-fns';

export interface Data {
    events: Event[];
}
export interface Activity {
    activity: string;
    activityDetails: string;
    notes?: string;
    person?: string;
    time: string;
}
export interface Event {
    date: string;
    activities: Activity[];
}
export interface ActivityType {
    name: string;
    details?: string[];
}
export interface ConnectedFamily {
    id: string;
    name: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserData {
    private auth = inject(Auth);
    private db = inject(FIREBASE_DB);

    readonly familyId = signal<string | null>(null);
    readonly child = signal<string | null>(null);
    /** Names are only EVER stored client side (per user) for privacy reasons */
    readonly connectedFamilies = signal<ConnectedFamily[]>([]);
    /** Families the user has access to on the server */
    private serverFamilyIds: string[] = [];

    /** The 5 most recent days for the current family, newest first */
    readonly events = signal<{ key: string; value: Event }[] | null>(null);
    readonly types = signal<{ key: string; value: ActivityType }[] | null>(null);
    /** Whether types have been loaded from the server (rather than from the local cache) */
    readonly typesLoaded = signal(false);
    /** Map of activity type name to its detail options */
    readonly typeDetails = computed(() => {
        const result: { [name: string]: string[] } = {};
        for (const type of this.types() || []) {
            // firebase eats empty arrays, so make sure we remake
            // them if the data is missing
            result[type.value.name] = type.value.details || [];
        }
        return result;
    });

    /** A mailto: link inviting someone else to attach the current child to their account */
    readonly shareLink = computed(() => {
        const child = this.child() || '';
        const attachUrl = `https://baby.fluin.io/attach/${encodeURIComponent(
            this.familyId() || ''
        )}/${encodeURIComponent(child)}`;
        const subject = `Baby Log: Add ${child} to your account`;
        const body = `Here is the link to add ${child} to your Baby Log account:\r\n\r\n${attachUrl}`;
        return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });

    private eventsLoaded = signal(false);
    readonly status = computed(() => (this.eventsLoaded() ? 'ready' : 'waiting'));

    constructor() {
        // Older versions cached the Firebase user (including tokens) and unscoped data here
        for (const key of ['authState', 'savedCreds', 'events', 'types']) {
            localStorage.removeItem(key);
        }

        // Get the user's families from the DB / local storage and switch to one of them
        effect((onCleanup) => {
            const uid = this.auth.uid();
            this.resetState();
            if (!uid) {
                return;
            }
            this.adoptUnscopedStorage(uid);
            this.connectedFamilies.set(JSON.parse(this.userStorage('connectedFamilies') || '[]'));
            onCleanup(
                onValue(
                    ref(this.db, `users/${uid}`),
                    (snapshot) => {
                        const familyIdOrMap: string | { families: { [key: string]: boolean } } =
                            snapshot.val();
                        this.serverFamilyIds =
                            typeof familyIdOrMap === 'string'
                                ? [familyIdOrMap]
                                : Object.keys(familyIdOrMap?.families || {});
                        const lastFamilyId = this.userStorage('lastFamilyId');
                        this.switchToFamilyId(
                            lastFamilyId && this.serverFamilyIds.includes(lastFamilyId)
                                ? lastFamilyId
                                : this.serverFamilyIds[0] || null
                        );
                    },
                    (error) => console.error('Unable to load families', error)
                )
            );
        });

        // Keep events and types in sync with the current family
        effect((onCleanup) => {
            const familyId = this.familyId();
            if (!familyId) {
                return;
            }
            this.eventsLoaded.set(false);
            this.typesLoaded.set(false);
            this.events.set(readCache(`events:${familyId}`));
            this.types.set(readCache(`types:${familyId}`));
            const eventsQuery = query(
                ref(this.db, `families/${familyId}/events`),
                orderByChild('date'),
                limitToLast(5)
            );
            const unsubscribeEvents = onValue(
                eventsQuery,
                (snapshot) => {
                    const events = sortEvents(snapshotList<Event>(snapshot));
                    this.events.set(events);
                    this.eventsLoaded.set(true);
                    writeCache(`events:${familyId}`, events);
                },
                (error) => console.error('Unable to load events', error)
            );
            const unsubscribeTypes = onValue(
                ref(this.db, `families/${familyId}/types`),
                (snapshot) => {
                    const types = snapshotList<ActivityType>(snapshot);
                    this.types.set(types);
                    this.typesLoaded.set(true);
                    writeCache(`types:${familyId}`, types);
                },
                (error) => console.error('Unable to load types', error)
            );
            onCleanup(() => {
                unsubscribeEvents();
                unsubscribeTypes();
            });
        });
    }

    /**
     * Watch every event for a family, newest first
     * @returns a function that stops watching
     */
    watchHistory(familyId: string, callback: (events: Event[]) => void) {
        return onValue(
            query(ref(this.db, `families/${familyId}/events`), orderByChild('date')),
            (snapshot) => callback(snapshotList<Event>(snapshot).map((item) => item.value).reverse())
        );
    }

    /**
     * Push a new connected family into the DB for the user
     * Switch to the family
     */
    async connectNewFamily(id: string | null, name: string) {
        if (!id) {
            id = await this.createMissingFamily();
        }
        this.connectedFamilies.update((families) => [...families, { id, name }]);
        // First create permissions on the new family
        await this.grantFamilyAccess(id);

        // Then update UI and render
        this.saveConnectedFamilies();
        this.switchToFamilyId(id);
    }

    nameChild(name: string) {
        this.connectNewFamily(this.familyId(), name);
    }

    renameChild(child: ConnectedFamily, name: string) {
        this.connectedFamilies.update((families) =>
            families.map((family) => (family === child ? { ...family, name } : family))
        );
        this.saveConnectedFamilies();
    }

    async detachChild(child: ConnectedFamily) {
        this.connectedFamilies.update((families) => families.filter((family) => family !== child));
        this.saveConnectedFamilies();

        // Make sure we don't keep a deleted child selected
        if (this.familyId() === child.id) {
            await this.switchToFamilyId(
                this.serverFamilyIds.find((familyId) => familyId !== child.id) || null
            );
        }
        // Then revoke this user's access to the child's log
        await remove(ref(this.db, `users/${this.auth.uid()}/families/${child.id}`));
    }

    /**
     * Save changes to local storage
     */
    saveConnectedFamilies() {
        this.setUserStorage('connectedFamilies', JSON.stringify(this.connectedFamilies()));
    }

    /**
     * Give the user access to a family, keeping access to existing ones
     * (including a legacy single family ID stored directly on the user)
     */
    private grantFamilyAccess(familyId: string) {
        const permissions: Record<string, boolean> = { [familyId]: true };
        for (const existingId of this.serverFamilyIds) {
            permissions[existingId] = true;
        }
        return update(ref(this.db, `users/${this.auth.uid()}/families`), permissions);
    }

    private resetState() {
        this.serverFamilyIds = [];
        this.familyId.set(null);
        this.child.set(null);
        this.connectedFamilies.set([]);
        this.events.set(null);
        this.types.set(null);
        this.eventsLoaded.set(false);
        this.typesLoaded.set(false);
    }

    /** Reads a localStorage value that belongs to the signed in user */
    private userStorage(key: string): string | null {
        return localStorage.getItem(`${key}:${this.auth.uid()}`);
    }
    private setUserStorage(key: string, value: string) {
        localStorage.setItem(`${key}:${this.auth.uid()}`, value);
    }
    /** Older versions stored child names without a user, so give them to the first user to sign in */
    private adoptUnscopedStorage(uid: string) {
        for (const key of ['connectedFamilies', 'lastFamilyId']) {
            const value = localStorage.getItem(key);
            if (value !== null) {
                localStorage.setItem(`${key}:${uid}`, value);
                localStorage.removeItem(key);
            }
        }
    }

    /**
     * Create a new family ID and give the user permission to the family
     * This can happen either as part of initial setup (when the user is being created)
     * Or when a user is adding a child to their profile.
     */
    async createMissingFamily() {
        const key = push(ref(this.db, 'families')).key!;
        await this.grantFamilyAccess(key);
        await set(ref(this.db, `families/${key}/`), { creationDate: localeIsoString(new Date()) });
        return key;
    }
    async switchToFamilyId(familyId: string | null) {
        // Let's see if the user gave this person a name!
        const child = this.connectedFamilies().find((family) => family.id === familyId);
        this.child.set(child?.name ?? null);
        // If user doesn't have a family, let's give them one!
        if (!familyId) {
            familyId = await this.createMissingFamily();
        }

        this.setUserStorage('lastFamilyId', familyId);
        this.familyId.set(familyId);
    }

    saveEvent(key: string, data: Event) {
        update(ref(this.db, `families/${this.familyId()}/events/${key}`), data);
    }

    createEvent() {
        push(ref(this.db, `families/${this.familyId()}/events`), {
            date: localeIsoString(new Date()).substr(0, 10),
            activities: [],
        });
    }
    deleteEvent(key: string) {
        if (confirm('Are you sure you want to delete this day?')) {
            remove(ref(this.db, `families/${this.familyId()}/events/${key}`));
        }
    }
    addActivity(eventKey: string, event: Event, activity: string, activityDetails: string) {
        if (!event.activities) {
            event.activities = [];
        }
        event.activities.unshift({
            activity: activity,
            activityDetails: activityDetails,
            time: localeIsoString(new Date()).substring(0, 16),
        });
        this.saveEvent(eventKey, event);
    }
    deleteActivity(eventKey: string, event: Event, activityIndex: number) {
        if (
            confirm(
                `Are you sure you want to delete this '${event.activities[activityIndex].activity}' entry?`
            )
        ) {
            event.activities.splice(activityIndex, 1);
            this.saveEvent(eventKey, event);
        }
    }

    updateTime(eventKey: string, event: Event, activity: Activity, newValue: string) {
        // Format the time as a date, and swap the last 11 chars of the original
        const nt = parse(newValue, 'h:mm a', parseISO(activity.time));
        activity.time = localeIsoString(nt).substring(0, 16);
        this.updateEvent(eventKey, event);
    }
    updateDate(eventKey: string, event: Event, activity: Activity, change: number) {
        activity.time = localeIsoString(
            new Date(new Date(activity.time).valueOf() + change * 24 * 60 * 60 * 1000)
        ).substring(0, 16);
        this.updateEvent(eventKey, event);
    }

    /**
     * Update an event after sorting activities
     */
    updateEvent(eventKey: string, event: Event) {
        // Sort the activities
        event.activities.sort((a, b) => {
            if (a.time > b.time) {
                return -1;
            } else {
                return 1;
            }
        });
        this.saveEvent(eventKey, event);
    }

    addType(type: ActivityType) {
        push(ref(this.db, `families/${this.familyId()}/types`), type);
    }

    removeType(typeId: string) {
        remove(ref(this.db, `families/${this.familyId()}/types/${typeId}`));
    }

    updateTypeDetail(typeId: string, newDetail: string[]) {
        const path = `families/${this.familyId()}/types/${typeId}/details`;
        set(ref(this.db, path), newDetail).catch((err) =>
            console.log(err, 'when updating details')
        );
    }
}

function readCache<T>(cacheKey: string): T | null {
    try {
        return JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
    } catch (parseException) {
        return null;
    }
}

function writeCache(cacheKey: string, value: unknown) {
    localStorage.setItem(cacheKey, JSON.stringify(value));
}

/** Sort date descending, bigger days break ties */
function sortEvents(events: { key: string; value: Event }[]) {
    for (const event of events) {
        if (!event.value.activities) {
            event.value.activities = [];
        }
    }
    return events.sort((a, b) =>
        a.value.date > b.value.date
            ? -1
            : a.value.date === b.value.date && a.value.activities.length > b.value.activities.length
            ? -1
            : 1
    );
}

/**
 * Returns a string that looks like 2020-01-02T17:53-08:00
 */
export function localeIsoString(date: Date) {
    return formatISO(date, { representation: 'complete' });
}
