# ShieldPay

**A fintech-style payments platform, built and instrumented end-to-end with a production-grade secure SDLC.**

[![CI](https://github.com/adegbolaA/shieldpay-devsecops/actions/workflows/ci.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsecops/actions/workflows/ci.yml)
[![Mutation tests](https://github.com/adegbolaA/shieldpay-devsecops/actions/workflows/mutation.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsecops/actions/workflows/mutation.yml)
[![CodeQL](https://github.com/adegbolaA/shieldpay-devsecops/actions/workflows/codeql.yml/badge.svg)](https://github.com/adegbolaA/shieldpay-devsecops/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/adegbolaA/shieldpay-devsecops/badge)](https://scorecard.dev/viewer/?uri=github.com/adegbolaA/shieldpay-devsecops)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

ShieldPay is a full-stack **Node.js + Express + SQLite + React (Vite)** payments console — merchants, customers, cards, transactions, admin, JWT + session auth — built as the *target application* for a real secure-SDLC pipeline. The interesting part isn't the CRUD app; it's the eleven-workflow security automation stack wrapped around it, and the fact that the app ships with a set of **deliberately planted, source-tagged vulnerabilities** (`ARKO-LAB-*`) used as an adversarial test fixture to prove that pipeline actually catches real bugs, not just theoretical ones.

## What this demonstrates

- **Threat modeling** — data-flow diagram, trust boundaries, and abuse cases in [`docs/THREAT-MODEL.md`](./docs/THREAT-MODEL.md).
- **SAST** — CodeQL on every push/PR and a weekly schedule.
- **SCA / supply chain** — Dependabot across npm, GitHub Actions, and Docker base images; PR-level [Dependency review](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review) blocking new high+ vulnerabilities; [OpenSSF Scorecard](https://scorecard.dev/) posture scoring.
- **Secret scanning** — Gitleaks across the full PR diff and history.
- **Test-quality gate, not just coverage** — [Stryker](https://stryker-mutator.io/) mutation testing on the auth/admin routes; a coverage number alone can't tell you if the tests are any good, mutation score can.
- **Supply-chain provenance** — CycloneDX SBOM generated per CI run.
- **Container & IaC hardening** — zero capabilities, no privilege escalation, read-only root filesystem, and a custom AppArmor profile enforced (with a negative-control test) in CI; Trivy on the built image and the Dockerfile; Conftest turns the hardening into a CI gate, not a one-time config change. Details + a documented, evidence-based decision *not* to ship a custom seccomp profile: [`docs/CONTAINER-HARDENING.md`](./docs/CONTAINER-HARDENING.md).
- **CI/CD as a security control, not a formality** — `npm audit` is a hard `critical`-severity gate on every PR, not an advisory report nobody reads.

## Applied, not theoretical: a real remediation

The best evidence a pipeline like this works is watching it catch something real. In one pass over this repo's Dependabot backlog:

- Every one of 10 open Dependabot PRs was failing CI — but not for the reason each PR's own diff suggested. Traced it to a **critical CVE already on `main`** (arbitrary file read via Vitest's UI server, [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)) that every PR inherited through GitHub's merge-ref check, regardless of what dependency it touched.
- Patched it *without* jumping to the dependency's latest major — verified that a same-major-line patch preserved compatibility with the mutation-testing toolchain (`@stryker-mutator/vitest-runner`), where a naive major bump silently collapsed the mutation score from ~39% to ~5% while still reporting green.
- Cleared the backlog: 8 PRs merged clean, plus follow-up dependency overrides for transitively-vulnerable packages (`qs`, `esbuild`) that their direct parents hadn't picked up yet.
- **Result:** open Dependabot security alerts went from 6 → 2, and 0 critical/high vulnerabilities remain in the dependency tree — the 2 that remain are a single documented, deliberately deferred trade-off (see below), not an oversight.

A separate pass hardening the container (see [`docs/CONTAINER-HARDENING.md`](./docs/CONTAINER-HARDENING.md)) surfaced a second real bug: the production image **couldn't actually start** — a static top-level `import` of a devDependency (`vite`) that the production install doesn't ship. The `docker` CI job built the image on every PR but never ran it, so this shipped silently. Fixed the import, then closed the actual gap: CI now boots the built image under its full hardened runtime flags and fails the build if `/api/health` doesn't come up.

## Architecture

Trust boundaries, request flow, and component responsibilities: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Security automation

| Area | Where | What it does |
| ---- | ----- | ------------- |
| **PR security gate** | [`pr-security.yml`](./.github/workflows/pr-security.yml) | Dependency review fails the PR on any new high+ vulnerability; Gitleaks scans the full diff + history. |
| **SAST** | [`codeql.yml`](./.github/workflows/codeql.yml) | CodeQL (JS/TS) on push, PR, and a weekly schedule. |
| **CI gate** | [`ci.yml`](./.github/workflows/ci.yml) | Vitest API tests + coverage floor on auth/admin/`requireAuth`, production smoke test, `npm audit --audit-level=critical`, Docker build + a *runtime* smoke test under the hardened flags (not just a build), AppArmor profile load + enforce + negative-control test, Compose validation, Conftest policy check, Trivy on image + Dockerfile, SBOM (CycloneDX) artifact. |
| **Mutation testing** | [`mutation.yml`](./.github/workflows/mutation.yml), [`stryker.conf.mjs`](./stryker.conf.mjs) | Stryker + Vitest on `backend/routes/auth.js` and `backend/routes/admin.js`; build breaks below a 28% mutation-score floor. |
| **Supply-chain posture** | [`scorecard.yml`](./.github/workflows/scorecard.yml) | OpenSSF Scorecard, scheduled weekly, published to the Security tab. |
| **Release** | [`release-container.yml`](./.github/workflows/release-container.yml) | Tag push builds + publishes to GHCR, then Trivy-scans the published image. |
| **AI-assisted review** | [`AI.md`](./AI.md), [`docs/PR-AI-REVIEW-PROMPT.md`](./docs/PR-AI-REVIEW-PROMPT.md) | Guardrails for AI-assisted changes; copy-paste STRIDE-lite/diff/test-planning prompts for PR review. |

## Adversarial test fixtures

Nine flaws are deliberately planted and tagged in source (`ARKO-LAB-01` … `ARKO-LAB-09` — injection, broken access control, sensitive data exposure, logging gaps, misconfiguration, weak secrets, auth flow, data-at-rest) spanning the OWASP Top 10 categories. They exist to answer one question: **does the pipeline above actually find real, planted bugs, or does it just run green?** Tracking sheet and trust-boundary mapping: [`SECURITY-LAB.md`](./SECURITY-LAB.md).

## Engineering trade-offs

A senior engineer's job includes knowing what *not* to fix yet, and saying so out loud:

- **Vitest is intentionally pinned to the 3.x line**, not the latest major. `@stryker-mutator/vitest-runner@9.2.0` breaks under Vitest 4.x/5.x despite an unrestrictive peer-dependency range — the mutation score silently collapses while CI stays green. The remaining moderate CVE this leaves open ([GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)) is a known, accepted risk pending a coordinated Stryker + Vitest major upgrade, not an unnoticed gap.
- **No custom seccomp profile, on purpose.** Traced the container's real syscalls, then found the public Docker default-seccomp reference used to validate a tighter profile didn't match what this Engine version actually enforces (verified against `/proc/1/status` on the running container). Shipping a hand-built allow-list against a reference already shown to be wrong would trade a working control for a fragile one. Full writeup: [`docs/CONTAINER-HARDENING.md`](./docs/CONTAINER-HARDENING.md).
- A mature org would add registry-side image scanning, full IaC policy packs beyond Compose, branch protection + progressive delivery, centralized logging, a WAF, and enterprise secrets management. This repo focuses on what's provable in a CI pipeline: SAST, SCA, mutation-tested auth logic, container reproducibility, and dependency/image bump automation.

## Quick start

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET and SESSION_SECRET to long random strings for local use.
# If your shell sets NODE_ENV=production, `npm ci` skips devDependencies (no Vitest). Unset it or use:
#   PowerShell: $env:NODE_ENV='development'; npm ci
#   cmd.exe:      set NODE_ENV=development && npm ci
npm ci
npm run dev
```

Then open the URL printed in the terminal (default **http://127.0.0.1:8788**).

- **Demo merchant** (seeded): `merchant@demo.com` / `Demo1234!`
- Admin user is created from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` on first DB init.

Production-style run (serves the Vite build):

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
- Seed "API keys" and card numbers are **test / documentation-style values only**. Not for production use, and not connected to any real payment processor.

## License

[MIT](./LICENSE) — third-party packages remain under their respective licenses.
