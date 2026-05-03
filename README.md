# ShieldPay — DevSecOps lab

[![CI](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/ci.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/ci.yml)
[![CodeQL](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/codeql.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsec-lab/actions/workflows/codeql.yml)

Full-stack **Node.js + Express + SQLite + React (Vite)** sample shaped like a small payments console: merchants, customers, cards, transactions, sessions, and JWT-backed APIs. It is built as a **secure coding and misconfiguration lab**: several flaws are **deliberately left in** and tagged in source (for example `ARKO-LAB-*`) so they can be found with review, DAST, or SAST-style thinking.

## What this shows

- **Application security awareness**: authn/z patterns, JWT usage, session cookies, intentional “bad” examples to remediate in an exercise.
- **Secrets hygiene**: configuration via environment variables; `.env` is gitignored; no real keys ship in-repo (only demo seed strings).
- **Supply chain hygiene**: Dependabot for **npm**, **GitHub Actions**, and **base images (Dockerfile)**.
- **CI/CD guardrails**: build, production **`npm run smoke`** (hits `/api/health`), **`npm audit` (critical gate)**, **Docker image build**, **Compose validation**, **Trivy** on the built image and Dockerfile (table output; non-blocking exit code for triage).
- **PR security**: [**Dependency review**](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review) (blocks new **critical** vulnerable dependencies) and [**Gitleaks**](https://github.com/gitleaks/gitleaks-action) secret scan on the PR diff + history (see `.gitleaks.toml` allowlist for intentional lab files).
- **DevSecAI / process**: see [`AI.md`](./AI.md); data-flow and abuse cases in [`docs/THREAT-MODEL.md`](./docs/THREAT-MODEL.md).
- **SAST**: **CodeQL** (JavaScript/TypeScript) on push/PR and weekly schedule. On GitHub.com, turn on **Code scanning** once under **Settings → Code security and analysis** so CodeQL can upload results (otherwise the workflow still runs but cannot attach findings to the Security tab).
- **Security posture signal**: **OpenSSF Scorecard** (scheduled) publishes SARIF to the Security tab when enabled for the repo.

### Security automation (files & behavior)

| Area | Where | What it does |
| ---- | ----- | ------------- |
| **PR security** | [`.github/workflows/pr-security.yml`](./.github/workflows/pr-security.yml) | On every PR to `main`: **Dependency review** ([`actions/dependency-review-action@v4`](https://github.com/actions/dependency-review-action)) fails if the PR adds a **critical** vulnerable dependency (needs [**Dependency graph**](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-the-dependency-graph) enabled; on by default for most **public** repos). **Gitleaks** ([`gitleaks/gitleaks-action@v2`](https://github.com/gitleaks/gitleaks-action)) scans the PR with **full git history** (`fetch-depth: 0` on checkout). |
| **Gitleaks allowlist** | [`.gitleaks.toml`](./.gitleaks.toml) | Reduces false positives for intentional lab/demo content under **`.env.example`**, **`backend/db.js`**, and **`SECURITY-LAB.md`**. |
| **Production smoke** | [`scripts/smoke-health.mjs`](./scripts/smoke-health.mjs), [`package.json`](./package.json) script **`smoke`**, [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) | After `npm run build`, runs **`npm run smoke`**: starts **`server.js`** with **`NODE_ENV=production`**, polls **`GET /api/health`**, then stops the server. |
| **DevSecAI + threat model** | [`AI.md`](./AI.md), [`docs/THREAT-MODEL.md`](./docs/THREAT-MODEL.md) | AI usage guardrails; trust boundaries, assets, abuse cases, and ties to **`ARKO-LAB-*`** markers. |

## How it differs from “production DevSecOps”

A mature org would also add runtime image scanning in registry, full IaC policy packs, branch protections, progressive delivery, centralized logging, WAF, and enterprise secrets management. This repo layers **container reproducibility + SAST + dependency and image bump automation** on top of the lab app.

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
