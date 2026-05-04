import { Router } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', (req, res, next) => {
  try {
    const row = db
      .prepare(
        `SELECT id, email, company_name, role, webhook_url, webhook_secret, api_key_public, api_key_secret, created_at
         FROM merchants WHERE id = ?`
      )
      .get(req.user.merchantId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.put('/profile', (req, res, next) => {
  try {
    const { company_name, webhook_url, webhook_secret } = req.body || {};
    db.prepare(
      `UPDATE merchants SET company_name = COALESCE(?, company_name), webhook_url = COALESCE(?, webhook_url), webhook_secret = COALESCE(?, webhook_secret) WHERE id = ?`
    ).run(company_name ?? null, webhook_url ?? null, webhook_secret ?? null, req.user.merchantId);
    const row = db
      .prepare(
        `SELECT id, email, company_name, role, webhook_url, webhook_secret, api_key_public, api_key_secret, created_at FROM merchants WHERE id = ?`
      )
      .get(req.user.merchantId);
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.post('/api-keys/rotate', (req, res, next) => {
  try {
    const pub = 'pk_' + crypto.randomBytes(12).toString('hex');
    const sec = 'sk_' + crypto.randomBytes(24).toString('hex');
    db.prepare(`UPDATE merchants SET api_key_public = ?, api_key_secret = ? WHERE id = ?`).run(
      pub,
      sec,
      req.user.merchantId
    );
    res.json({ api_key_public: pub, api_key_secret: sec });
  } catch (e) {
    next(e);
  }
});

router.get('/export', exportLimiter, (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const customers = db.prepare('SELECT * FROM customers WHERE merchant_id = ?').all(merchantId);
    const cards = db.prepare('SELECT * FROM cards WHERE merchant_id = ?').all(merchantId);
    const transactions = db
      .prepare('SELECT * FROM transactions WHERE merchant_id = ?')
      .all(merchantId);
    res.json({
      exported_at: new Date().toISOString(),
      customers,
      cards,
      transactions,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
