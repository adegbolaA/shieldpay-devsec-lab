import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const transactionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
});

router.use(transactionsLimiter);
router.use(requireAuth);

const transactionDetailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

router.get('/', (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const rows = db
      .prepare(
        `SELECT t.*, c.name AS customer_name FROM transactions t
         LEFT JOIN customers c ON c.id = t.customer_id
         WHERE t.merchant_id = ? ORDER BY t.id DESC LIMIT 200`
      )
      .all(merchantId);
    res.json({ transactions: rows });
  } catch (e) {
    next(e);
  }
});

// ARKO-LAB-04: sensitive data — returns full PAN/CVV snapshots on transaction detail (demo only)
router.get('/:id', transactionDetailLimiter, (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const row = db
      .prepare(
        `SELECT t.*, c.name AS customer_name FROM transactions t
         LEFT JOIN customers c ON c.id = t.customer_id
         WHERE t.id = ? AND t.merchant_id = ?`
      )
      .get(req.params.id, merchantId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

export default router;
