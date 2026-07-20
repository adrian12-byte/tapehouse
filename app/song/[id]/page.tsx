'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AudioPlayer from '@/components/AudioPlayer';
import LyricsEditor from '@/components/LyricsEditor';
import ReplaceAudioButton from '@/components/ReplaceAudioButton';
import type { AlbumWithCount, Song } from '@/lib/db';
import { deleteSongRequest, fetchAlbums, fetchSong, updateSongMetaRequest } from '@/lib/api';

export default function SongPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [albums, setAlbums] = useState<AlbumWithCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [movingAlbum, setMovingAlbum] = useState(false);

  useEffect(() => {
    fetchSong(params.id)
      .then((s) => {
        setSong(s);
        setTitleDraft(s.title);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load song'));
    fetchAlbums()
      .then(setAlbums)
      .catch(() => {
        // Non-fatal — the album picker just won't have options.
      });
  }, [params.id]);

  async function handleAlbumChange(albumId: string) {
    if (!song) return;
    setMovingAlbum(true);
    try {
      const updated = await updateSongMetaRequest(song.id, { albumId: albumId || null });
      setSong(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move track');
    } finally {
      setMovingAlbum(false);
    }
  }

  async function handleTitleSave() {
    if (!song) return;
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (!next || next === song.title) {
      setTitleDraft(song.title);
      return;
    }
    const updated = await updateSongMetaRequest(song.id, { title: next });
    setSong(updated);
  }

  async function handleLyricsSave(lyrics: string) {
    if (!song) return;
    const updated = await updateSongMetaRequest(song.id, { lyrics });
    setSong(updated);
  }

  async function handleDelete() {
    if (!song) return;
    if (!confirm(`Delete "${song.title}"? This removes the audio file too.`)) return;
    setDeleting(true);
    try {
      await deleteSongRequest(song.id);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setDeleting(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-sm text-rust">{error}</p>
        <Link href="/" className="mt-4 inline-block font-mono text-sm text-signal underline">
          ← Back to the deck
        </Link>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-mono text-sm text-boneDim">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-wide text-boneDim transition hover:text-brassBright"
        >
          ← The deck
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="font-mono text-xs uppercase tracking-wide text-rust/80 transition hover:text-rust disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete track'}
        </button>
      </div>

      <div className="mb-8">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setTitleDraft(song.title);
                setEditingTitle(false);
              }
            }}
            className="w-full border-b border-signal bg-transparent font-display text-3xl font-medium text-bone outline-none"
          />
        ) : (
          <h1
            onClick={() => setEditingTitle(true)}
            className="cursor-text font-display text-3xl font-medium text-bone"
            title="Click to rename"
          >
            {song.title}
          </h1>
        )}
        <p className="mt-1 font-mono text-[11px] text-boneDim">
          {song.original_filename} · click title to rename
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <AudioPlayer key={song.audio_url} audioUrl={song.audio_url} />

          <div className="flex items-center justify-between border border-hairline bg-panel px-4 py-3">
            <span className="font-mono text-[11px] text-boneDim">Swap the source file</span>
            <ReplaceAudioButton songId={song.id} onReplaced={setSong} />
          </div>

          <div className="flex items-center justify-between border border-hairline bg-panel px-4 py-3">
            <span className="font-mono text-[11px] text-boneDim">Original audio file</span>
            <a
              href={`/api/songs/${song.id}/download`}
              className="border border-hairline px-3 py-1.5 text-xs uppercase tracking-wide text-boneDim transition hover:border-signal hover:text-signal"
            >
              Download
            </a>
          </div>

          <div className="flex items-center justify-between gap-3 border border-hairline bg-panel px-4 py-3">
            <span className="shrink-0 font-mono text-[11px] text-boneDim">Album project</span>
            <select
              value={song.album_id ?? ''}
              disabled={movingAlbum}
              onChange={(e) => handleAlbumChange(e.target.value)}
              className="w-40 border border-hairline bg-ink px-2 py-1.5 text-xs text-bone outline-none focus:border-signal disabled:opacity-50"
            >
              <option value="">No album</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <LyricsEditor initialLyrics={song.lyrics} onSave={handleLyricsSave} />
      </div>
    </main>
  );
}
