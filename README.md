# ShieldPay — DevSecOps lab

[![CI](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/ci.yml)
[![CodeQL](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/codeql.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/codeql.yml)

Full-stack **Node.js + Express + SQLite + React (Vite)** sample shaped like a small payments console: merchants, customers, cards, transactions, sessions, and JWT-backed APIs. It is built as a **secure coding and misconfiguration lab**: several flaws are **deliberately left in** and tagged in source (for example `ARKO-LAB-*`) so they can be found with review, DAST, or SAST-style thinking.

## What this shows (recruiter / interviewer lens)

- **Application security awareness**: authn/z patterns, JWT usage, session cookies, intentional “bad” examples to remediate in an exercise.
- **Secrets hygiene**: configuration via environment variables; `.env` is gitignored; no real keys ship in-repo (only demo seed strings).
- **Supply chain hygiene**: Dependabot for **npm**, **GitHub Actions**, and **base images (Dockerfile)**.
- **CI/CD guardrails**: build + `npm audit` (critical gate), **Docker image build**, **Compose validation**, **Trivy** misconfiguration scan on the repo (table output; non-blocking exit code so base-image noise does not hide pipeline signal).
- **SAST**: **CodeQL** (JavaScript/TypeScript) on push/PR and weekly schedule.
- **Security posture signal**: **OpenSSF Scorecard** (scheduled) publishes SARIF to the Security tab when enabled for the repo.

## How it differs from “production DevSecOps”

A mature org would also add runtime image scanning in registry, full IaC policy packs, branch protections, progressive delivery, centralized logging, WAF, and enterprise secrets management. This repo layers **container reproducibility + SAST + dependency and image bump automation** on top of the lab app; it is still a learning baseline, not a full platform.

## Quick start

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET and SESSION_SECRET to long random strings for local use.
npm ci
npm run dev
```

Then open the URL printed in the terminal (default **http://127.0.0.1:8788**).

- **Demo merchant** (seeded): `merchant@demo.com` / `Demo1234!`
- Admin user is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` on first DB init.

Production-style run (serves Vite build):

```bash
npm run build
npm start
```

### Docker (reproducible run)

Requires Docker Engine + Compose v2. Copy `.env` first (same as local Node).

```bash
cp .env.example .env
docker compose up --build
```

The app listens on **http://localhost:8788** (container binds `0.0.0.0`; see `LISTEN_HOST` in `server.js` / Compose). SQLite data persists in the `shieldpay-sqlite` volume.

## Repository safety

- **Do not commit** `.env`, SQLite files under `backend/data/`, or PEM keys (see `.gitignore`).
- Seed “API keys” and card numbers are **test / documentation-style values only**.

## License

Private / educational use unless you add a license. All third-party packages remain under their respective licenses.
