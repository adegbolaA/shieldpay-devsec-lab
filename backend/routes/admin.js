import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each authenticated client on admin routes
});

// ARKO-LAB-03: only checks JWT — missing explicit role === 'admin' gate
router.use(adminLimiter);
router.use(requireAuth);

router.get('/merchants', (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, email, company_name, role, created_at FROM merchants ORDER BY id`
      )
      .all();
    res.json({ merchants: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/stats', (req, res, next) => {
  try {
    const merchants = db.prepare('SELECT COUNT(*) AS c FROM merchants').get().c;
    const tx = db.prepare('SELECT COUNT(*) AS c FROM transactions').get().c;
    const volume = db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS s FROM transactions').get().s;
    res.json({ merchants, transactions: tx, volume_cents: volume });
  } catch (e) {
    next(e);
  }
});

export default router;
