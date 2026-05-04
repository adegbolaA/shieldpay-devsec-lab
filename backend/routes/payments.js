import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit auth attempts per IP across this router
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);
router.use(requireAuth);

const processPaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/process', processPaymentLimiter, (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const { customer_id, card_id, amount_dollars, description } = req.body || {};
    if (amount_dollars == null || !description) {
      return res.status(400).json({ error: 'amount_dollars and description required' });
    }
    const amountCents = Math.round(Number(amount_dollars) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let card = null;
    if (card_id) {
      card = db
        .prepare('SELECT * FROM cards WHERE id = ? AND merchant_id = ?')
        .get(card_id, merchantId);
      if (!card) return res.status(400).json({ error: 'Invalid card' });
    }

    const custId = customer_id ? Number(customer_id) : card?.customer_id;
    if (custId) {
      const ok = db
        .prepare('SELECT id FROM customers WHERE id = ? AND merchant_id = ?')
        .get(custId, merchantId);
      if (!ok) return res.status(400).json({ error: 'Invalid customer' });
    }

    const status = 'captured';
    const info = db
      .prepare(
        `INSERT INTO transactions (merchant_id, customer_id, card_id, amount_cents, status, description, pan_snapshot, cvv_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        merchantId,
        custId || null,
        card?.id || null,
        amountCents,
        status,
        description,
        card?.pan || null,
        card?.cvv || null
      );

    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

export default router;
