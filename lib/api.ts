'use client';

import type { Song } from '@/lib/db';

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchSongs(): Promise<Song[]> {
  const res = await fetch('/api/songs', { cache: 'no-store' });
  const data = await handle<{ songs: Song[] }>(res);
  return data.songs;
}

export async function fetchSong(id: string): Promise<Song> {
  const res = await fetch(`/api/songs/${id}`, { cache: 'no-store' });
  const data = await handle<{ song: Song }>(res);
  return data.song;
}

export async function createSongRecord(input: {
  title: string;
  lyrics: string;
  url: string;
  pathname: string;
  filename: string;
  mimeType: string;
  size: number;
}): Promise<Song> {
  const res = await fetch('/api/songs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await handle<{ song: Song }>(res);
  return data.song;
}

export async function updateSongMetaRequest(
  id: string,
  input: { title?: string; lyrics?: string }
): Promise<Song> {
  const res = await fetch(`/api/songs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await handle<{ song: Song }>(res);
  return data.song;
}

export async function replaceSongAudio(
  id: string,
  input: { url: string; pathname: string; filename: string; mimeType: string; size: number }
): Promise<Song> {
  const res = await fetch(`/api/songs/${id}/audio`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await handle<{ song: Song }>(res);
  return data.song;
}

export async function deleteSongRequest(id: string): Promise<void> {
  const res = await fetch(`/api/songs/${id}`, { method: 'DELETE' });
  await handle(res);
}
