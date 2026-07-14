'use client';

import Link from 'next/link';
import type { Song } from '@/lib/db';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function SongList({ songs }: { songs: Song[] }) {
  if (songs.length === 0) {
    return (
      <div className="border border-dashed border-hairline p-10 text-center">
        <p className="font-display text-lg text-bone">The deck is empty</p>
        <p className="mt-1 font-mono text-xs text-boneDim">
          Load a track on the left to start your collection.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {songs.map((song, i) => (
        <li key={song.id}>
          <Link
            href={`/song/${song.id}`}
            className="group flex h-full flex-col justify-between border border-hairline bg-panel p-4 transition hover:border-brass/70 hover:bg-panelLight"
          >
            <div>
              <div className="mb-2 flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] text-boneDim">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-2 w-2 rounded-full bg-signal/70 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="font-display text-lg leading-snug text-bone group-hover:text-brassBright">
                {song.title}
              </h3>
              {song.lyrics ? (
                <p className="mt-1.5 line-clamp-2 text-xs text-boneDim">{song.lyrics}</p>
              ) : (
                <p className="mt-1.5 text-xs italic text-boneDim/70">No lyrics yet</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-boneDim">
              <span>{formatDate(song.created_at)}</span>
              <span>{formatSize(song.size_bytes)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
