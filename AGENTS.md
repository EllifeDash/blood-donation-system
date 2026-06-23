# Blood-Donation-System

Single-file Express 5 API backed by Google Sheets with n8n webhook triggers.

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Start server on `PORT` (default 3000) |
| `npm test` | Stub — exits 1; no test framework installed |

## Dependencies

`express`, `cors`, `googleapis`, `axios`. Install all with `npm install`.

## Architecture

- **Server:** `server.js` — single file, all logic in one module.
- **Framework:** Express **5** (`express@^5.2.1`). Note breaking changes from v4 (e.g., `app.listen` returns a Promise, async middleware errors handled differently).
- **Database:** Google Sheets API v4 with a service account JWT. Sheet ID hardcoded in `server.js:17`.
- **Auth:** Reads `GOOGLE_CREDENTIALS_JSON` env var first (for Render); falls back to local `google-credentials.json`.
- **Webhook:** If `N8N_WEBHOOK_URL` is set, sends a fire-and-forget POST with donor data to n8n after registration.
- **Routes:**
  - `POST /api/donors/register` — write a donor row to Sheet1 (columns A–H). Checks for duplicate mobile; marks old row inactive (`FALSE`) and appends new active row.
  - `POST /api/donors/match` — query Sheet1 by blood group + availability.

## Setup

1. `npm install`
2. Place a valid `google-credentials.json` in the project root (or set `GOOGLE_CREDENTIALS_JSON` env var on Render).
3. `npm start`

## Env Vars

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 3000) |
| `GOOGLE_CREDENTIALS_JSON` | Full service account JSON string (Render) |
| `N8N_WEBHOOK_URL` | n8n agentic workflow trigger URL |

## Important

- `google-credentials.json` is in `.gitignore` — **do not commit secrets**. Use `GOOGLE_CREDENTIALS_JSON` env var on Render.
- No linter, no formatter, no tests.
