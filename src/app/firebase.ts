import { inject, InjectionToken } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Database, DatabaseReference, getDatabase, onValue, Query } from 'firebase/database';
import { Observable } from 'rxjs';

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

/** Emits the value at a database location every time it changes */
export function objectVal<T>(query: DatabaseReference | Query): Observable<T> {
    return new Observable<T>((subscriber) =>
        onValue(
            query,
            (snapshot) => subscriber.next(snapshot.val()),
            (error) => subscriber.error(error)
        )
    );
}

/** Emits the children of a database location (in query order) every time they change */
export function listChanges<T>(query: DatabaseReference | Query): Observable<{ key: string; value: T }[]> {
    return new Observable((subscriber) =>
        onValue(
            query,
            (snapshot) => {
                const items: { key: string; value: T }[] = [];
                snapshot.forEach((child) => {
                    items.push({ key: child.key, value: child.val() });
                });
                subscriber.next(items);
            },
            (error) => subscriber.error(error)
        )
    );
}
