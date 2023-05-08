import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { map, shareReplay, startWith } from 'rxjs/operators';

import { shareAndCache } from 'http-operators';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class Auth {
    uid: Observable<any>;
    state: Observable<firebase.User>;


    latestUid = null;
    constructor(private afAuth: AngularFireAuth) {
        console.log('afAuth is ', afAuth);

        this.uid = this.afAuth.authState.pipe(
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
        this.state = this.afAuth.authState.pipe(shareAndCache('authState'));
    }
    login() {
        this.afAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
        .then(credential => {
            localStorage['savedCreds'] = credential.user.uid;
        });
    }
    logout() {
        this.afAuth.signOut();
        localStorage.removeItem('savedCreds');
    }
}
