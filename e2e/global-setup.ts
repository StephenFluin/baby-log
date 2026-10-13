import { readFileSync } from 'node:fs';

/** Namespace the app uses (from its databaseURL) when talking to the database emulator */
export const DATABASE_NAMESPACE = 'baby-log-7307f';
const DATABASE = 'http://127.0.0.1:9000';
const AUTH = 'http://127.0.0.1:9099';
const OWNER = { Authorization: 'Bearer owner' };

/** Start every run with the real security rules and no data or accounts */
export default async function globalSetup() {
    const rules = readFileSync('database.rules.json', 'utf8');
    await check(
        fetch(`${DATABASE}/.settings/rules.json?ns=${DATABASE_NAMESPACE}`, {
            method: 'PUT',
            headers: OWNER,
            body: rules,
        })
    );
    await check(fetch(`${DATABASE}/.json?ns=${DATABASE_NAMESPACE}`, { method: 'DELETE', headers: OWNER }));
    await check(
        fetch(`${AUTH}/emulator/v1/projects/demo-baby-log/accounts`, { method: 'DELETE' })
    );
}

async function check(response: Promise<Response>) {
    const result = await response;
    if (!result.ok) {
        throw new Error(`${result.url} failed: ${result.status} ${await result.text()}`);
    }
}
