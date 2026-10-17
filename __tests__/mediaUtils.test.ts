import { getMediaUrl, getRecordingStreamUrl } from '../src/utils/mediaUtils';
import { CONFIG } from '../src/constants/config';

describe('getMediaUrl', () => {
  it('returns empty string for null or undefined url', () => {
    expect(getMediaUrl(null)).toBe('');
    expect(getMediaUrl(undefined)).toBe('');
  });

  it('preserves external cloud URLs and presigned S3 URLs without modifying them', () => {
    const s3Url = 'https://s3.ap-south-1.amazonaws.com/cctv-recordings/rec1.mp4?X-Amz-Signature=abcdef';
    expect(getMediaUrl(s3Url, true, 'my-token')).toBe(s3Url);
  });

  it('resolves relative streaming endpoint with base URL and attaches token', () => {
    const relativeUrl = '/api/v1/recordings/670d8a9b/stream';
    const resolved = getMediaUrl(relativeUrl, true, 'jwt_token_123');

    const expectedOrigin = CONFIG.API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    expect(resolved).toBe(`${expectedOrigin}/api/v1/recordings/670d8a9b/stream?token=jwt_token_123`);
  });

  it('does not double attach token if already present', () => {
    const urlWithToken = '/api/v1/recordings/670d8a9b/stream?token=existing_token';
    const resolved = getMediaUrl(urlWithToken, true, 'jwt_token_123');
    expect(resolved).toContain('token=existing_token');
    expect(resolved).not.toContain('jwt_token_123');
  });
});

describe('getRecordingStreamUrl', () => {
  it('builds direct streaming endpoint with token and download params', () => {
    const streamUrl = getRecordingStreamUrl('rec-456', {
      download: true,
      filename: 'camera_front.mp4',
      token: 'test_token',
    });

    const expectedOrigin = CONFIG.API_BASE_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    expect(streamUrl).toBe(
      `${expectedOrigin}/api/v1/recordings/rec-456/stream?download=true&filename=camera_front.mp4&token=test_token`
    );
  });
});
