/** LINKS:
{sheet-editor@blood-donation-system-01.iam.gserviceaccount.com}
{https://docs.google.com/spreadsheets/d/1exeaE_MdsWKvnWKIwpglHmjV7WOCdd15pan5lJLDAS8/edit?pli=1&gid=0#gid=0}
 */

const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your website frontend to safely talk to this backend API

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
 * 📩 Route 1: Save a new Blood Donor Volunteer
 * Triggered when someone submits the registration form on your website
 */
app.post('/api/donors/register', async (req, res) => {
  try {
    const { name, address, mobile, age, bloodGroup, medicalHistory } = req.body;

    if (!name || !mobile || !bloodGroup) {
      return res.status(400).json({ error: 'Name, Mobile, and Blood Group are required fields.' });
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Read existing rows to check for duplicate mobile
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:H',
    });

    const rows = existing.data.values;
    const normalisedMobile = String(mobile).replace(/^0+/, '');

    if (rows && rows.length > 1) {
      for (let i = 1; i < rows.length; i++) {
        const storedMobile = String(rows[i][3] || '').replace(/^0+/, '');
        if (storedMobile === normalisedMobile) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Sheet1!H${i + 1}`,
            valueInputOption: 'RAW',
            resource: { values: [['FALSE']] },
          });
        }
      }
    }

    const newRow = [
      new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
      name,
      address || 'N/A',
      mobile,
      age || 'N/A',
      bloodGroup.toUpperCase().trim(),
      medicalHistory || 'Clear history',
      'True'
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [newRow] },
    });

    return res.status(200).json({ success: true, message: 'Volunteer donor registered successfully!' });
  } catch (error) {
    console.error('Spreadsheet Error:', error);
    return res.status(500).json({ error: 'Failed to write data to storage system.' });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Zero-Cost API running smoothly on port ${PORT}`));