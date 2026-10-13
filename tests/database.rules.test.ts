import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { get, ref, remove, serverTimestamp, set, update } from 'firebase/database';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const DAY = 24 * 60 * 60 * 1000;
const TOKEN = 'abcdefghijklmnopqrstuvwxyz0123456789';

const db = (uid: string) => env.authenticatedContext(uid).database();
const member = (name: string) => ({ name, joined: serverTimestamp() });

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-baby-log',
        database: {
            host: '127.0.0.1',
            port: 9000,
            rules: readFileSync('database.rules.json', 'utf8'),
        },
    });
});
afterAll(() => env.cleanup());

beforeEach(async () => {
    await env.clearDatabase();
    // Alice has a family with one invite
    await env.withSecurityRulesDisabled(async (context) => {
        await set(ref(context.database(), 'families/fam'), {
            creationDate: '2026-10-13',
            members: { alice: { name: 'Alice', joined: 1 } },
            events: { e1: { date: '2026-10-13', activities: [{ activity: 'feed', time: '2026-10-13T08:00' }] } },
        });
        await set(ref(context.database(), `invites/${TOKEN}`), {
            familyId: 'fam',
            childName: 'Ada',
            role: 'caregiver',
            createdBy: 'alice',
            expires: Date.now() + DAY,
        });
    });
});

describe('families', () => {
    it('lets members read and write the log', async () => {
        await assertSucceeds(get(ref(db('alice'), 'families/fam/events')));
        await assertSucceeds(set(ref(db('alice'), 'families/fam/events/e2'), { date: '2026-10-14' }));
    });

    it("keeps everyone else out, even if they add the family to their own user record", async () => {
        await assertSucceeds(set(ref(db('mallory'), 'users/mallory/families/fam'), true));
        await assertFails(get(ref(db('mallory'), 'families/fam')));
        await assertFails(set(ref(db('mallory'), 'families/fam/events/e2'), { date: '2026-10-14' }));
        await assertFails(get(ref(env.unauthenticatedContext().database(), 'families/fam')));
    });

    it('lets a user create a new family with only themselves as a member', async () => {
        await assertSucceeds(
            set(ref(db('bob'), 'families/new'), { creationDate: '2026-10-13', members: { bob: member('Bob') } })
        );
        await assertFails(
            set(ref(db('bob'), 'families/other'), {
                members: { bob: member('Bob'), alice: member('Alice') },
            })
        );
    });

    it("doesn't let anyone take over an existing family by recreating it", async () => {
        await assertFails(set(ref(db('mallory'), 'families/fam'), { members: { mallory: member('M') } }));
    });

    it("lets members name the child, for everyone who can see the log", async () => {
        await assertSucceeds(set(ref(db('alice'), 'families/fam/name'), 'Ada'));
        await assertFails(set(ref(db('alice'), 'families/fam/name'), 'x'.repeat(101)));
        await assertFails(set(ref(db('mallory'), 'families/fam/name'), 'Mallory'));
        await assertSucceeds(
            set(ref(db('bob'), 'families/named'), {
                name: 'Bo',
                members: { bob: member('Bob') },
            })
        );
    });

    it('validates log entries', async () => {
        await assertFails(
            set(ref(db('alice'), 'families/fam/events/e1/activities/0/notes'), 'x'.repeat(2001))
        );
        await assertFails(
            set(ref(db('alice'), 'families/fam/events/e3'), {
                activities: [{ activity: 'feed', time: '2026-10-13T08:00' }],
            })
        );
        await assertFails(set(ref(db('alice'), 'families/fam/somethingElse'), true));
    });
});

