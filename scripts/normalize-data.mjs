#!/usr/bin/env node
/**
 * Cleans up data written by older versions of the app.
 *
 * Reads exports of /families and /users and writes a multi-path update (for
 * `firebase database:update /`) plus a backup of every path it changes or deletes.
 * Nothing is written to the database by this script.
 *
 * Usage:
 *   node scripts/normalize-data.mjs families.json users.json [--merge-days] [--skip=fix,fix]
 *
 * Fixes (all on by default except merge-days):
 *   times        repair times with stray spaces, colons, or quotes
 *   order        sort each day's activities newest first
 *   empty-dupes  delete empty days that share a date with another entry
 *   empty-old    delete other empty days more than a week old
 *   merge-days   merge entries that share a date into the earliest one (opt in)
 *   stale        remove families from users' lists when they're no longer members
 *   legacy-users convert single-family user records to the standard format
 *   orphans      delete families with no members and no events
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const [familiesFile, usersFile] = args.filter((arg) => !arg.startsWith('--'));
if (!familiesFile || !usersFile) {
    console.error('Usage: node scripts/normalize-data.mjs families.json users.json [--merge-days] [--skip=...]');
    process.exit(1);
}
const skip = new Set((args.find((arg) => arg.startsWith('--skip=')) ?? '--skip=').slice(7).split(',').filter(Boolean));
const enabled = (fix) => !skip.has(fix) && (fix !== 'merge-days' || args.includes('--merge-days'));

const families = JSON.parse(readFileSync(familiesFile, 'utf8')) ?? {};
const users = JSON.parse(readFileSync(usersFile, 'utf8')) ?? {};

const updates = {};
const backup = {};
const counts = {};
const count = (fix, n = 1) => (counts[fix] = (counts[fix] ?? 0) + n);
const write = (path, value, original) => {
    updates[path] = value;
    backup[path] = original ?? null;
};

/** Firebase returns sparse arrays for keys 0..n, so read either shape */
const entries = (value) =>
    Array.isArray(value)
        ? value.map((item, index) => [String(index), item]).filter(([, item]) => item != null)
        : Object.entries(value ?? {}).filter(([, item]) => item != null);

const TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function repairTime(time) {
    if (typeof time !== 'string' || TIME.test(time)) {
        return time;
    }
    const cleaned = time.replace(/[\s '"]/g, '');
    const match = cleaned.match(/^(\d{4}-\d{2}-\d{2})T(\d{1,2}):?(\d{2})/);
    return match ? `${match[1]}T${match[2].padStart(2, '0')}:${match[3]}` : time;
}

const newestFirst = (a, b) => (a.time > b.time ? -1 : a.time < b.time ? 1 : 0);

for (const [familyId, family] of Object.entries(families)) {
    if (!family) {
        continue;
    }
    if (!family.members && !family.events) {
        if (enabled('orphans')) {
            write(`families/${familyId}`, null, family);
            count('orphans');
        }
        continue;
    }

    const events = entries(family.events);
    const byDate = new Map();
    for (const [key, event] of events) {
        const list = byDate.get(event.date) ?? [];
        list.push([key, event]);
        byDate.set(event.date, list);
    }

    const deleted = new Set();
    const activitiesFor = new Map(events.map(([key, event]) => [key, entries(event.activities).map(([, a]) => ({ ...a }))]));
    const changed = new Set();

    for (const [date, sameDate] of byDate) {
        const nonEmpty = sameDate.filter(([key]) => activitiesFor.get(key).length);
        const empty = sameDate.filter(([key]) => !activitiesFor.get(key).length);
        if (sameDate.length > 1 && empty.length && enabled('empty-dupes')) {
            // Keep one entry for the date if they're all empty
            for (const [key] of nonEmpty.length ? empty : empty.slice(1)) {
                deleted.add(key);
                count('empty-dupes');
            }
        }
        if (enabled('empty-old') && sameDate.length === 1 && empty.length === 1 && date && date < WEEK_AGO) {
            deleted.add(empty[0][0]);
            count('empty-old');
        }
        if (enabled('merge-days') && nonEmpty.length > 1) {
            const [keep, ...rest] = nonEmpty;
            for (const [key] of rest) {
                activitiesFor.get(keep[0]).push(...activitiesFor.get(key));
                deleted.add(key);
                count('merge-days');
            }
            changed.add(keep[0]);
        }
    }

    for (const [key, event] of events) {
        if (deleted.has(key)) {
            write(`families/${familyId}/events/${key}`, null, event);
            continue;
        }
        const activities = activitiesFor.get(key);
        if (enabled('times')) {
            for (const activity of activities) {
                const repaired = repairTime(activity.time);
                if (repaired !== activity.time) {
                    activity.time = repaired;
                    changed.add(key);
                    count('times');
                }
            }
        }
        if (enabled('order') || changed.has(key)) {
            const sorted = [...activities].sort(newestFirst);
            if (sorted.some((activity, index) => activity !== activities[index])) {
                activities.splice(0, activities.length, ...sorted);
                changed.add(key);
                count('order');
            }
        }
        if (changed.has(key)) {
            write(`families/${familyId}/events/${key}/activities`, activities, event.activities);
        }
    }
}

for (const [uid, record] of Object.entries(users)) {
    if (typeof record === 'string') {
        if (enabled('legacy-users')) {
            write(`users/${uid}`, { families: { [record]: true } }, record);
            count('legacy-users');
        }
        continue;
    }
    for (const familyId of Object.keys(record?.families ?? {})) {
        if (enabled('stale') && !families[familyId]?.members?.[uid]) {
            write(`users/${uid}/families/${familyId}`, null, true);
            count('stale');
        }
    }
}

writeFileSync('normalize-update.json', JSON.stringify(updates, null, 2));
writeFileSync('normalize-backup.json', JSON.stringify(backup, null, 2));
console.log('Changes by fix:', counts);
console.log(`Wrote ${Object.keys(updates).length} paths to normalize-update.json (backup in normalize-backup.json)`);
