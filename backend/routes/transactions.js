import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

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
router.get('/:id', (req, res, next) => {
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
