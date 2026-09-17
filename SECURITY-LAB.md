# ShieldPay — adversarial test fixtures

**Do not use in production.** Fake money and test card data only.

Nine vulnerabilities are deliberately planted and tagged in source as `ARKO-LAB-01` … `ARKO-LAB-09`, spanning OWASP Top 10 categories. They exist to validate that the security pipeline in [`README.md`](./README.md) — SAST, dependency review, secret scanning, mutation testing — actually catches real, planted bugs rather than just running green. For each marker: the trust boundary affected (browser → API → DB), how it was found, and the fix or explicit risk acceptance.

| ID | Category | Trust boundary | Status |
|----|------------------|-----------------|--------|
| ARKO-LAB-01 | Injection | API → DB | |
| ARKO-LAB-02 | Broken access control | Browser → API | |
| ARKO-LAB-03 | Broken access control (admin) | Browser → API | |
| ARKO-LAB-04 | Sensitive data exposure (API) | API → Browser | |
| ARKO-LAB-05 | Logging / observability gaps | API | |
| ARKO-LAB-06 | Error handling / misconfiguration | API | |
| ARKO-LAB-07 | Weak secrets | API / config | |
| ARKO-LAB-08 | Auth / reset flow | Browser → API | |
| ARKO-LAB-09 | Data at rest | API → DB | |
