// Env must be set before any test file imports `backend/db.js`.
process.env.DATABASE_PATH ??= ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'vitest-jwt-secret-must-be-32+chars!!';
process.env.SESSION_SECRET ??= 'vitest-session-secret-32chars!!!';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['backend/__tests__/**/*.test.mjs'],
  },
  coverage: {
    provider: 'v8',
    all: false,
    reporter: ['text', 'json-summary'],
    include: [
      'backend/routes/auth.js',
      'backend/routes/admin.js',
      'backend/middleware/auth.js',
    ],
    thresholds: {
      lines: 72,
      functions: 80,
      branches: 62,
      statements: 72,
    },
  },
});
