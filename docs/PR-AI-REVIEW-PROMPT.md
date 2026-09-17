# PR review assist — manual prompt templates

Use these **outside** the repo in your AI tool of choice, or paste into a PR comment yourself.
**Do not** put real secrets, `.env` contents, or production tokens in prompts.

## 1) Diff-oriented summary

Replace `BASE` and `HEAD` with your branch names or SHAs.

```
You are a security-minded reviewer for a Node.js + Express + SQLite app called ShieldPay.

Context:
- Read AI.md and docs/THREAT-MODEL.md in the repo for trust boundaries and ARKO-LAB-* intentional flaws.
- Merge authority is human; you advise only.

Task:
1) Summarize the behavioral impact of the diff BASE...HEAD in ≤8 bullets.
2) Call out anything touching auth, JWT, sessions, SQLite queries, or cardholder-style demo data.
3) List STRIDE-lite risks (one line each: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation) — mark “none obvious” where appropriate.
4) Suggest concrete test cases (not code) a human should run before merge.
```

## 2) STRIDE-lite only (quick pass)

```
Given this PR description and file list (paste below), perform a STRIDE-lite pass for a fintech-style demo API. One sentence per letter; flag anything involving authz bypass or sensitive logging.

PR description:
<paste>

Files changed:
<paste>
```

## 3) Synthetic tests (before asking AI to write code)

```
We use Vitest + supertest. Coverage gates apply to backend/routes/auth.js, backend/routes/admin.js, and backend/middleware/auth.js. Stryker mutates the two route files only (see stryker.conf.mjs).

Propose at most 3 new API tests that increase meaningful coverage on those files. Do NOT output full implementation until I confirm. For each test, give: route, method, setup (login JWT if needed), assertions, and which abuse class it guards (e.g. missing auth).
```

After you accept a proposal, implement tests in `backend/__tests__/`, run `npm test` and `npm run test:coverage`, then `npm run test:mutation` before merging risky changes.
