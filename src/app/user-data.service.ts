import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { defineBase } from '@angular/core/src/render3';
import { Auth } from './auth.service';
import { switchMap, tap } from 'rxjs/operators';

export interface Data {
    events: {
        date: string;
        activities: {
            activity: string;
            activityDetails: string;
            person?: string;
            time: string;
        }[];
    }[];
}

@Injectable({
    providedIn: 'root',
})
export class UserData {
    familyId;
    data: Data;

    constructor(private auth: Auth, private db: AngularFireDatabase) {
        this.auth.uid
            .pipe(
                tap(uid => console.log('data got a new uid', uid)),
                switchMap(uid => this.db.object(`users/${uid}`).valueChanges()),
                tap(fid => console.log('data got a new fid', fid)),
                switchMap(familyId => {
                    if (!familyId) {
                        familyId = this.db
                            .list(`families`)
                            .push({ creationDate: new Date().toISOString() }).key;
                        this.db.object(`users/${this.auth.latestUid}`).set(familyId);
                    }
                    this.familyId = familyId;
                    console.log('family ID is ', familyId);
                    return this.db.object(`families/${familyId}`).valueChanges();
                }),
                tap(data => console.log('data got a new data', data))
            )
            .subscribe(data => {
                if (!data) {
                    data = { events: [] };
                }
                this.data = <Data>data;
            });
    }

    save() {
        this.db.object(`families/${this.familyId}`).update(this.data);
    }

    createDay() {
        if (!this.data.events) {
            this.data.events = [];
        }
        this.data.events.unshift({ date: new Date().toISOString().substr(0, 10), activities: [] });
        this.save();
    }
    deleteDay(index: number) {
        this.data.events.splice(index, 1);
        this.save();
    }
    addActivity(index: number, activity: string, activityDetails: string, person?: string) {
        if (!this.data.events[index].activities) {
            this.data.events[index].activities = [];
        }
        this.data.events[index].activities.unshift({
            activity: activity,
            activityDetails: activityDetails,
            time: new Date().toISOString().substring(0, 16),
        });
        this.save();
    }
    deleteActivity(eventIndex: number, activityIndex: number) {
        this.data.events[eventIndex].activities.splice(activityIndex, 1);
        this.save();
    }
    updateTime(eventIndex: number, activityIndex: number, newValue: string) {
        this.data.events[eventIndex].activities[activityIndex].time = newValue;
        this.save();
    }
}
