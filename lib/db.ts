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
  album_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Album = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  thumbnail_pathname: string | null;
  created_at: string;
  updated_at: string;
};

export type AlbumWithCount = Album & { song_count: number };

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
        CREATE TABLE IF NOT EXISTS albums (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          thumbnail_url TEXT,
          thumbnail_pathname TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
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
          album_id TEXT REFERENCES albums(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      // Backfill for databases created before album support existed.
      await db`ALTER TABLE songs ADD COLUMN IF NOT EXISTS album_id TEXT REFERENCES albums(id) ON DELETE SET NULL`;
    })();
  }
  return schemaReady;
}

/* ---------------------------- Songs ---------------------------- */

export async function listSongs(): Promise<Song[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT * FROM songs ORDER BY created_at DESC`;
  return rows as Song[];
}

export async function listSongsByAlbum(albumId: string): Promise<Song[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT * FROM songs WHERE album_id = ${albumId} ORDER BY created_at ASC`;
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
  albumId?: string | null;
}): Promise<Song> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    INSERT INTO songs (id, title, lyrics, audio_url, audio_pathname, original_filename, mime_type, size_bytes, album_id)
    VALUES (${input.id}, ${input.title}, ${input.lyrics}, ${input.audioUrl}, ${input.audioPathname}, ${input.originalFilename}, ${input.mimeType}, ${input.sizeBytes}, ${input.albumId ?? null})
    RETURNING *
  `;
  return rows[0] as Song;
}

export async function updateSongMeta(
  id: string,
  input: { title?: string; lyrics?: string; albumId?: string | null }
): Promise<Song | null> {
  await ensureSchema();
  const db = sql();
  const current = await getSong(id);
  if (!current) return null;
  const title = input.title ?? current.title;
  const lyrics = input.lyrics ?? current.lyrics;
  const albumId = input.albumId !== undefined ? input.albumId : current.album_id;
  const rows = await db`
    UPDATE songs SET title = ${title}, lyrics = ${lyrics}, album_id = ${albumId}, updated_at = now()
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

/* ---------------------------- Albums ---------------------------- */

export async function listAlbums(): Promise<AlbumWithCount[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    SELECT a.*, COUNT(s.id)::int AS song_count
    FROM albums a
    LEFT JOIN songs s ON s.album_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `;
  return rows as AlbumWithCount[];
}

export async function getAlbum(id: string): Promise<Album | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db`SELECT * FROM albums WHERE id = ${id}`;
  return (rows[0] as Album) ?? null;
}

export async function createAlbum(input: {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  thumbnailPathname?: string | null;
}): Promise<Album> {
  await ensureSchema();
  const db = sql();
  const rows = await db`
    INSERT INTO albums (id, title, thumbnail_url, thumbnail_pathname)
    VALUES (${input.id}, ${input.title}, ${input.thumbnailUrl ?? null}, ${input.thumbnailPathname ?? null})
    RETURNING *
  `;
  return rows[0] as Album;
}

export async function updateAlbum(
  id: string,
  input: { title?: string; thumbnailUrl?: string | null; thumbnailPathname?: string | null }
): Promise<Album | null> {
  await ensureSchema();
  const db = sql();
  const current = await getAlbum(id);
  if (!current) return null;
  const title = input.title ?? current.title;
  const thumbnailUrl = input.thumbnailUrl !== undefined ? input.thumbnailUrl : current.thumbnail_url;
  const thumbnailPathname =
    input.thumbnailPathname !== undefined ? input.thumbnailPathname : current.thumbnail_pathname;
  const rows = await db`
    UPDATE albums
    SET title = ${title}, thumbnail_url = ${thumbnailUrl}, thumbnail_pathname = ${thumbnailPathname}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return (rows[0] as Album) ?? null;
}

export async function deleteAlbum(id: string): Promise<Album | null> {
  await ensureSchema();
  const db = sql();
  // Songs in the album are kept, just unlinked (ON DELETE SET NULL).
  const rows = await db`DELETE FROM albums WHERE id = ${id} RETURNING *`;
  return (rows[0] as Album) ?? null;
}
