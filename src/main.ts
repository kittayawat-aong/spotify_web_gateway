import { createServer } from 'node:http';
import { app } from './app.ts';
import { env } from './config/env.ts';

const server = createServer(app);

server.listen(env.port, '127.0.0.1', () => {
  console.log(`http://127.0.0.1:${env.port}`);
});
