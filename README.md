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

## Deploy

Run `npm run deploy` to build and deploy to Firebase Hosting. Database rules in
`database.rules.json` are deployed separately with `npx firebase deploy --only database`.
