import { TokenStore, type SpotifyToken } from '../spotify/token-store.ts';

const tokenStore = new TokenStore();

export class SpotifyTokenUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpotifyTokenUnavailableError';
  }
}

export async function saveSpotifyToken(tokenResponse: unknown): Promise<void> {
  if (!isSpotifyTokenResponse(tokenResponse)) {
    throw new Error('Spotify returned an invalid token response.');
  }

  const token: SpotifyToken = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token,
    expires_at: Date.now() + tokenResponse.expires_in * 1000,
  };

  await tokenStore.save(token);
}

export async function getSpotifyAccessToken(): Promise<string> {
  const token = await tokenStore.load();

  if (!token) {
    throw new SpotifyTokenUnavailableError(
      'No Spotify token is stored. Authorize the application at /auth/login first.',
    );
  }

  if (token.expires_at <= Date.now()) {
    throw new SpotifyTokenUnavailableError(
      'The Spotify token has expired. Authorize the application at /auth/login again.',
    );
  }

  return token.access_token;
}

function isSpotifyTokenResponse(
  value: unknown,
): value is {
  access_token: string;
  refresh_token: string;
  expires_in: number;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const token = value as Record<string, unknown>;
  return (
    typeof token.access_token === 'string' &&
    typeof token.refresh_token === 'string' &&
    typeof token.expires_in === 'number'
  );
}
