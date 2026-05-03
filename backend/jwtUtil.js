import jwt from 'jsonwebtoken';

// ARKO-LAB-07: weak default when env missing — real apps must require a strong JWT_SECRET
export function getJwtSecret() {
  return process.env.JWT_SECRET || 'shieldpay_weak_default_secret';
}

export function signToken(payload, expiresIn = '8h') {
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}
