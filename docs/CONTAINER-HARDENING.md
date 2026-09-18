# Container hardening: what's applied, what's not, and why

This documents a concrete hardening pass on the production container, including a control that was investigated and deliberately **not** shipped — the reasoning matters as much as the config.

## What's applied (portable — works locally and in CI)

[`docker-compose.yml`](../docker-compose.yml):

- `cap_drop: [ALL]` — the app needs zero Linux capabilities (no raw sockets, no privileged ports, no filesystem capability bits). Verified empirically: full request cycle (startup schema init, bcrypt seeding, HTTP serving) works identically with every capability dropped.
- `security_opt: [no-new-privileges:true]` — blocks privilege escalation via setuid/setgid binaries or file capabilities, even if one were somehow introduced later.
- `read_only: true` + `tmpfs: [/tmp]` — the root filesystem is immutable at runtime. The only writable paths are the SQLite data volume (`/app/backend/data`) and `/tmp`.

[`policy/docker-compose.rego`](../policy/docker-compose.rego) turns all three into a **Conftest CI gate**, not just a one-time config change — a PR that drops `read_only: true` while editing the compose file fails CI with `service "shieldpay" must set read_only: true`. Verified by testing the policy against a deliberately broken copy of the compose file.

## AppArmor: real, but CI-only

A custom profile ([`policy/apparmor/shieldpay-hardened`](../policy/apparmor/shieldpay-hardened)) scopes the container to exactly what it needs: read the app + runtime, read/write only its SQLite data dir and `/tmp`, TCP only. Everything else is denied by AppArmor's default-deny, not carved out with explicit deny rules.

**This is loaded and enforced in `.github/workflows/ci.yml`'s `docker` job, on the GitHub Actions Ubuntu runner — not locally.** Docker Desktop's Linux VM doesn't ship AppArmor at all, so a profile referenced in `docker-compose.yml` would silently do nothing on most contributors' machines while looking like it's protecting something. Rather than ship a control that's a no-op outside CI, it's wired directly into the CI job with a **negative-control test**: the job asserts the app serves traffic normally under the profile, then confirms `cat /etc/shadow` inside the container is denied (a path deliberately outside the profile's allow-list) — proving the profile is actually confining the process, not just present and ignored.

## seccomp: investigated, not shipped — here's why

The instinct was to trace the container's real syscalls and ship a tightened custom seccomp profile on top of Docker's default. In practice:

1. Traced the app under `strace -f` from process birth (not attached after the fact, which misses libuv threadpool threads spawned before attach — an easy mistake that would have produced an incomplete trace). A representative sweep (health checks, login/register attempts, CRUD routes, 404s, malformed bodies) surfaced **64 distinct syscalls**.
2. Cross-referenced against Docker's publicly documented default seccomp profile (`moby/moby`'s `daemon/pkg/oci/fixtures/default.json`, 375 allowed syscalls) to see what could safely be trimmed.
3. The diff showed 4 syscalls the app used successfully — `clone3`, `io_uring_enter`, `io_uring_setup`, `rseq` — that aren't in that reference file at all. Since the app plainly worked, that meant **the public reference didn't match what this Docker Engine version actually enforces.**
4. Confirmed directly against the running container (`/proc/1/status` → `Seccomp: 2`, `Seccomp_filters: 1`, with `SecurityOpt: []`, i.e. genuinely running under Docker's real, unmodified default) — the real enforced profile is more permissive than the reference file, in ways that matter for correctness.

Given that, hand-building a tighter custom allow-list from that trace would mean shipping a profile verified against a document that's already been shown not to match reality. A profile one syscall short of correct doesn't fail loudly in review — it fails as an intermittent `EPERM` crash under whatever code path exercises the missing syscall, in whatever environment happens to be closest to the trace's blind spots. That's a worse outcome than leaving Docker's own default in place, which is already a well-maintained allow-list and was empirically confirmed active on this container.

**Decision:** keep Docker's default seccomp profile (it's already doing its job), and treat a properly-verified custom profile as follow-up work that needs a real generate-and-soak pipeline — e.g. running in `SCMP_ACT_LOG` (audit, non-blocking) mode against full regression/load traffic before ever switching to enforce — not a profile built from one manual tracing session.

## A bug this work surfaced

While setting up the runtime trace, the production image turned out to **not start at all**: `server.js` had a static top-level `import { createServer as createViteServer } from 'vite'`, but the production image installs with `npm ci --omit=dev` and `vite` is a devDependency. Every production container crashed on boot with `ERR_MODULE_NOT_FOUND`. Nothing in CI caught it — the `docker` job built the image but never ran it.

Fixed by making the `vite` import dynamic and scoped to the non-production branch that actually uses it (`server.js`), and closed the gap that let it ship silently: the `docker` job's new **"Runtime smoke test"** step now builds the image, runs it with the same hardened flags as `docker-compose.yml`, and fails the build if `/api/health` doesn't come up within 15 seconds.
