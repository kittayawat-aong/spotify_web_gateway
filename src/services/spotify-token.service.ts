import { TokenStore, type SpotifyToken } from '../spotify/token-store.ts';
import { refreshAccessToken } from './spotify-auth.service.ts';

const tokenStore = new TokenStore();
const refreshThresholdMs = 60_000;
let refreshInFlight: Promise<string> | undefined;

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

  if (token.expires_at > Date.now() + refreshThresholdMs) {
    return token.access_token;
  }

  refreshInFlight ??= refreshSpotifyAccessToken(token);
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = undefined;
  }
}

async function refreshSpotifyAccessToken(token: SpotifyToken): Promise<string> {
  const response = await refreshAccessToken(token.refresh_token);
  if (response.status !== 200 || !isAccessTokenResponse(response.body)) {
    throw new SpotifyTokenUnavailableError(
      'Unable to refresh the Spotify token. Authorize the application at /auth/login again.',
    );
  }

  const refreshedToken: SpotifyToken = {
    access_token: response.body.access_token,
    refresh_token: response.body.refresh_token ?? token.refresh_token,
    expires_at: Date.now() + response.body.expires_in * 1000,
  };
  await tokenStore.save(refreshedToken);
  return refreshedToken.access_token;
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

function isAccessTokenResponse(
  value: unknown,
): value is {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
} {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const token = value as Record<string, unknown>;
  return (
    typeof token.access_token === 'string' &&
    (token.refresh_token === undefined || typeof token.refresh_token === 'string') &&
    typeof token.expires_in === 'number'
  );
}
