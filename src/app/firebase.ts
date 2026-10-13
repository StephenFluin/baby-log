import { inject, InjectionToken } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectDatabaseEmulator, DataSnapshot, Database, getDatabase } from 'firebase/database';

/** Set by the `emulators` build configuration to use the local Firebase emulators */
declare const USE_FIREBASE_EMULATORS: boolean | undefined;
const useEmulators = typeof USE_FIREBASE_EMULATORS !== 'undefined' && USE_FIREBASE_EMULATORS;

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
    providedIn: 'root',
    factory: () =>
        initializeApp({
            apiKey: 'AIzaSyCl1gfM_tPg777Gfu_zOGWUnnMN4ed0JuI',
            authDomain: 'baby-log-7307f.firebaseapp.com',
            databaseURL: 'https://baby-log-7307f.firebaseio.com',
            projectId: 'baby-log-7307f',
            storageBucket: 'baby-log-7307f.appspot.com',
            messagingSenderId: '121560255493',
        }),
});

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
    providedIn: 'root',
    factory: () => {
        const auth = getAuth(inject(FIREBASE_APP));
        if (useEmulators) {
            connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        }
        return auth;
    },
});

export const FIREBASE_DB = new InjectionToken<Database>('FIREBASE_DB', {
    providedIn: 'root',
    factory: () => {
        const db = getDatabase(inject(FIREBASE_APP));
        if (useEmulators) {
            connectDatabaseEmulator(db, '127.0.0.1', 9000);
        }
        return db;
    },
});

/** Converts the children of a snapshot (in query order) into key/value pairs */
export function snapshotList<T>(snapshot: DataSnapshot): { key: string; value: T }[] {
    const items: { key: string; value: T }[] = [];
    snapshot.forEach((child) => {
        items.push({ key: child.key, value: child.val() });
    });
    return items;
}
