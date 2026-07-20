import { NextResponse } from 'next/server';
import { getSong } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const song = await getSong(params.id);
  if (!song) {
    return NextResponse.json({ error: 'Song not found.' }, { status: 404 });
  }

  const upstream = await fetch(song.audio_url);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: 'Could not fetch audio file.' }, { status: 502 });
  }

  const filename = song.original_filename || `${song.title}.audio`;

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': song.mime_type || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      ...(upstream.headers.get('content-length')
        ? { 'Content-Length': upstream.headers.get('content-length')! }
        : {}),
    },
  });
}
