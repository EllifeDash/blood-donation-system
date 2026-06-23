# History Log

## 2026-06-23 — Initial fixes and improvements

### Bug fix — Match endpoint returning 0 results
- **Root cause:** The match filter checked `row[7] === 'True'` (case-sensitive), but `USER_ENTERED` stores the value as uppercased `TRUE` in the sheet.
- **Fix:** Changed to `row[7]?.toUpperCase() === 'TRUE'` in `server.js:124`.
- **Also fixed:** The `match` test after the fix returned Ali Raza's record successfully.

### Bug fix — Google credentials not parsing
- **Root cause:** `google-credentials.json` had trailing JS comment lines (lines 14–19) after the JSON object, plus a UTF-8 BOM at the start. Both prevented `JSON.parse` from reading the file.
- **Fix:** Removed trailing non-JSON content and re-saved without BOM.
- **Note:** The file should remain a pure `.json` file — no comments or trailing content.

### Feature — Render-compatible auth
- Added `process.env.GOOGLE_CREDENTIALS_JSON` support to `server.js:19-34`.
- When the env var is set, the credentials JSON string is parsed and used directly with `google.auth.JWT`.
- Falls back to local `google-credentials.json` file for development.

### Feature — Duplicate entry prevention
- Before appending a new donor, the register route now reads existing rows and checks for matching mobile numbers (`server.js:50-71`).
- Mobile numbers are normalised (leading zeros stripped) because `USER_ENTERED` drops leading zeros.
- When a duplicate mobile is found, the old row's `IsAvailable` column is set to `FALSE`, and the new row is appended as active.
- This keeps historical records intact while ensuring only the latest registration is active.

### Other
- Created `AGENTS.md` with project commands, architecture, and setup instructions.
- Verified: register, duplicate detection, and match endpoints all working.
