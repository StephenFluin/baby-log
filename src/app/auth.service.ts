import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { map, shareReplay, tap } from 'rxjs/operators';
@Injectable({
    providedIn: 'root',
})
export class Auth {
    uid = this.afAuth.authState.pipe(
        map(state => {
            if (state) {
                return state.uid;
            } else {
                return null;
            }
        }),
        tap(n => {
            console.log('uid is', n);
        }),
        shareReplay(1),
    );
    state = this.afAuth.authState;

    latestUid = null;
    constructor(private afAuth: AngularFireAuth) {
        this.uid.subscribe(next => (this.latestUid = next));
    }
    login() {
        this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
    }
    logout() {
        this.afAuth.auth.signOut();
    }
}
