import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface SpotifyToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class TokenStore {
  private readonly path: string;

  constructor(path = './data/spotify-token.json') {
    this.path = path;
  }

  async save(token: SpotifyToken): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });

    await writeFile(this.path, JSON.stringify(token, null, 2), {
      mode: 0o600,
    });
  }

  async load(): Promise<SpotifyToken | null> {
    try {
      const content = await readFile(this.path, 'utf8');
      return JSON.parse(content) as SpotifyToken;
    } catch (error: unknown) {
      if (isFileNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}
