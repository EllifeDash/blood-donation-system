# Blood-Donation-System

Single-file Express 5 API backed by Google Sheets.

## Commands

| Command | Action |
|---------|--------|
| `npm start` | Start server on `PORT` (default 3000) |
| `npm test` | Stub — exits 1; no test framework installed |

## Architecture

- **Server:** `server.js` — single file, all logic in one module.
- **Framework:** Express **5** (`express@^5.2.1`). Note breaking changes from v4 (e.g., `app.listen` returns a Promise, async middleware errors are handled differently).
- **Database:** Google Sheets API v4 with a service account JWT. Sheet ID hardcoded in `server.js:16`.
- **Auth:** `google-credentials.json` (service account key) loaded at startup. This file **must exist** in the project root for the server to start.
- **Routes:**
  - `POST /api/donors/register` — write a donor row to Sheet1 (columns A–H).
  - `POST /api/donors/match` — query Sheet1 by blood group + availability.

## Setup

1. `npm install`
2. Place a valid `google-credentials.json` in the project root.
3. `npm start`

## Important

- `google-credentials.json` is **committed** to the repo (no `.gitignore`). Treat it as a secret — use env vars or a secret manager if deploying.
- No `.gitignore`, no README, no linter, no formatter, no tests.
