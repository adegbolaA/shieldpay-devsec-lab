import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'shieldpay.db');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'merchant',
      webhook_url TEXT,
      webhook_secret TEXT,
      api_key_public TEXT,
      api_key_secret TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ARKO-LAB-09: full test PAN + CVV stored in plaintext — lab only / illegal in production
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      brand TEXT,
      pan TEXT NOT NULL,
      cvv TEXT NOT NULL,
      exp_month TEXT,
      exp_year TEXT,
      holder_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
      customer_id INTEGER,
      card_id INTEGER REFERENCES cards(id) ON DELETE SET NULL,
      amount_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL,
      description TEXT,
      pan_snapshot TEXT,
      cvv_snapshot TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM merchants').get().c;
  if (count > 0) return;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shieldpay.lab';
  const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMeAdmin123!';
  const adminHash = bcrypt.hashSync(adminPass, 10);

  const demoHash = bcrypt.hashSync('Demo1234!', 10);

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (email, password_hash, company_name, role, api_key_public, api_key_secret)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminInfo = insertMerchant.run(
    adminEmail,
    adminHash,
    'ShieldPay Admin',
    'admin',
    'pk_live_demo_admin_pub',
    'sk_live_demo_admin_sec'
  );

  const demoId = insertMerchant.run(
    'merchant@demo.com',
    demoHash,
    'Demo Merchant LLC',
    'merchant',
    'pk_test_demo_merchant',
    'sk_test_demo_merchant'
  ).lastInsertRowid;

  const cust1 = db
    .prepare(
      `INSERT INTO customers (merchant_id, name, email, phone) VALUES (?, ?, ?, ?)`
    )
    .run(Number(demoId), 'Alex Tester', 'alex@example.test', '+15550001');

  const cust2 = db
    .prepare(
      `INSERT INTO customers (merchant_id, name, email, phone) VALUES (?, ?, ?, ?)`
    )
    .run(Number(demoId), 'Jamie Sample', 'jamie@example.test', '+15550002');

  // Test PANs only (Stripe/docs style test numbers)
  db.prepare(
    `INSERT INTO cards (merchant_id, customer_id, brand, pan, cvv, exp_month, exp_year, holder_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    Number(demoId),
    cust1.lastInsertRowid,
    'visa',
    '4242424242424242',
    '123',
    '12',
    '2030',
    'Alex Tester'
  );

  db.prepare(
    `INSERT INTO cards (merchant_id, customer_id, brand, pan, cvv, exp_month, exp_year, holder_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    Number(demoId),
    cust2.lastInsertRowid,
    'mastercard',
    '5555555555554444',
    '456',
    '06',
    '2029',
    'Jamie Sample'
  );

  const cards = db.prepare('SELECT id, customer_id FROM cards WHERE merchant_id = ?').all(Number(demoId));

  db.prepare(
    `INSERT INTO transactions (merchant_id, customer_id, card_id, amount_cents, status, description, pan_snapshot, cvv_snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    Number(demoId),
    cust1.lastInsertRowid,
    cards[0].id,
    2500,
    'captured',
    'Coffee subscription',
    '4242424242424242',
    '123'
  );

  db.prepare(
    `INSERT INTO transactions (merchant_id, customer_id, card_id, amount_cents, status, description, pan_snapshot, cvv_snapshot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    Number(demoId),
    cust2.lastInsertRowid,
    cards[1].id,
    12999,
    'captured',
    'Annual plan',
    '5555555555554444',
    '456'
  );

  db.prepare(
    `INSERT INTO transactions (merchant_id, customer_id, amount_cents, status, description)
     VALUES (?, ?, ?, ?, ?)`
  ).run(Number(demoId), cust1.lastInsertRowid, 500, 'refunded', 'Tip adjustment');

  void adminInfo;
}
