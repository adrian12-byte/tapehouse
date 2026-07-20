import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAlbum, listAlbums } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const albums = await listAlbums();
    return NextResponse.json({ albums });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load albums' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, thumbnailUrl, thumbnailPathname } = data ?? {};

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'An album title is required.' }, { status: 400 });
    }

    const album = await createAlbum({
      id: randomUUID(),
      title: title.trim(),
      thumbnailUrl: typeof thumbnailUrl === 'string' ? thumbnailUrl : null,
      thumbnailPathname: typeof thumbnailPathname === 'string' ? thumbnailPathname : null,
    });

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create album' },
      { status: 500 }
    );
  }
}