describe('invites', () => {
    const OTHER_TOKEN = 'zyxwvutsrqponmlkjihgfedcba';
    const join = (uid: string, token = TOKEN, familyId = 'fam', role = 'caregiver') =>
        update(ref(db(uid)), {
            [`families/${familyId}/members/${uid}`]: { ...member(uid), invite: token, role },
            [`invites/${token}`]: null,
        });
    const invite = (uid: string, expires = Date.now() + DAY, familyId = 'fam', role = 'caregiver') =>
        set(ref(db(uid), `invites/${OTHER_TOKEN}`), { familyId, createdBy: uid, expires, role });

    it('lets members create invites that expire within 30 days', async () => {
        await assertSucceeds(invite('alice'));
        await assertFails(invite('alice', Date.now() + 60 * DAY));
    });

    it("doesn't let non-members create invites", async () => {
        await assertFails(invite('mallory'));
    });

    it("doesn't let invites be changed, or listed", async () => {
        await assertFails(set(ref(db('alice'), `invites/${TOKEN}/expires`), Date.now() + 2 * DAY));
        await assertFails(get(ref(db('alice'), 'invites')));
    });

    it('lets anyone signed in look up an invite they have the token for', async () => {
        await assertSucceeds(get(ref(db('bob'), `invites/${TOKEN}`)));
        await assertFails(get(ref(env.unauthenticatedContext().database(), `invites/${TOKEN}`)));
    });

    it("doesn't let an invite to one family be used for another", async () => {
        await env.withSecurityRulesDisabled((context) =>
            set(ref(context.database(), 'families/other/members/carol'), { name: 'Carol', joined: 1 })
        );
        await assertFails(join('bob', TOKEN, 'other'));
    });

    it('lets someone with an invite join, using it up', async () => {
        await assertSucceeds(join('bob'));
        await assertSucceeds(get(ref(db('bob'), 'families/fam/events')));
        await assertFails(join('carol'));
    });

    it('requires the invite to be used up while joining', async () => {
        await assertFails(
            set(ref(db('bob'), 'families/fam/members/bob'), {
                ...member('Bob'),
                invite: TOKEN,
                role: 'caregiver',
            })
        );
        await assertFails(remove(ref(db('bob'), `invites/${TOKEN}`)));
    });

    it('gives exactly the role the invite was for', async () => {
        await assertFails(join('bob', TOKEN, 'fam', 'manager'));
        await assertSucceeds(join('bob', TOKEN, 'fam', 'caregiver'));
    });

    it('treats invites from before roles existed as caregiver invites', async () => {
        await env.withSecurityRulesDisabled((context) =>
            set(ref(context.database(), `invites/${TOKEN}/role`), null)
        );
        await assertFails(join('bob', TOKEN, 'fam', 'manager'));
        await assertSucceeds(join('bob', TOKEN, 'fam', 'caregiver'));
    });

    it('requires invites to say which role they give', async () => {
        await assertFails(
            set(ref(db('alice'), `invites/${OTHER_TOKEN}`), {
                familyId: 'fam',
                createdBy: 'alice',
                expires: Date.now() + DAY,
            })
        );
        await assertFails(invite('alice', Date.now() + DAY, 'fam', 'owner'));
    });

    it('rejects made-up and expired invites', async () => {
        await assertFails(join('bob', 'notarealtokennotarealtoken'));
        await env.withSecurityRulesDisabled((context) =>
            set(ref(context.database(), `invites/${TOKEN}/expires`), Date.now() - 1000)
        );
        await assertFails(join('bob'));
    });

    it("doesn't let non-members delete invites", async () => {
        await assertFails(remove(ref(db('mallory'), `invites/${TOKEN}`)));
        await assertSucceeds(remove(ref(db('alice'), `invites/${TOKEN}`)));
    });
});

describe('members', () => {
    // Alice predates roles, so she counts as a manager. Bob is a caregiver, Carol a manager.
    beforeEach(() =>
        env.withSecurityRulesDisabled(async (context) => {
            await set(ref(context.database(), 'families/fam/members/bob'), {
                name: 'Bob',
                joined: 1,
                role: 'caregiver',
            });
            await set(ref(context.database(), 'families/fam/members/carol'), {
                name: 'Carol',
                joined: 1,
                role: 'manager',
            });
        })
    );

    it('lets managers remove others', async () => {
        await assertSucceeds(remove(ref(db('alice'), 'families/fam/members/bob')));
        await assertSucceeds(remove(ref(db('carol'), 'families/fam/members/alice')));
    });

    it('lets anyone remove themselves', async () => {
        await assertSucceeds(remove(ref(db('bob'), 'families/fam/members/bob')));
        await assertSucceeds(remove(ref(db('alice'), 'families/fam/members/alice')));
    });

    it("doesn't let caregivers or non-members remove anyone else", async () => {
        await assertFails(remove(ref(db('bob'), 'families/fam/members/carol')));
        await assertFails(remove(ref(db('mallory'), 'families/fam/members/bob')));
    });

    it("lets managers change people's roles", async () => {
        await assertSucceeds(set(ref(db('carol'), 'families/fam/members/bob/role'), 'manager'));
        await assertSucceeds(set(ref(db('alice'), 'families/fam/members/carol/role'), 'caregiver'));
        await assertFails(set(ref(db('alice'), 'families/fam/members/bob/role'), 'owner'));
        await assertFails(set(ref(db('alice'), 'families/fam/members/nobody/role'), 'manager'));
    });

    it("doesn't let caregivers change roles, including their own", async () => {
        await assertFails(set(ref(db('bob'), 'families/fam/members/bob/role'), 'manager'));
        await assertFails(set(ref(db('bob'), 'families/fam/members/carol/role'), 'caregiver'));
        await assertFails(
            set(ref(db('bob'), 'families/fam/members/bob'), { name: 'Bob', joined: 1, role: 'manager' })
        );
    });

    it('lets caregivers use the log and name the child, but not invite people', async () => {
        await assertSucceeds(get(ref(db('bob'), 'families/fam/events')));
        await assertSucceeds(set(ref(db('bob'), 'families/fam/events/e2'), { date: '2026-10-14' }));
        await assertSucceeds(set(ref(db('bob'), 'families/fam/name'), 'Ada'));
        await assertFails(
            set(ref(db('bob'), 'invites/zyxwvutsrqponmlkjihgfedcba'), {
                familyId: 'fam',
                createdBy: 'bob',
                expires: Date.now() + DAY,
                role: 'caregiver',
            })
        );
        await assertFails(remove(ref(db('bob'), `invites/${TOKEN}`)));
    });
});

describe('users', () => {
    it("only lets people read and write their own record", async () => {
        await assertSucceeds(set(ref(db('alice'), 'users/alice/families/fam'), true));
        await assertFails(get(ref(db('mallory'), 'users/alice')));
        await assertFails(set(ref(db('mallory'), 'users/alice/families/x'), true));
    });
});
