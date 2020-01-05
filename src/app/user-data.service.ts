import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { Auth } from './auth.service';
import { switchMap, tap, map, shareReplay } from 'rxjs/operators';
import { empty, Observable, BehaviorSubject, EMPTY } from 'rxjs';
import { shareAndCache } from 'http-operators';

export interface Data {
    events: Event[];
}
export interface Event {
    date: string;
    activities: {
        activity: string;
        activityDetails: string;
        person?: string;
        time: string;
    }[];
    summary?;
}
export interface Type {
    name: string;
    details?: string[];
}

@Injectable({
    providedIn: 'root',
})
export class UserData {
    familyId: string;

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
        switchMap(inner => inner),
        tap(() => (this.status = 'ready')),
        shareAndCache('events')
    );

    /** Modifiable version of the AngularFire list */
    types: AngularFireList<Type>;
    /** Temporary storage for type source, (basically which family the events are stored in) */
    typeSource = new BehaviorSubject<Observable<{ key: string; value: Type }[]>>(EMPTY);
    typeList: Observable<{ key: string; value: Type }[]> = this.typeSource.pipe(
        switchMap(inner => inner),
        shareAndCache('types')
    );

    constructor(private auth: Auth, private db: AngularFireDatabase) {
        const familyIds = this.auth.uid.pipe(
            tap(uid => console.log('data got a new uid', uid)),
            // We need this so logout triggers emptying of data
            switchMap(uid => {
                if (!uid) {
                    return EMPTY;
                }
                return this.db.object<string>(`users/${uid}`).valueChanges();
            }),
            tap(familyId => this.newFamilyId(familyId))
        );
        familyIds.subscribe(next => {
            // One global subscription just to make the above work and populate our events
        });
    }
    newFamilyId(familyId: string) {
        {
            // If user doesn't have a family, let's give them one!
            if (!familyId) {
                familyId = this.db
                    .list(`families`)
                    .push({ creationDate: localeIsoString(new Date()) }).key;
                this.db.object(`users/${this.auth.latestUid}`).set(familyId);
            }

            this.familyId = familyId;
            console.log('family ID is ', familyId);

            // Save firebase objects so we can add/remove from lists
            this.events = this.db.list(`families/${familyId}/events`, ref =>
                ref.orderByChild('date').limitToLast(3)
            );
            this.types = this.db.list(`families/${familyId}/types`);

            // Save a new event source based on the current family
            this.eventSource.next(
                this.events.snapshotChanges().pipe(
                    map(actions =>
                        actions
                            .map(a => {
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
                    map(actions =>
                        actions.map(a => {
                            return { key: a.payload.key, value: a.payload.val() };
                        })
                    ),
                    shareReplay(1)
                )
            );
        }
    }

    saveEvent(key, data) {
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
    deleteActivity(eventKey: string, event, activityIndex: number) {
        if (confirm('Are you sure you want to delete this activity?')) {
            event.activities.splice(activityIndex, 1);
            this.saveEvent(eventKey, event);
        }
    }

    updateTime(eventKey: number, event: Event, activity, newValue: string, domEvent: Event) {
        // Format the time as a date, and swap the last 11 chars of the original
        const newTime =
            activity.time.substring(0, 11) +
            localeIsoString(new Date(`2000-01-01 ${newValue}`)).substring(11);
        activity.time = newTime.substring(0, 16);
        this.updateEvent(eventKey, event);
    }
    updateDate(eventKey: number, event: Event, activity, change: number) {
        console.log(activity, change);
        activity.time = localeIsoString(
            new Date(new Date(activity.time).valueOf() + change * 24 * 60 * 60 * 1000)
        ).substring(0, 16);
        this.updateEvent(eventKey, event);
    }

    /**
     * Update an event after sorting activities
     */
    updateEvent(eventKey: number, event) {
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

    join(uid, familyId) {
        this.db.object(`users/${uid}`).set(familyId);
        window.location.reload();
    }
}
/**
 * Returns a string that looks like 2020-01-02T17:53-08:00
 */
export function localeIsoString(date: Date) {
    const tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            const norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
    return (
        date.getFullYear() +
        '-' +
        pad(date.getMonth() + 1) +
        '-' +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        ':' +
        pad(date.getMinutes()) +
        ':' +
        pad(date.getSeconds()) +
        dif +
        pad(tzo / 60) +
        ':' +
        pad(tzo % 60)
    );
}
