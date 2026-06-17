# OpenStage PWA

OpenStage PWA is a browser-based, offline-first songbook for musicians. It is built for modern browsers, Chromebooks, tablets, Raspberry Pi Chromium kiosk mode, and portrait lyric prompter screens.

## Stack

- React, Vite, TypeScript
- Tailwind CSS
- Dexie / IndexedDB local storage
- Optional Supabase sync
- Vite PWA support

## Run

```bash
npm install
npm run dev
```

## Optional Supabase Sync

Copy `.env.example` to `.env` and add:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Create a `songs` table with compatible fields if you want cloud sync. The app works fully offline without Supabase.
