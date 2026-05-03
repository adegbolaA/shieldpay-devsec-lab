/**
 * Starts the production server briefly and checks GET /api/health.
 * Run after `npm run build` (requires frontend/dist).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const port = process.env.PORT || '8788';
const url = `http://127.0.0.1:${port}/api/health`;

const child = spawn(process.execPath, ['server.js'], {
  cwd: root,
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: port,
    LISTEN_HOST: '127.0.0.1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stderr?.on('data', () => {});
child.stdout?.on('data', () => {});

let ok = false;
try {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const body = await res.json();
        if (body?.ok === true && body?.service === 'shieldpay') {
          ok = true;
          break;
        }
      }
    } catch {
      /* server not up yet */
    }
    await delay(500);
  }
} finally {
  child.kill('SIGTERM');
  await delay(800);
  if (child.exitCode === null) child.kill('SIGKILL');
  await new Promise((r) => {
    child.once('close', r);
    setTimeout(r, 2000);
  });
}

if (!ok) {
  console.error('Smoke: server did not become healthy in time');
  process.exit(1);
}
process.exit(0);
