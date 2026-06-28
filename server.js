/** LINKS:
{sheet-editor@blood-donation-system-01.iam.gserviceaccount.com}
{https://docs.google.com/spreadsheets/d/1exeaE_MdsWKvnWKIwpglHmjV7WOCdd15pan5lJLDAS8/edit?pli=1&gid=0#gid=0}
 */

const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your website frontend to safely talk to this backend API

// ── WhatsApp Client (Unofficial, headless WhatsApp Web) ──
const messageQueue = [];
let whatsappClientReady = false;

const whatsappClient = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

whatsappClient.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
  console.log('🚀 WhatsApp Client is authenticated and active!');
  whatsappClientReady = true;
  // Drain queued messages that accumulated while offline
  while (messageQueue.length > 0) {
    const { to, body, name } = messageQueue.shift();
    whatsappClient.sendMessage(to, body)
      .then(() => console.log(`Queued WhatsApp confirmation sent to ${name}`))
      .catch(err => console.error('Queued WhatsApp send failed:', err.message));
  }
});

whatsappClient.on('disconnected', () => {
  console.log('⚠️ WhatsApp Client disconnected. Reconnecting...');
  whatsappClientReady = false;
});

whatsappClient.initialize().catch(err => {
  console.error('⚠️ WhatsApp client failed to initialize (server continues running):', err.message);
});

function sendWhatsAppMessage(to, body, name) {
  if (whatsappClientReady) {
    return whatsappClient.sendMessage(to, body)
      .then(() => console.log(`WhatsApp confirmation sent to ${name}`))
      .catch(err => console.error('WhatsApp send failed:', err.message));
  } else {
    messageQueue.push({ to, body, name });
    console.log(`WhatsApp offline — queued message for ${name}`);
    return Promise.resolve();
  }
}

function formatWhatsAppNumber(mobile) {
  let cleaned = String(mobile).replace(/\D/g, '');
  if (cleaned.startsWith('0092')) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith('92')) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return '92' + cleaned + '@c.us';
}
// ─────────────────────────────────────────────────────────

// 🔑 Configuration Settings
const SPREADSHEET_ID = '1exeaE_MdsWKvnWKIwpglHmjV7WOCdd15pan5lJLDAS8'; // Actual Sheet ID
const KEY_FILE_PATH = path.join(__dirname, 'google-credentials.json'); // Make sure your downloaded JSON is renamed to this

// Authenticate with Google (Handles both local file and production cloud string)
let auth;
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
  auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
} else {
  auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

/**
 * 📩 Route 1: Trigger WhatsApp confirmation
 * Called by n8n after a donor registers via the frontend webhook.
 * Accepts phone, name, and bloodGroup to send a WhatsApp confirmation.
 */
app.post('/api/donors/register', async (req, res) => {
  try {
    const { phone, name, bloodGroup } = req.body;

    if (!phone || !name || !bloodGroup) {
      return res.status(400).json({ error: 'Phone, Name, and Blood Group are required fields.' });
    }

    // Fire-and-forget WhatsApp confirmation (non-blocking)
    const waMessage = [
      '🩸 *Nankana Public Blood Registry* 🩸',
      '',
      `Hello ${name},`,
      '',
      'Thank you for proudly registering as a volunteer blood donor with Nankana Home Care. Your profile is now securely active in our community registry.',
      '',
      `If a local family or emergency case matches your blood type (${bloodGroup.toUpperCase().trim()}), a verified operator may reach out to you via this phone number.`,
      '',
      'Thank you for your willingness to save lives locally in Nankana Sahib! ❤️'
    ].join('\n');
    sendWhatsAppMessage(formatWhatsAppNumber(phone), waMessage, name);

    return res.status(200).json({ success: true, message: 'WhatsApp confirmation triggered successfully!' });
  } catch (error) {
    console.error('WhatsApp Error:', error);
    return res.status(500).json({ error: 'Failed to send WhatsApp confirmation.' });
  }
});

/**
 * 🔍 Route 2: Match & Find Donors securely
 * Scans the sheet internally and filters matching groups without exposing the whole database
 */
app.post('/api/donors/match', async (req, res) => {
  try {
    const { requiredBloodGroup } = req.body;
    
    if (!requiredBloodGroup) {
      return res.status(400).json({ error: 'Please specify the required blood group.' });
    }

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      return res.status(200).json({ matches: [] }); // Only header or empty
    }

    // Skip the first row (headers) and filter by matching blood type and active availability
    const targetGroup = requiredBloodGroup.toUpperCase().trim();
    const matches = rows.slice(1)
      .filter(row => row[5] === targetGroup && row[7]?.toUpperCase() === 'TRUE')
      .map(row => ({
        name: row[1],
        mobile: row[3], // Ready to be piped into an email/whatsapp alert chain later
        location: row[2]
      }));

    return res.status(200).json({ success: true, count: matches.length, matches });
  } catch (error) {
    console.error('Search Error:', error);
    return res.status(500).json({ error: 'Internal system search failed.' });
  }
});

// Graceful shutdown — closes headless browser and saves session
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await whatsappClient.destroy();
  process.exit();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Zero-Cost API running smoothly on port ${PORT}`));