#!/usr/bin/env node
/**
 * One-time migration to the invite-based database rules.
 *
 * Access used to come from each user's own `users/$uid/families` list. The new rules use
 * `families/$fid/members` instead, so this turns every family a user has listed into a
 * membership. Run it right before deploying the new rules (see README.md).
 *
 * Usage:
 *   node scripts/migrate-members.mjs users.json [auth-users.json] > members.json
 *
 * users.json comes from `firebase database:get /users`, and the optional auth-users.json from
 * `firebase auth:export auth-users.json --format=json` (for members' display names).
 */
import { readFileSync } from 'node:fs';

const [usersFile, authFile] = process.argv.slice(2);
if (!usersFile) {
    console.error('Usage: node scripts/migrate-members.mjs users.json [auth-users.json]');
    process.exit(1);
}

const users = JSON.parse(readFileSync(usersFile, 'utf8')) ?? {};
const names = new Map();
if (authFile) {
    for (const user of JSON.parse(readFileSync(authFile, 'utf8')).users ?? []) {
        names.set(user.localId, user.displayName);
    }
}

const joined = Date.now();
const updates = {};
for (const [uid, record] of Object.entries(users)) {
    // Very old accounts stored a single family ID instead of a map of them
    const familyIds = typeof record === 'string' ? [record] : Object.keys(record?.families ?? {});
    for (const familyId of familyIds) {
        const name = (names.get(uid) || 'Family member').slice(0, 100);
        updates[`families/${familyId}/members/${uid}`] = { name, joined };
    }
}

console.error(`Adding ${Object.keys(updates).length} memberships for ${Object.keys(users).length} users`);
console.log(JSON.stringify(updates, null, 2));
