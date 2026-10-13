import { inject, Injectable } from '@angular/core';

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { map, shareReplay, startWith } from 'rxjs/operators';

import { shareAndCache } from 'http-operators';
import { Observable } from 'rxjs';
import { FIREBASE_AUTH } from './firebase';

@Injectable({
    providedIn: 'root',
})
export class Auth {
    private afAuth = inject(FIREBASE_AUTH);
    private authState = new Observable<User | null>((subscriber) =>
        onAuthStateChanged(
            this.afAuth,
            (user) => subscriber.next(user),
            (error) => subscriber.error(error)
        )
    );

    uid: Observable<any>;
    state: Observable<User>;


    latestUid = null;
    constructor() {
        this.uid = this.authState.pipe(
            startWith(localStorage['savedCreds']),
            map(state => {
                if (state) {
                    return state.uid;
                } else {
                    return null;
                }
            }),
            // tap(n => console.log('uid is', n)),
            shareReplay(1),
        );
        this.uid.subscribe(next => (this.latestUid = next));
        this.state = this.authState.pipe(shareAndCache('authState'));
    }
    login() {
        signInWithPopup(this.afAuth, new GoogleAuthProvider())
        .then(credential => {
            localStorage['savedCreds'] = credential.user.uid;
        });
    }
    logout() {
        signOut(this.afAuth);
        localStorage.removeItem('savedCreds');
    }
}
