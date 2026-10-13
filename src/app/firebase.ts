import { inject, InjectionToken } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { DataSnapshot, Database, getDatabase } from 'firebase/database';

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
    factory: () => getAuth(inject(FIREBASE_APP)),
});

export const FIREBASE_DB = new InjectionToken<Database>('FIREBASE_DB', {
    providedIn: 'root',
    factory: () => getDatabase(inject(FIREBASE_APP)),
});

/** Converts the children of a snapshot (in query order) into key/value pairs */
export function snapshotList<T>(snapshot: DataSnapshot): { key: string; value: T }[] {
    const items: { key: string; value: T }[] = [];
    snapshot.forEach((child) => {
        items.push({ key: child.key, value: child.val() });
    });
    return items;
}
