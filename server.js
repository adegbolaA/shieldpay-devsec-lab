import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';

import { createApiApp, attachGlobalErrorHandler } from './backend/app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 8788;
const LISTEN_HOST = process.env.LISTEN_HOST || '127.0.0.1';

const app = createApiApp();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});

async function main() {
  app.use(limiter);

  if (isProd) {
    const dist = path.join(__dirname, 'frontend', 'dist');
    if (!fs.existsSync(dist)) {
      console.error(
        'ShieldPay: production build not found at frontend/dist. Run `npm run build` before `npm start`.'
      );
      process.exit(1);
    }
    app.use(express.static(dist));
    // Express 5: named wildcard `/{*splat}` (plain `*` is no longer valid).
    app.get('/{*splat}', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      root: path.join(__dirname, 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  attachGlobalErrorHandler(app);

  app.listen(PORT, LISTEN_HOST, () => {
    console.log(`ShieldPay listening at http://${LISTEN_HOST}:${PORT}`);
    console.log('Demo merchant: merchant@demo.com / Demo1234!');
    if (!isProd) {
      console.log('Security lab baseline — not for production use.');
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
