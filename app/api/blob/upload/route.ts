import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ACCEPTED_MIME_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do server-side here — the client creates/updates the
        // song record itself once the upload promise resolves, so this
        // works the same in local dev (no public callback URL) and prod.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
