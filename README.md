# BabyLog

A small Angular app for logging a baby's day (feeds, sleep, diapers, …), backed by the Firebase
Realtime Database and Google sign-in. Children's names are only stored locally on each device.

## Requirements

Node 24 (see `.nvmrc`), or Node 22.22.3+.

```bash
npm ci
```

## Development server

Run `npm run serve` for a dev server. Navigate to `http://localhost:4200/`. The app will
automatically reload if you change any of the source files.

## Build

Run `npm run build` to make a production build in `dist/baby-log/browser`.

## Tests

- `npm test` runs the Vitest unit tests.
- `npm run test:rules` runs the database security rules tests against the Database emulator.
- `npm run e2e` runs the Playwright tests against the Auth and Database emulators, using your
  installed Chrome. `npm run serve -- --configuration emulators` serves the app against
  emulators you started yourself with
  `npx firebase emulators:start --only auth,database --project demo-baby-log`.

The emulators need Java.

## Deploy

Run `npm run deploy` to build and deploy hosting and the database rules.

### One-time move to invite-based sharing

Access to a child's log now comes from `families/$fid/members`, and people join with single-use
invites (`invites/$token`) instead of the family ID. Existing users need to be added as members
before the new rules go live, or they will lose access to their logs:

```bash
npx firebase database:get /users > users.json
npx firebase auth:export auth-users.json --format=json
node scripts/migrate-members.mjs users.json auth-users.json > members.json
npx firebase database:update / members.json
npm run deploy
```

Run the last two steps back to back so new families get created under the new rules. Delete the
exported JSON files afterwards, since they contain users' data. Share links sent before this
change stop working; the app tells people to ask for a new invite.
