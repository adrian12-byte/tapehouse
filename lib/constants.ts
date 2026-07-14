export const ACCEPTED_MIME_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mpeg',
  'audio/mp3',
  'audio/flac',
  'audio/x-flac',
];

export const ACCEPTED_EXTENSIONS = ['.wav', '.mp3', '.flac'];

// 200MB — generous headroom for uncompressed WAV/FLAC masters.
export const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export function hasAcceptedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
