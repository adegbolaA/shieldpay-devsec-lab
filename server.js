import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { initSchema, seedIfEmpty } from './backend/db.js';
import healthRouter from './backend/routes/health.js';
import authRouter from './backend/routes/auth.js';
import customersRouter from './backend/routes/customers.js';
import cardsRouter from './backend/routes/cards.js';
import transactionsRouter from './backend/routes/transactions.js';
import paymentsRouter from './backend/routes/payments.js';
import adminRouter from './backend/routes/admin.js';
import settingsRouter from './backend/routes/settings.js';
import statsRouter from './backend/routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 8788;
const LISTEN_HOST = process.env.LISTEN_HOST || '127.0.0.1';

initSchema();
seedIfEmpty();

const app = express();

app.use(express.json());

// ARKO-LAB-05: logs full JSON bodies on API routes in development (may include passwords / card fields)
if (!isProd) {
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      console.log('[ARKO-LAB-05]', req.method, req.url, JSON.stringify(req.body));
    }
    next();
  });
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'shieldpay-session-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true },
  })
);

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/customers', customersRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/stats', statsRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

async function main() {
  if (isProd) {
    const dist = path.join(__dirname, 'frontend', 'dist');
    if (!fs.existsSync(dist)) {
      console.error(
        'ShieldPay: production build not found at frontend/dist. Run `npm run build` before `npm start`.'
      );
      process.exit(1);
    }
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
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

  // ARKO-LAB-06: exposes stack trace and request body to clients in all environments (misconfiguration)
  app.use((err, req, res, next) => {
    void next;
    console.error(err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      stack: err.stack,
      body: req.body,
    });
  });

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
