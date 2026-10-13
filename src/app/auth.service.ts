import { computed, inject, Injectable, signal } from '@angular/core';

import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { FIREBASE_AUTH } from './firebase';

@Injectable({
    providedIn: 'root',
})
export class Auth {
    private afAuth = inject(FIREBASE_AUTH);

    /** The signed in user, null when signed out, or undefined until Firebase restores the session */
    readonly user = signal<User | null | undefined>(undefined);
    readonly uid = computed(() => this.user()?.uid ?? null);

    constructor() {
        onAuthStateChanged(this.afAuth, (user) => this.user.set(user));
    }
    login() {
        signInWithPopup(this.afAuth, new GoogleAuthProvider());
    }
    logout() {
        signOut(this.afAuth);
    }
}
