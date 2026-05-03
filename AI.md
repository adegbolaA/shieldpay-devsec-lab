# AI usage (ShieldPay)

This repository is a **security lab baseline**. When you use AI assistants (IDE agents, chat, code generation):

1. **Do not paste real secrets** into prompts (passwords, API keys, `.env` contents, private keys, session tokens).
2. **Treat AI output as untrusted** until it passes the same review as human-written code—especially for **auth**, **sessions**, **JWT**, and anything touching **cardholder-style demo data**.
3. **Prefer small, reviewable changes** over large refactors mixed with security-sensitive edits.
4. **Commits**: follow your Git host and team policy on attribution; keep commit messages factual.
5. **If AI suggests “fixing” `ARKO-LAB-*` issues**, record the rationale in your learning notes or PR description so reviewers see intent.

This file is policy guidance, not a runtime dependency.
