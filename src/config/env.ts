import 'dotenv/config';

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  throw new Error(
    'Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET. Add them to .env.',
  );
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? '127.0.0.1',
  spotify: {
    clientId,
    clientSecret,
    redirectUri:
      process.env.SPOTIFY_REDIRECT_URI ??
      'http://127.0.0.1:3000/auth/callback',
  },
} as const;
