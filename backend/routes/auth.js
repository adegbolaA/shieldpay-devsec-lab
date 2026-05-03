import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db.js';
import { signToken } from '../jwtUtil.js';

const router = Router();

router.post('/login', (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const row = db.prepare('SELECT * FROM merchants WHERE email = ?').get(email);
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({
      sub: row.id,
      email: row.email,
      role: row.role,
      merchantId: row.id,
    });
    res.json({
      token,
      user: {
        id: row.id,
        email: row.email,
        company_name: row.company_name,
        role: row.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/register', (req, res, next) => {
  try {
    const { email, password, company_name } = req.body || {};
    if (!email || !password || !company_name) {
      return res.status(400).json({ error: 'email, password, company_name required' });
    }
    const exists = db.prepare('SELECT id FROM merchants WHERE email = ?').get(email);
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare(
        `INSERT INTO merchants (email, password_hash, company_name, role) VALUES (?, ?, ?, 'merchant')`
      )
      .run(email, hash, company_name);
    const token = signToken({
      sub: info.lastInsertRowid,
      email,
      role: 'merchant',
      merchantId: Number(info.lastInsertRowid),
    });
    res.status(201).json({
      token,
      user: {
        id: Number(info.lastInsertRowid),
        email,
        company_name,
        role: 'merchant',
      },
    });
  } catch (e) {
    next(e);
  }
});

// ARKO-LAB-08: insecure pattern — returns reset token in JSON with no email verification / no out-of-band flow
router.post('/request-reset', (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'email required' });
    const row = db.prepare('SELECT id, email FROM merchants WHERE email = ?').get(email);
    if (!row) {
      return res.json({ message: 'If the account exists, a reset was issued', resetToken: null });
    }
    const resetToken = signToken(
      { sub: row.id, purpose: 'password_reset', email: row.email },
      '1h'
    );
    res.json({
      message: 'Use this token to reset (lab only — never do this in production)',
      resetToken,
      email: row.email,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
