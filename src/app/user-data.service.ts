import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { Auth } from './auth.service';
import { switchMap, tap, map, shareReplay } from 'rxjs/operators';
import { Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { shareAndCache } from 'http-operators';

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

@Injectable({
    providedIn: 'root',
})
export class UserData {
    familyId: string;
    child: string = null;
    connectedFamilies: { id: string; name: string }[];

    status: 'waiting' | 'ready' = 'waiting';
    /**
     * Synchronous local copy of data that we can modify
     */
    data: Data;
    /** Modifiable version of the AngularFire list */
    events: AngularFireList<Event>;
    /** Temporary storage for events source, (basically which family the events are stored in)  */
    eventSource = new BehaviorSubject<Observable<{ key: string; value: Event }[]>>(EMPTY);
    eventList: Observable<{ key: string; value: Event }[]> = this.eventSource.pipe(
        switchMap((inner) => inner),
        tap(() => (this.status = 'ready')),
        shareAndCache('events')
    );

    /** Modifiable version of the AngularFire list */
    types: AngularFireList<ActivityType>;
    /** Temporary storage for type source, (basically which family the events are stored in) */
    typeSource = new BehaviorSubject<Observable<{ key: string; value: ActivityType }[]>>(EMPTY);
    typeList: Observable<{ key: string; value: ActivityType }[]> = this.typeSource.pipe(
        switchMap((inner) => inner),
        shareAndCache('types')
    );

    constructor(private auth: Auth, private db: AngularFireDatabase) {
        // Get the user's families from the DB / local storage and save the data synchronously
        this.auth.uid
            .pipe(
                tap((uid) => console.log('User is logged in:', uid)),
                // We need this so logout triggers emptying of data
                switchMap((uid) => {
                    if (!uid) {
                        return EMPTY;
                    }
                    return this.db
                        .object<string | { families: { [key: string]: boolean } }>(`users/${uid}`)
                        .valueChanges();
                }),
                tap((familyIdOrMap) => {
                    if (typeof familyIdOrMap === 'string') {
                        this.switchToFamilyId(familyIdOrMap);
                    } else {
                        console.log('defaulting to lastfamily, or first entry in', familyIdOrMap);
                        const id =
                            localStorage['lastFamilyId'] ||
                            Object.keys(familyIdOrMap?.families || {})[0] ||
                            null;
                        this.switchToFamilyId(id);
                    }
                })
            )
            .subscribe((next) => {
                // One global subscription just to make the above work and populate our events
            });
        this.connectedFamilies = JSON.parse(localStorage['connectedFamilies'] || '[]');
    }

    /**
     * Push a new connected family into the DB for the user
     * Switch to the family
     */
    async connectNewFamily(id: string, name: string) {
        if (!id) {
            id = await this.createMissingFamily();
        }
        this.connectedFamilies.push({ id, name });
        // First create permissions on the new family
        const newFamilyPermissions = {};
        for (const family of this.connectedFamilies) {
            newFamilyPermissions[family.id] = true;
        }
        await this.db.object(`/users/${this.auth.latestUid}/families`).set(newFamilyPermissions);
        console.log(
            `/users/${this.auth.latestUid}/families`,
            'updated to say',
            newFamilyPermissions
        );

        // Then update UI and render
        this.saveConnectedFamilies();
        this.switchToFamilyId(id);
    }

    nameChild(name: string) {
        this.connectNewFamily(this.familyId, name);
    }

    /**
     * Save changes to local storage
     */
    saveConnectedFamilies() {
        localStorage['connectedFamilies'] = JSON.stringify(this.connectedFamilies);
    }

    /**
     * Create a new family ID and give the user permission to the family
     * This can happen either as part of initial setup (when the user is being created)
     * Or when a user is adding a child to their profile.
     */
    async createMissingFamily() {
        console.log('Creating a brand new family!');
        const key = newPushId();
        console.log('using key', key);
        await this.db.object(`users/${this.auth.latestUid}/families/${key}`).set(true);
        await this.db.object(`families/${key}/`).set({ creationDate: localeIsoString(new Date()) });
        console.log('family created (' + key + '), permissions should be good to go!');
        return key;
    }
    async switchToFamilyId(familyId: string) {
        console.log('rendering family', familyId);
        // Let's see if the user gave this person a name!
        // Names are only EVER stored client side for privacy reasons
        const child = this.connectedFamilies.find((family) => family.id === familyId);
        if (child) {
            this.child = child.name;
        }
        // If user doesn't have a family, let's give them one!
        if (!familyId) {
            familyId = await this.createMissingFamily();
        }

        localStorage['lastFamilyId'] = familyId;
        this.familyId = familyId;

        // Save firebase objects so we can add/remove from lists
        this.events = this.db.list(`families/${familyId}/events`, (ref) =>
            ref.orderByChild('date').limitToLast(5)
        );
        this.types = this.db.list(`families/${familyId}/types`);

        // Save a new event source based on the current family
        this.eventSource.next(
            this.events.snapshotChanges().pipe(
                map((actions) =>
                    actions
                        .map((a) => {
                            const data = a.payload.val() as Event;
                            const key = a.payload.key;
                            const value = { key: key, value: data };
                            if (!value.value.activities) {
                                value.value.activities = [];
                            }
                            return value;
                        })
                        // Sort date ascending, bigger days break ties
                        .sort((a, b) =>
                            a.value.date > b.value.date
                                ? -1
                                : a.value.date === b.value.date &&
                                  a.value.activities.length > b.value.activities.length
                                ? -1
                                : 1
                        )
                )
            )
        );
        this.typeSource.next(
            this.types.snapshotChanges().pipe(
                map((actions) =>
                    actions.map((a) => {
                        return { key: a.payload.key, value: a.payload.val() };
                    })
                ),
                shareReplay(1)
            )
        );
    }

    saveEvent(key: string, data: Event) {
        this.db.object(`families/${this.familyId}/events/${key}`).update(data);
    }

    createEvent() {
        this.events.push({
            date: localeIsoString(new Date()).substr(0, 10),
            activities: [],
        });
    }
    deleteEvent(key) {
        if (confirm('Are you sure you want to delete this day?')) {
            this.events.remove(key);
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

    updateTime(eventKey: string, event: Event, activity, newValue: string, domEvent: Event) {
        // Format the time as a date, and swap the last 11 chars of the original
        const nt = parse(newValue, 'h:mm a', parseISO(activity.time));
        // console.log('new datetime is ', nt);
        activity.time = localeIsoString(nt).substring(0, 16);
        // console.log('setting activity time to the first 16 chars of this', activity.time);
        this.updateEvent(eventKey, event);
    }
    updateDate(eventKey: string, event: Event, activity, change: number) {
        console.log(activity, change);
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
        // console.log('saving event',event,eventKey);
        this.saveEvent(eventKey, event);
    }

    join(uid, familyId) {
        this.db.object(`users/${uid}`).set(familyId);
        window.location.reload();
    }

    updateTypeDetail(typeId: string, newDetail: string[]) {
        const path = `families/${this.familyId}/types/${typeId}/details`;
        console.log('updating', path, 'with', newDetail);
        this.db
            .object<string[]>(path)
            .set(newDetail)
            .then(() => console.log('done updating details'))
            .catch((err) => console.log(err, 'when updating details'));
    }
}
/**
 * Returns a string that looks like 2020-01-02T17:53-08:00
 */
export function localeIsoString(date: Date) {
    return formatISO(date, { representation: 'complete' });
}

export function newPushId() {
    // Modeled after base64 web-safe chars, but ordered by ASCII.
    const PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

    // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
    let lastPushTime = 0;

    // We generate 72-bits of randomness which get turned into 12 characters and appended to the
    // timestamp to prevent collisions with other clients.  We store the last characters we
    // generated because in the event of a collision, we'll use those same characters except
    // "incremented" by one.
    const lastRandChars = [];

    let now = new Date().getTime();
    const duplicateTime = now === lastPushTime;
    lastPushTime = now;

    const timeStampChars = new Array(8);
    for (let i = 7; i >= 0; i--) {
        timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
        // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
        now = Math.floor(now / 64);
    }
    if (now !== 0) {
        throw new Error('We should have converted the entire timestamp.');
    }

    let id = timeStampChars.join('');

    if (!duplicateTime) {
        for (let i = 0; i < 12; i++) {
            lastRandChars[i] = Math.floor(Math.random() * 64);
        }
    } else {
        // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
        let i;
        for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
            lastRandChars[i] = 0;
        }
        lastRandChars[i]++;
    }
    for (let i = 0; i < 12; i++) {
        id += PUSH_CHARS.charAt(lastRandChars[i]);
    }
    if (id.length !== 20) {
        throw new Error('Length should be 20.');
    }

    return id;
}
