import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { deleteSong, getSong, updateSongMeta } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const song = await getSong(params.id);
    if (!song) {
      return NextResponse.json({ error: 'Song not found.' }, { status: 404 });
    }
    return NextResponse.json({ song });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load song' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const { title, lyrics } = data ?? {};

    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ error: 'Song name cannot be empty.' }, { status: 400 });
    }

    const song = await updateSongMeta(params.id, {
      title: typeof title === 'string' ? title.trim() : undefined,
      lyrics: typeof lyrics === 'string' ? lyrics : undefined,
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found.' }, { status: 404 });
    }
    return NextResponse.json({ song });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update song' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const song = await getSong(params.id);
    if (!song) {
      return NextResponse.json({ error: 'Song not found.' }, { status: 404 });
    }

    try {
      await del(song.audio_pathname);
    } catch {
      // If the blob is already gone, don't block deleting the record.
    }

    await deleteSong(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete song' },
      { status: 500 }
    );
  }
}
