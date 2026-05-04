import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const cardsRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(cardsRateLimiter);

// ARKO-LAB-04: returns full PAN and CVV for saved cards (demo / unsafe)
router.get('/', (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const rows = db
      .prepare(
        `SELECT c.*, cu.name AS customer_name FROM cards c
         JOIN customers cu ON cu.id = c.customer_id
         WHERE c.merchant_id = ? ORDER BY c.id DESC`
      )
      .all(merchantId);
    res.json({ cards: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const row = db
      .prepare(
        `SELECT c.*, cu.name AS customer_name FROM cards c
         JOIN customers cu ON cu.id = c.customer_id
         WHERE c.id = ? AND c.merchant_id = ?`
      )
      .get(req.params.id, merchantId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

router.post('/', (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const { customer_id, brand, pan, cvv, exp_month, exp_year, holder_name } = req.body || {};
    if (!customer_id || !pan || !cvv) {
      return res.status(400).json({ error: 'customer_id, pan, cvv required (test numbers only)' });
    }
    const cust = db
      .prepare('SELECT id FROM customers WHERE id = ? AND merchant_id = ?')
      .get(customer_id, merchantId);
    if (!cust) return res.status(400).json({ error: 'Invalid customer' });
    const info = db
      .prepare(
        `INSERT INTO cards (merchant_id, customer_id, brand, pan, cvv, exp_month, exp_year, holder_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        merchantId,
        customer_id,
        brand || 'unknown',
        String(pan),
        String(cvv),
        exp_month || '12',
        exp_year || '2030',
        holder_name || ''
      );
    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

// ARKO-LAB-02: PUT by card id without verifying merchant_id matches JWT user
router.put('/:id', (req, res, next) => {
  try {
    const { brand, exp_month, exp_year, holder_name } = req.body || {};
    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare(
      `UPDATE cards SET brand = COALESCE(?, brand), exp_month = COALESCE(?, exp_month), exp_year = COALESCE(?, exp_year), holder_name = COALESCE(?, holder_name) WHERE id = ?`
    ).run(
      brand ?? existing.brand,
      exp_month ?? existing.exp_month,
      exp_year ?? existing.exp_year,
      holder_name ?? existing.holder_name,
      req.params.id
    );
    const row = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// ARKO-LAB-02: DELETE by id only — missing merchant ownership enforcement
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
