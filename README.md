# Tapehouse

Upload songs, attach names and lyrics, swap the audio file whenever you like, and
warp playback speed and pitch independently — all from a browser, hosted on Vercel.

- **Storage:** audio files live in Vercel Blob; titles, lyrics, and file
  references live in a Postgres database (Neon, via Vercel's Storage tab).
  Everything is available from any device you sign in from.
- **Speed & pitch:** playback runs through granular synthesis
  ([Tone.js](https://tonejs.github.io/) `GrainPlayer`), so you can slow a
  track down without dropping its pitch, or shift pitch without changing
  tempo — independently, in real time.

## 1. Get the code onto GitHub

Push this folder to a new GitHub repository (or use GitHub's "Import" to
upload it directly).

## 2. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Before the first deploy finishes setting up, open the project's
   **Storage** tab and add:
   - **Postgres** (the Neon integration) — this sets a `DATABASE_URL`
     environment variable automatically.
   - **Blob** — this sets a `BLOB_READ_WRITE_TOKEN` environment variable
     automatically.
3. Redeploy if the project deployed before you added storage. That's it —
   the database table is created automatically the first time the app
   touches it, no migration step required.

## 3. Run it locally (optional)

```bash
npm install
```

Copy `.env.example` to `.env.local` and fill in the two values — you can
copy them from the Vercel project's Storage tab (Settings → Environment
Variables) or from `vercel env pull .env.local` if you have the Vercel CLI
linked to the project.

```bash
npm run dev
```

Open http://localhost:3000.

## How it's built

- **Next.js 14** (App Router) + TypeScript + Tailwind.
- Audio files upload directly from the browser to Vercel Blob (so large
  WAV/FLAC masters never pass through a serverless function's request-body
  limit); the app's own API only ever stores small JSON records.
- `app/api/songs` — list/create tracks.
- `app/api/songs/[id]` — read/rename/edit-lyrics/delete a track.
- `app/api/songs/[id]/audio` — replace a track's audio file, cleaning up
  the old Blob object afterward.
- `components/AudioPlayer.tsx` — the player, with a radial **Speed** knob
  (0.5×–2×) and **Pitch** knob (±12 semitones), each independent of the
  other.

## Supported audio formats

`.wav`, `.mp3`, `.flac` — up to 200MB per file (adjustable in
`lib/constants.ts`).
