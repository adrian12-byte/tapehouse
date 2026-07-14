'use client';

import { useEffect, useState } from 'react';
import UploadForm from '@/components/UploadForm';
import SongList from '@/components/SongList';
import type { Song } from '@/lib/db';
import { fetchSongs } from '@/lib/api';

export default function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs()
      .then(setSongs)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <header className="mb-10 flex items-baseline justify-between border-b border-hairline pb-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-boneDim">Side A</p>
          <h1 className="font-display text-3xl font-medium text-bone">Tapehouse</h1>
        </div>
        <p className="max-w-xs text-right font-mono text-[11px] text-boneDim">
          Upload tracks, write lyrics beside them, and warp speed &amp; pitch independently.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <div className="lg:sticky lg:top-12 lg:self-start">
          <UploadForm onCreated={(song) => setSongs((prev) => [song, ...prev])} />
        </div>

        <div>
          {error && <p className="mb-4 font-mono text-sm text-rust">{error}</p>}
          {loading ? (
            <p className="font-mono text-sm text-boneDim">Loading deck…</p>
          ) : (
            <SongList songs={songs} />
          )}
        </div>
      </div>
    </main>
  );
}
