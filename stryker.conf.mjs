/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
const config = {
  packageManager: 'npm',
  reporters: ['progress', 'clear-text'],
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.js',
  },
  // Route handlers only: `requireAuth` has conditionals that are equivalent to
  // `verifyToken` failures for some mutants (both return 401), which inflates "survived".
  mutate: ['backend/routes/auth.js', 'backend/routes/admin.js'],
  thresholds: {
    high: 50,
    low: 35,
    break: 28,
  },
  concurrency: 2,
};

export default config;
