'use client';

import { upload } from '@vercel/blob/client';
import { ACCEPTED_EXTENSIONS, hasAcceptedExtension, MAX_FILE_SIZE_BYTES } from '@/lib/constants';

export function validateAudioFile(file: File): string | null {
  if (!hasAcceptedExtension(file.name)) {
    return `Unsupported file type. Please choose ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large (max ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB).`;
  }
  return null;
}

export async function uploadAudioFile(
  file: File,
  onProgress?: (percent: number) => void
) {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
    onUploadProgress: (event) => {
      onProgress?.(Math.round(event.percentage));
    },
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };
}
