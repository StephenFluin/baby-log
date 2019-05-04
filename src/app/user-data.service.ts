import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { Auth } from './auth.service';
import { switchMap, tap, map, shareReplay } from 'rxjs/operators';
import { empty, Observable, BehaviorSubject } from 'rxjs';

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
    details: string[];
}

@Injectable({
    providedIn: 'root',
})
export class UserData {
    familyId: string;
    /**
     * Synchronous local copy of data that we can modify
     */
    data: Data;
    events: AngularFireList<Event>;
    eventSource = new BehaviorSubject<Observable<{ key: string; value: Event }[]>>(empty());
    eventList: Observable<{ key: string; value: Event }[]> = this.eventSource.pipe(
        switchMap(inner => inner)
    );

    types: AngularFireList<Type>;
    typeSource = new BehaviorSubject<Observable<{ key: string; value: Type }[]>>(empty());
    typeList: Observable<{ key: string; value: Type }[]> = this.typeSource.pipe(
        switchMap(inner => inner)
    );

    timerTimeout;

    constructor(private auth: Auth, private db: AngularFireDatabase) {
        const familyIds = this.auth.uid.pipe(
            tap(uid => console.log('data got a new uid', uid)),
            switchMap(uid => {
                if (!uid) {
                    return empty();
                }
                return this.db.object<string>(`users/${uid}`).valueChanges();
            }),
            tap(familyId => {
                console.log('data got a new fid', familyId);
                if (!familyId) {
                    familyId = this.db
                        .list(`families`)
                        .push({ creationDate: localeIsoString(new Date()) }).key;
                    this.db.object(`users/${this.auth.latestUid}`).set(familyId);
                }
                this.familyId = familyId;
                console.log('family ID is ', familyId);
                this.events = this.db.list(`families/${familyId}/events`, ref =>
                    ref.orderByChild('date').limitToLast(3)
                );
                this.types = this.db.list(`families/${familyId}/types`);

                this.eventSource.next(
                    this.events.snapshotChanges().pipe(
                        map(actions =>
                            actions
                                .map(a => {
                                    const data = a.payload.val() as Event;
                                    const key = a.payload.key;
                                    return { key: key, value: data };
                                })
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
            })
        );
        familyIds.subscribe(next => {
            // One global subscription just to make the above work and populate our events
        });
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
        if (confirm('Are you sure you want to save this thing into the database?')) {
            event.activities.splice(activityIndex, 1);
            this.saveEvent(eventKey, event);
        }
    }
    updateTime(eventKey: number, event, activityIndex: number, newValue: string, domEvent: Event) {
        if (this.timerTimeout) {
            clearTimeout(this.timerTimeout);
        }
        this.timerTimeout = setTimeout(() => {
            event.activities[activityIndex].time = newValue;
            this.saveEvent(eventKey, event);
            this.timerTimeout = null;
        }, 3000);
    }

    join(uid, familyId) {
        this.db.object(`users/${uid}`).set(familyId);
        window.location.reload();
    }
}

export function localeIsoString(date) {
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
