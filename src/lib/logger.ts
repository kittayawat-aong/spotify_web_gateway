import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  unlink,
} from 'node:fs/promises';
import type { IncomingHttpHeaders } from 'node:http';
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';

const logDirectory = './data';
const legacyLogPath = `${logDirectory}/gateway.log`;
const maxLogBytes = 50_000;
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
let writeQueue: Promise<void> = Promise.resolve();

export function logRequest(
  details: RequestLogDetails,
): void {
  const { status } = details;
  void appendLog({
    level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
    event: 'request',
    ...details,
    durationMs: Math.round(details.durationMs * 100) / 100,
  });
}

export interface RequestLogDetails {
  requestId: string;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string | string[]>;
  remoteAddress?: string;
  remotePort?: number;
  userAgent?: string;
  action: string;
  status: number;
  durationMs: number;
  responseBytes: number;
}

export function logError(
  error: unknown,
  details: Pick<RequestLogDetails, 'requestId' | 'method' | 'path' | 'action'>,
): void {
  const errorDetails = error instanceof Error
    ? { errorName: error.name, message: error.message, stack: error.stack }
    : { errorName: typeof error, message: String(error) };

  void appendLog({
    level: 'error',
    event: 'unhandled_error',
    ...details,
    ...errorDetails,
  });
}

export function auditQuery(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};

  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key).map((value) =>
      isSensitiveKey(key) ? '[REDACTED]' : value,
    );
    query[key] = values.length === 1 ? values[0] : values;
  }

  return query;
}

export function auditHeaders(
  headers: IncomingHttpHeaders,
): Record<string, string | string[]> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? '[REDACTED]' : value ?? '',
    ]),
  );
}

export function auditAction(method: string | undefined, path: string): string {
  const routes: Record<string, string> = {
    'GET /api/auth/status': 'auth.status.read',
    'GET /api/playback': 'playback.read',
    'GET /api/devices': 'playback.devices.read',
    'POST /api/play': 'playback.start',
    'POST /api/pause': 'playback.pause',
    'POST /api/next': 'playback.next',
    'GET /auth/login': 'auth.login.start',
    'GET /auth/callback': 'auth.login.callback',
  };

  return routes[`${method ?? 'UNKNOWN'} ${path}`] ?? 'http.request';
}

function isSensitiveKey(key: string): boolean {
  return /authorization|cookie|token|secret|password|(^|[_-])code$|api[_-]?key/i.test(key);
}

export async function readRecentLogs(): Promise<string> {
  try {
    const logFiles = (await readdir(logDirectory))
      .filter((name) => /^gateway(?:-\d{4}-\d{2}-\d{2}|-legacy)?\.log(?:\.gz)?$/.test(name))
      .sort((left, right) => logSortKey(left).localeCompare(logSortKey(right)));
    const contents = await Promise.all(
      logFiles.map((name) => readLogFile(`${logDirectory}/${name}`)),
    );

    return contents.join('').slice(-maxLogBytes);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return 'No log entries yet. Use the gateway, then reload this page.';
    }

    throw error;
  }
}

async function appendLog(entry: Record<string, unknown>): Promise<void> {
  writeQueue = writeQueue
    .then(async () => {
      const currentLogPath = getCurrentLogPath();
      await mkdir(logDirectory, { recursive: true });
      await appendFile(
        currentLogPath,
        `${JSON.stringify({ time: new Date().toISOString(), ...entry })}\n`,
      );
      await archiveCompletedLogs(currentLogPath);
    })
    .catch((error: unknown) => {
      console.error('Unable to write gateway log:', error);
    });
}

function getCurrentLogPath(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${logDirectory}/gateway-${date}.log`;
}

async function archiveCompletedLogs(currentLogPath: string): Promise<void> {
  const names = await readdir(logDirectory);
  const logPaths = names
    .filter((name) => name === 'gateway.log' || /^gateway-\d{4}-\d{2}-\d{2}\.log$/.test(name))
    .map((name) => `${logDirectory}/${name}`)
    .filter((path) => path !== currentLogPath);

  for (const logPath of logPaths) {
    const archivePath = logPath === legacyLogPath
      ? `${logDirectory}/gateway-legacy.log.gz`
      : `${logPath}.gz`;
    const compressedContent = await gzipAsync(await readFile(logPath));
    await appendFile(archivePath, compressedContent);
    await unlink(logPath);
  }
}

async function readLogFile(path: string): Promise<string> {
  try {
    const content = await readFile(path);
    return path.endsWith('.gz')
      ? (await gunzipAsync(content)).toString('utf8')
      : content.toString('utf8');
  } catch (error: unknown) {
    console.error(`Unable to read gateway log ${path}:`, error);
    return '';
  }
}

function logSortKey(name: string): string {
  return name.startsWith('gateway-legacy') ? `0000-${name}` : name;
}
