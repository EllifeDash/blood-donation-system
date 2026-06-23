# Blood Donation System

An independent branch of Nankana Home Care. Express 5 API backed by Google Sheets, with an n8n agentic webhook trigger.

## Setup

```bash
npm install
npm start
```

Runs on port 3000 (configurable via `PORT` env var).

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | No | Server port (default 3000) |
| `GOOGLE_CREDENTIALS_JSON` | On Render | Full service account JSON string; omitting it falls back to local `google-credentials.json` |
| `N8N_WEBHOOK_URL` | No | n8n webhook URL for agentic workflow triggers |

## API

### `POST /api/donors/register`

Register a new blood donor. If the mobile number already exists, the previous record is marked inactive (`IsAvailable = FALSE`) and a new active row is appended.

**Body:**
```json
{
  "name": "Ali Raza",
  "address": "Main Bazaar, Nankana Sahib",
  "mobile": "03001234567",
  "age": 28,
  "bloodGroup": "O+",
  "medicalHistory": "Clear history"
}
```

**Success:** `200 { "success": true, "message": "..." }`

### `POST /api/donors/match`

Find active donors by blood group.

**Body:**
```json
{ "requiredBloodGroup": "O+" }
```

**Success:** `200 { "success": true, "count": 1, "matches": [...] }`

## Deployment (Render)

1. Connect the GitHub repo to Render.
2. Set `GOOGLE_CREDENTIALS_JSON` to the full service account JSON (minified) in Render's Environment Variables.
3. Optionally set `N8N_WEBHOOK_URL`.
4. Render runs `npm start` automatically.
