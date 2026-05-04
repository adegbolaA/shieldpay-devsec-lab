import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const customersRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(customersRateLimiter);

router.get('/', (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const search = (req.query.search && String(req.query.search)) || '';

    // ARKO-LAB-01: SQL built via string concatenation of user input (injection-prone)
    const sql =
      `SELECT * FROM customers WHERE merchant_id = ` +
      merchantId +
      ` AND (name LIKE '%` +
      search +
      `%' OR email LIKE '%` +
      search +
      `%' OR IFNULL(phone,'') LIKE '%` +
      search +
      `%') ORDER BY id DESC`;
    const rows = db.prepare(sql).all();
    res.json({ customers: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const merchantId = req.user.merchantId;
    const row = db
      .prepare('SELECT * FROM customers WHERE id = ? AND merchant_id = ?')
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
    const { name, email, phone, notes } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name required' });
    const info = db
      .prepare(
        `INSERT INTO customers (merchant_id, name, email, phone, notes) VALUES (?, ?, ?, ?, ?)`
      )
      .run(merchantId, name, email || null, phone || null, notes || null);
    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

// ARKO-LAB-02: updates by id only — does not verify customer belongs to JWT merchant
router.put('/:id', (req, res, next) => {
  try {
    const { name, email, phone, notes } = req.body || {};
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare(
      `UPDATE customers SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), notes = COALESCE(?, notes) WHERE id = ?`
    ).run(name ?? existing.name, email ?? existing.email, phone ?? existing.phone, notes ?? existing.notes, req.params.id);
    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// ARKO-LAB-02: delete by id only — no merchant ownership check
router.delete('/:id', (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
