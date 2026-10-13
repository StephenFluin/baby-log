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
export interface Event {
    date: string;
    activities: {
        activity: string;
        activityDetails: string;
        notes?: string;
        person?: string;
        time: string;
    }[];
    summary?;
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
    /** Names are only EVER stored client side for privacy reasons */
    readonly connectedFamilies = signal<ConnectedFamily[]>(
        JSON.parse(localStorage['connectedFamilies'] || '[]')
    );

    /** The 5 most recent days for the current family, newest first */
    readonly events = cachedSignal<{ key: string; value: Event }[]>('events');
    readonly types = cachedSignal<{ key: string; value: ActivityType }[]>('types');
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
        // Get the user's families from the DB / local storage and switch to one of them
        effect((onCleanup) => {
            const uid = this.auth.uid();
            if (!uid) {
                return;
            }
            onCleanup(
                onValue(ref(this.db, `users/${uid}`), (snapshot) => {
                    const familyIdOrMap: string | { families: { [key: string]: boolean } } =
                        snapshot.val();
                    if (typeof familyIdOrMap === 'string') {
                        this.switchToFamilyId(familyIdOrMap);
                    } else {
                        const id =
                            localStorage['lastFamilyId'] ||
                            Object.keys(familyIdOrMap?.families || {})[0] ||
                            null;
                        this.switchToFamilyId(id);
                    }
                })
            );
        });

        // Keep events and types in sync with the current family
        effect((onCleanup) => {
            const familyId = this.familyId();
            if (!familyId) {
                return;
            }
            const eventsQuery = query(
                ref(this.db, `families/${familyId}/events`),
                orderByChild('date'),
                limitToLast(5)
            );
            const unsubscribeEvents = onValue(eventsQuery, (snapshot) => {
                this.events.set(sortEvents(snapshotList<Event>(snapshot)));
                this.eventsLoaded.set(true);
            });
            const unsubscribeTypes = onValue(ref(this.db, `families/${familyId}/types`), (snapshot) => {
                this.types.set(snapshotList<ActivityType>(snapshot));
                this.typesLoaded.set(true);
            });
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
    async connectNewFamily(id: string, name: string) {
        if (!id) {
            id = await this.createMissingFamily();
        }
        this.connectedFamilies.update((families) => [...families, { id, name }]);
        // First create permissions on the new family
        const newFamilyPermissions = {};
        for (const family of this.connectedFamilies()) {
            newFamilyPermissions[family.id] = true;
        }
        await set(ref(this.db, `/users/${this.auth.uid()}/families`), newFamilyPermissions);

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

    detachChild(child: ConnectedFamily) {
        this.connectedFamilies.update((families) => families.filter((family) => family !== child));
        this.saveConnectedFamilies();

        // Make sure we don't keep a deleted child selected
        if (this.child() === child.name) {
            this.switchToFamilyId(this.connectedFamilies()[0].id);
        }
    }

    /**
     * Save changes to local storage
     */
    saveConnectedFamilies() {
        localStorage['connectedFamilies'] = JSON.stringify(this.connectedFamilies());
    }

    /**
     * Create a new family ID and give the user permission to the family
     * This can happen either as part of initial setup (when the user is being created)
     * Or when a user is adding a child to their profile.
     */
    async createMissingFamily() {
        const key = push(ref(this.db, 'families')).key;
        await set(ref(this.db, `users/${this.auth.uid()}/families/${key}`), true);
        await set(ref(this.db, `families/${key}/`), { creationDate: localeIsoString(new Date()) });
        return key;
    }
    async switchToFamilyId(familyId: string) {
        // Let's see if the user gave this person a name!
        const child = this.connectedFamilies().find((family) => family.id === familyId);
        if (child) {
            this.child.set(child.name);
        }
        // If user doesn't have a family, let's give them one!
        if (!familyId) {
            familyId = await this.createMissingFamily();
        }

        localStorage['lastFamilyId'] = familyId;
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
    deleteEvent(key) {
        if (confirm('Are you sure you want to delete this day?')) {
            remove(ref(this.db, `families/${this.familyId()}/events/${key}`));
        }
    }
    addActivity(
        eventKey: string,
        event,
        activity: string,
        activityDetails: string,
        person?: string
    ) {
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
    deleteActivity(eventKey: string, event: Event, eventIndex, activityIndex: number) {
        if (
            confirm(
                `Are you sure you want to delete this '${event.activities[activityIndex].activity}' entry?`
            )
        ) {
            event.activities.splice(activityIndex, 1);
            this.saveEvent(eventKey, event);
        }
    }

    updateTime(eventKey: string, event: Event, activity, newValue: string) {
        // Format the time as a date, and swap the last 11 chars of the original
        const nt = parse(newValue, 'h:mm a', parseISO(activity.time));
        activity.time = localeIsoString(nt).substring(0, 16);
        this.updateEvent(eventKey, event);
    }
    updateDate(eventKey: string, event: Event, activity, change: number) {
        activity.time = localeIsoString(
            new Date(new Date(activity.time).valueOf() + change * 24 * 60 * 60 * 1000)
        ).substring(0, 16);
        this.updateEvent(eventKey, event);
    }

    /**
     * Update an event after sorting activities
     */
    updateEvent(eventKey: string, event) {
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

/**
 * A signal that starts with the last value stored in localStorage and stores every new value
 */
function cachedSignal<T>(cacheKey: string) {
    let cachedValue: T | null = null;
    try {
        cachedValue = JSON.parse(localStorage[cacheKey]);
    } catch (parseException) {}
    const value = signal<T | null>(cachedValue);
    effect(() => {
        const next = value();
        if (next !== null) {
            localStorage[cacheKey] = JSON.stringify(next);
        }
    });
    return value;
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
