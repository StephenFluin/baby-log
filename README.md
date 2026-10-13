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

## Firebase project security settings

These live in the Firebase and Google Cloud consoles rather than this repo.

### App Check

1. In the Firebase console, open **App Check**, register the web app with **reCAPTCHA
   Enterprise**, and create a site key for `baby.fluin.io`, `baby-log-7307f.web.app`, and
   `baby-log-7307f.firebaseapp.com`.
2. Put the site key in `APP_CHECK_SITE_KEY` in `src/app/firebase.ts` and deploy.
3. For local development against the real project, run `npm run serve`, copy the debug token the
   browser console prints, and add it under **App Check → Apps → Manage debug tokens**. (The
   emulators don't use App Check.)
4. Watch the **App Check** metrics for a few days until nearly all requests are verified, then
   **Enforce** it for Realtime Database and Authentication.

### Browser API key restrictions

The API key in `src/app/firebase.ts` is public by design, but it should only work from the app's
own sites and only for the APIs the app uses:

```bash
gcloud services api-keys list --project baby-log-7307f
gcloud services api-keys update KEY_ID --project baby-log-7307f \
  --allowed-referrers="https://baby.fluin.io/*,https://baby-log-7307f.web.app/*,https://baby-log-7307f.firebaseapp.com/*,http://localhost:4200/*" \
  --api-target=service=identitytoolkit.googleapis.com \
  --api-target=service=securetoken.googleapis.com \
  --api-target=service=firebaseappcheck.googleapis.com \
  --api-target=service=firebaseinstallations.googleapis.com
```

Use the key ID whose key string matches the `apiKey` in `src/app/firebase.ts`, and test sign-in
right afterwards.

### Google Analytics

The app sends page views itself with scrubbed URLs, so in the GA4 web stream's **Enhanced
measurement** settings turn off **Page changes based on browser history events** (it can report
real URLs and double-count page views) and **Outbound clicks**.
