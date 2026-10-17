import { CONFIG } from '../constants/config';
import { store } from '../app/store';

/**
 * Resolves relative server media upload paths or backend recording streaming endpoints
 * to the backend API host, automatically attaching the JWT auth token if required.
 *
 * Example:
 * - "/api/v1/recordings/123/stream" -> "https://api-cctv-backend.duckdns.org/api/v1/recordings/123/stream?token=<jwt>"
 * - "https://bucket.s3.amazonaws.com/rec.mp4?X-Amz-Signature=..." -> untouched external URL
 */
export function getMediaUrl(
  url: string | undefined | null,
  attachAuth = true,
  customToken?: string | null
): string {
  if (!url) return '';
  const token = attachAuth
    ? (customToken || store.getState().auth.token)
    : null;

  let resolved = url;
  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    !url.startsWith('data:') &&
    !url.startsWith('blob:') &&
    !url.startsWith('file://')
  ) {
    const rawBase = CONFIG.API_BASE_URL || '';
    const serverOrigin = rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    resolved = `${serverOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Attach token for internal recording streaming or download endpoints
  // but avoid altering external cloud pre-signed URLs (e.g., S3/R2 with X-Amz-Signature)
  if (
    token &&
    (resolved.includes('/api/v1/recordings/') || resolved.includes('/recordings/')) &&
    !resolved.includes('token=') &&
    !resolved.includes('accessToken=') &&
    !resolved.includes('X-Amz-Signature')
  ) {
    const sep = resolved.includes('?') ? '&' : '?';
    resolved = `${resolved}${sep}token=${encodeURIComponent(token)}`;
  }

  return resolved;
}

/**
 * Builds the direct HTTP 206 byte-range video streaming endpoint URL for a given recording chunk.
 */
export function getRecordingStreamUrl(
  recordingId: string,
  options?: { download?: boolean; filename?: string; token?: string }
): string {
  const rawBase = CONFIG.API_BASE_URL || '';
  const serverOrigin = rawBase.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  const base = `${serverOrigin}/api/v1/recordings/${recordingId}/stream`;

  const queryParts: string[] = [];
  if (options?.download) {
    queryParts.push('download=true');
    if (options.filename) {
      queryParts.push(`filename=${encodeURIComponent(options.filename)}`);
    }
  }

  const token = options?.token || store.getState().auth.token;
  if (token) {
    queryParts.push(`token=${encodeURIComponent(token)}`);
  }

  return queryParts.length > 0 ? `${base}?${queryParts.join('&')}` : base;
}
