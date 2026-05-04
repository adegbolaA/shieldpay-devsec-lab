import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const dashboardRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/dashboard', dashboardRateLimiter, (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const totalVolume = db
      .prepare(
        `SELECT COALESCE(SUM(amount_cents),0) AS s FROM transactions WHERE merchant_id = ? AND status = 'captured'`
      )
      .get(merchantId).s;
    const txCount = db
      .prepare(`SELECT COUNT(*) AS c FROM transactions WHERE merchant_id = ?`)
      .get(merchantId).c;
    const customerCount = db
      .prepare(`SELECT COUNT(*) AS c FROM customers WHERE merchant_id = ?`)
      .get(merchantId).c;
    const cardCount = db
      .prepare(`SELECT COUNT(*) AS c FROM cards WHERE merchant_id = ?`)
      .get(merchantId).c;

    const last7 = db
      .prepare(
        `SELECT date(created_at) AS d, COALESCE(SUM(amount_cents),0) AS v, COUNT(*) AS n
         FROM transactions WHERE merchant_id = ? AND created_at >= datetime('now', '-7 days')
         GROUP BY date(created_at) ORDER BY d`
      )
      .all(merchantId);

    const recent = db
      .prepare(
        `SELECT t.id, t.amount_cents, t.status, t.description, t.created_at, c.name AS customer_name
         FROM transactions t
         LEFT JOIN customers c ON c.id = t.customer_id
         WHERE t.merchant_id = ? ORDER BY t.id DESC LIMIT 8`
      )
      .all(merchantId);

    res.json({
      totals: {
        volume_cents: totalVolume,
        transactions: txCount,
        customers: customerCount,
        cards: cardCount,
      },
      last7_days: last7,
      recent_transactions: recent,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
