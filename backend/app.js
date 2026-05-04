import express from 'express';
import session from 'express-session';

import { initSchema, seedIfEmpty } from './db.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import customersRouter from './routes/customers.js';
import cardsRouter from './routes/cards.js';
import transactionsRouter from './routes/transactions.js';
import paymentsRouter from './routes/payments.js';
import adminRouter from './routes/admin.js';
import settingsRouter from './routes/settings.js';
import statsRouter from './routes/stats.js';

/**
 * Express app with API routes only (no static/Vite). Used by server.js and tests.
 */
export function createApiApp() {
  initSchema();
  seedIfEmpty();

  const app = express();
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';

  app.use(express.json());

  // ARKO-LAB-05: logs full JSON bodies on API routes in development (may include passwords / card fields)
  if (!isProd && !isTest) {
    const sanitizeForLog = (value) => String(value).replace(/[\r\n]/g, '');
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        const safeMethod = sanitizeForLog(req.method);
        const safeUrl = sanitizeForLog(req.url);
        console.log('[ARKO-LAB-05]', safeMethod, safeUrl, JSON.stringify(req.body));
      }
      next();
    });
  }

  if (isProd) {
    app.set('trust proxy', 1);
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'shieldpay-session-fallback',
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: isProd },
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

  return app;
}

// ARKO-LAB-06: exposes stack trace and request body to clients in all environments (misconfiguration)
export function attachGlobalErrorHandler(app) {
  app.use((err, req, res, next) => {
    void next;
    console.error(err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      stack: err.stack,
      body: req.body,
    });
  });
}
