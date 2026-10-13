import { inject, InjectionToken, isDevMode } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectDatabaseEmulator, DataSnapshot, Database, getDatabase } from 'firebase/database';

/** Set by the `emulators` build configuration to use the local Firebase emulators */
declare const USE_FIREBASE_EMULATORS: boolean | undefined;
const useEmulators = typeof USE_FIREBASE_EMULATORS !== 'undefined' && USE_FIREBASE_EMULATORS;

/**
 * reCAPTCHA Enterprise site key for App Check (see README). App Check is off until this is set.
 * Site keys are public, so it's fine to commit.
 */
const APP_CHECK_SITE_KEY = '';

export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP', {
    providedIn: 'root',
    factory: () => {
        const app = initializeApp({
            apiKey: 'AIzaSyCl1gfM_tPg777Gfu_zOGWUnnMN4ed0JuI',
            authDomain: 'baby-log-7307f.firebaseapp.com',
            databaseURL: 'https://baby-log-7307f.firebaseio.com',
            projectId: 'baby-log-7307f',
            storageBucket: 'baby-log-7307f.appspot.com',
            messagingSenderId: '121560255493',
        });
        if (APP_CHECK_SITE_KEY && !useEmulators) {
            if (isDevMode()) {
                // Logs a debug token to register in the Firebase console for local development
                (self as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
            }
            initializeAppCheck(app, {
                provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
                isTokenAutoRefreshEnabled: true,
            });
        }
        return app;
    },
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
