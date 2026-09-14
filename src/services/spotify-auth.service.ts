import { randomBytes } from 'node:crypto';
import { env } from '../config/env.ts';

const authorizationScopes = [
  'user-read-playback-state',
  'user-read-currently-playing',
];

export function createAuthorizationUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.spotify.clientId,
    scope: authorizationScopes.join(' '),
    redirect_uri: env.spotify.redirectUri,
    state: randomBytes(16).toString('hex'),
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeAuthorizationCode(code: string): Promise<{
  status: number;
  body: unknown;
}> {
  const credentials = Buffer.from(
    `${env.spotify.clientId}:${env.spotify.clientSecret}`,
  ).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.spotify.redirectUri,
    }),
  });

  return { status: response.status, body: await response.json() };
}
