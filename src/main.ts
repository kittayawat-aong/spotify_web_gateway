import { buildApp } from './app.ts';
import { env } from './config/env.ts';

const app = buildApp();

void app
  .listen({ port: env.port, host: '127.0.0.1' })
  .then(() => {
    console.log(`http://127.0.0.1:${env.port}`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
