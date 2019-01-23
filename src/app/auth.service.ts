import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { auth } from 'firebase/app';
import { map, shareReplay, tap, share, startWith } from 'rxjs/operators';
@Injectable({
    providedIn: 'root',
})
export class Auth {
    uid = this.afAuth.authState.pipe(
        startWith(localStorage['savedCreds']),
        map(state => {
            if (state) {
                return state.uid;
            } else {
                return null;
            }
        }),
        tap(n => console.log('uid is', n)),
        shareReplay(1),
    );
    state = this.afAuth.authState.pipe(shareReplay(1));


    latestUid = null;
    constructor(private afAuth: AngularFireAuth) {
        this.uid.subscribe(next => (this.latestUid = next));
    }
    login() {
        this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider())
        .then(credential => {
            localStorage['savedCreds'] = credential.user.uid;
        });
    }
    logout() {
        this.afAuth.auth.signOut();
        localStorage.removeItem('savedCreds');
    }
}
