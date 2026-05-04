# Architecture (ShieldPay)

This is a high-level view of the app’s components, data flows, and trust boundaries.

```mermaid
flowchart LR
  %% Zones / trust boundaries
  subgraph internet["Untrusted zone (Internet)"]
    U["User / Attacker"]
    B["Browser (React SPA)"]
  end

  subgraph app["Semi-trusted zone (App server)"]
    V["Vite dev server\n(dev only)"]
    API["Express API\n(server.js + backend/app.js)\n- sessions (express-session)\n- JWT auth\n- rate limiting\n- CSRF (lusca)"]
  end

  subgraph data["Trusted zone (Data)"]
    DB[("SQLite file\nbetter-sqlite3")]
  end

  %% Flows
  U -->|"HTTP(S)"| B

  %% Dev flow
  B -->|"Dev assets + HMR\n(NODE_ENV!=production)"| V
  V -->|"Proxies /api requests\n(via Express middleware chain)"| API

  %% Prod flow (static + API from same process)
  B -->|"Static assets + /api\n(NODE_ENV=production)"| API

  %% Auth / security mechanisms
  B -->|"POST /api/auth/*\ncredentials + session cookie"| API
  B -->|"Authorization: Bearer <JWT>\n(admin routes)"| API

  %% Data access
  API -->|"SQL queries"| DB
```

## Notes

- **CSRF**: enabled via `lusca` for non-test runs; clients must follow the cookie/header token flow.
- **Auth models**: session cookie for browser flows; JWT for admin-protected API endpoints.
- **Database**: SQLite is a local file; protecting the host and backups matters as much as input validation.

