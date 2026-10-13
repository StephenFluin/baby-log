import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Auth } from './auth.service';
import { FIREBASE_DB } from './firebase';
import { sortEvents, UserData } from './user-data.service';

describe('sortEvents', () => {
    it('sorts newest day first, preferring the day with more activities on ties', () => {
        const activity = { activity: 'feed', activityDetails: '', time: '2026-10-12T08:00' };
        const sorted = sortEvents([
            { key: 'a', value: { date: '2026-10-11', activities: [] } },
            { key: 'b', value: { date: '2026-10-12', activities: [] } },
            { key: 'c', value: { date: '2026-10-12', activities: [activity] } },
        ]);
        expect(sorted.map((event) => event.key)).toEqual(['c', 'b', 'a']);
    });

    it('fills in activities that Firebase dropped because they were empty', () => {
        const [event] = sortEvents([{ key: 'a', value: { date: '2026-10-11' } as any }]);
        expect(event.value.activities).toEqual([]);
    });
});

describe('UserData', () => {
    let userData: UserData;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [
                // Signed out, so nothing talks to Firebase
                { provide: Auth, useValue: { user: signal(null), uid: signal(null) } },
                { provide: FIREBASE_DB, useValue: {} },
            ],
        });
        userData = TestBed.inject(UserData);
    });

    it('maps type names to their detail options', () => {
        userData.types.set([
            { key: '1', value: { name: 'feed', details: ['left', 'right'] } },
            { key: '2', value: { name: 'diaper' } },
        ]);
        expect(userData.typeDetails()).toEqual({ feed: ['left', 'right'], diaper: [] });
    });

    it('removes data cached by older versions', () => {
        localStorage.setItem('authState', '{"stsTokenManager":{}}');
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                { provide: Auth, useValue: { user: signal(null), uid: signal(null) } },
                { provide: FIREBASE_DB, useValue: {} },
            ],
        });
        TestBed.inject(UserData);
        expect(localStorage.getItem('authState')).toBeNull();
    });
});
