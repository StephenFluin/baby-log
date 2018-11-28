import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { defineBase } from '@angular/core/src/render3';
import { Auth } from './auth.service';
import { switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserData {
  familyId;
  data;

  constructor(private auth: Auth, private db: AngularFireDatabase) {
    this.auth.uid.pipe(
        tap(uid => console.log('data got a new uid', uid)),
        switchMap(uid => this.db.object(`users/${uid}`).valueChanges()),
        tap(fid => console.log('data got a new fid', fid)),
        switchMap(familyId => {
            if (!familyId) {
                familyId = this.db.list(`families`).push({creationDate: new Date().toISOString()}).key;
                this.db.object(`users/${this.auth.latestUid}`).set(familyId);
            }
            this.familyId = familyId;
            console.log("family ID is ",familyId);
            return this.db.object(`families/${familyId}`).valueChanges();
        }),
        tap(data => console.log('data got a new data', data)),
      )
      .subscribe(data => {
          if (!data) {
              data = {events: []};
          }
          this.data = data;
        });

  }

  save(newData) {
    this.db.object(`families/${this.familyId}`).update(newData);

  }

  createDay() {

    if (!this.data.events) {
        this.data.events = [];
    }
    this.data.events.push({date: new Date().toISOString().substr(0,10)});
    this.save(this.data);
  }
}
