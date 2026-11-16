# Digital Menu – React + Express + Prisma + SQLite (switchable to Firebase)

Multi-restaurant menu SaaS. Each restaurant gets `/r/<slug>` (public, mobile-first, 2 languages, RTL) and an owner dashboard at `/dashboard` (categories, items, photos, brand colour, QR code).

## Run locally (Express + SQLite)

```bash
npm i                # root (concurrently)
npm run setup        # installs server+client, creates the SQLite DB, seeds a demo
npm run dev          # API :4000 + web :5173
```
Open http://localhost:5173 → **See a live demo** (`/r/demo`) or log in with `demo@menu.app / demo12345`.

## Where the backend lives

```
client/src/data/repository.ts   ← the interface the UI uses (the contract)
client/src/data/http.ts         ← talks to server/ (Express + Prisma + SQLite)
client/src/data/firebase.ts     ← talks to Firestore + Auth + Storage
client/src/data/index.ts        ← picks one using VITE_BACKEND
server/                         ← Express API, Prisma schema (prisma/schema.prisma), uploads/
```
The UI never calls `fetch` or Firebase directly – only `repo.*`. Switching is one line in `client/.env`:

```
VITE_BACKEND=local      # Express + SQLite
VITE_BACKEND=firebase   # Firestore + Auth + Storage (fill the VITE_FIREBASE_* keys)
```
It is read at **build time** – rebuild after changing it. Data is not migrated between the two; pick one per deployment.

## Deploy option A – VPS (recommended: simplest, SQLite is a single file)

```bash
git clone … && cd menu-app && npm i && npm run setup
nano server/.env        # set a long random JWT_SECRET, ALLOW_REGISTER=false once you onboard clients yourself
NODE_ENV=production npm run build
cd server && npx prisma db push
NODE_ENV=production pm2 start "npm start" --name menu      # one process serves API + React app
```
Put Caddy (auto-HTTPS) in front: `menu.yourdomain.com { reverse_proxy localhost:4000 }`.
**Back up** `server/prisma/dev.db` and `server/uploads/` (cron + rsync/S3).

## Deploy option B – Firebase (no server to maintain)

1. Create a Firebase project; enable **Authentication → Email/Password**, **Firestore**, **Storage**; add a Web app and copy its config into `client/.env` with `VITE_BACKEND=firebase`.
2. `npm i -g firebase-tools && firebase login && firebase use --add`
3. `npm run build --prefix client && firebase deploy` (deploys hosting + `firestore.rules` + `storage.rules`).

Express/SQLite can't run on Firebase Hosting (no persistent disk), which is why Firebase mode uses Firestore directly from the browser, protected by the rules files.
Hybrid: Firebase Hosting for the client + your VPS for the API → keep `VITE_BACKEND=local`, set `VITE_API_URL=https://api.yourdomain.com` and `CORS_ORIGIN=https://your-app.web.app` in `server/.env`.

## Notes for selling it
- Onboard clients yourself (`ALLOW_REGISTER=false` + create accounts from the login page, then close sign-ups), or leave sign-up open for self-serve.
- Slug (menu link) is fixed after creation so printed QR codes never break.
- Dashboard UI is English; the public menu supports English, Arabic, Kurdish (Sorani) and Turkish – add a language in `client/src/lib/i18n.ts`.
