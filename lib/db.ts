import { neon } from '@neondatabase/serverless';

export type Song = {
  id: string;
  title: string;
  lyrics: string;
  audio_url: string;
  audio_pathname: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
};

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add a Postgres integration (e.g. Neon) from the Vercel Storage tab, or set it in .env.local for local development.'
    );
  }
  return neon(url);
}

let schemaReady: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const db = sql();
      await db`
        CREATE TABLE IF NOT EXISTS songs (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          lyrics TEXT NOT NULL DEFAULT '',
          audio_url TEXT NOT NULL,
          audio_pathname TEXT NOT NULL,
          original_filename TEXT,
          mime_type TEXT,
          size_bytes BIGINT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return schemaReady;
}

export async function listSongs(): Promise<Song[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT * FROM songs ORDER BY created_at DESC`;
  return rows as Song[];
}

export async function getSong(id: string): Promise<Song | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT * FROM songs WHERE id = ${id}`;
  return (rows[0] as Song) ?? null;
}

export async function createSong(input: {
  id: string;
  title: string;
  lyrics: string;
  audioUrl: string;
  audioPathname: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<Song> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    INSERT INTO songs (id, title, lyrics, audio_url, audio_pathname, original_filename, mime_type, size_bytes)
    VALUES (${input.id}, ${input.title}, ${input.lyrics}, ${input.audioUrl}, ${input.audioPathname}, ${input.originalFilename}, ${input.mimeType}, ${input.sizeBytes})
    RETURNING *
  `;
  return rows[0] as Song;
}

export async function updateSongMeta(
  id: string,
  input: { title?: string; lyrics?: string }
): Promise<Song | null> {
  await ensureSchema();
  const db = sql();
  const current = await getSong(id);
  if (!current) return null;
  const title = input.title ?? current.title;
  const lyrics = input.lyrics ?? current.lyrics;
  const rows = await db`
    UPDATE songs SET title = ${title}, lyrics = ${lyrics}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Song) ?? null;
}

export async function updateSongAudio(
  id: string,
  input: {
    audioUrl: string;
    audioPathname: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
  }
): Promise<Song | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    UPDATE songs
    SET audio_url = ${input.audioUrl},
        audio_pathname = ${input.audioPathname},
        original_filename = ${input.originalFilename},
        mime_type = ${input.mimeType},
        size_bytes = ${input.sizeBytes},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Song) ?? null;
}

export async function deleteSong(id: string): Promise<Song | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`DELETE FROM songs WHERE id = ${id} RETURNING *`;
  return (rows[0] as Song) ?? null;
}
