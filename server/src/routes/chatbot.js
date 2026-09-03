const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const { authOptional } = require('../middleware/auth');

const router = express.Router();

// ---- Multi API key rotation ----
// Set GEMINI_API_KEYS as a comma-separated list in .env for automatic failover.
// Get a free key (no credit card required) at https://aistudio.google.com/apikey
const rawKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

let keyIndex = 0;
function nextClient() {
  if (rawKeys.length === 0) return null;
  const key = rawKeys[keyIndex % rawKeys.length];
  return new GoogleGenAI({ apiKey: key });
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'; // free tier stable model

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.heic') return 'image/heic';
  return 'image/jpeg';
}

const CATEGORY_KEYS = [
  'water_supply',
  'roads_potholes',
  'street_light',
  'garbage_waste',
  'drainage_sewer',
  'other',
];

const LANG_NAMES = { en: 'English', mr: 'Marathi (मराठी)', hi: 'Hindi (हिंदी)' };

function buildSystemPrompt(language, currentExtracted = {}) {
  const langName = LANG_NAMES[language] || 'English';
  const gathered = [];
  if (currentExtracted.category) gathered.push(`- Category: ${currentExtracted.category}`);
  if (currentExtracted.location_text) gathered.push(`- Location: ${currentExtracted.location_text}`);
  if (currentExtracted.description) gathered.push(`- Description: ${currentExtracted.description}`);
  if (currentExtracted.duration_or_details) gathered.push(`- Details: ${currentExtracted.duration_or_details}`);

  const hasCore = Boolean(currentExtracted.category && currentExtracted.location_text && currentExtracted.description);

  return `You are Takrar Sahayak, a helpful municipal grievance assistant for Amravati Municipal Corporation. Reply ONLY in ${langName} in a natural, polite, and fluent conversational tone (NEVER mix English words in parentheses inside Marathi or Hindi text).

ALREADY GATHERED DETAILS SO FAR:
${gathered.length > 0 ? gathered.join('\n') : 'None yet.'}

${hasCore ? `
CRITICAL INSTRUCTION - ALL CORE DETAILS ARE ALREADY GATHERED:
The citizen has already provided Category, Location, and Description.
- NEVER tell the citizen that they haven't provided details or category!
- If the citizen says "file", "submit", "sagal dil ahe", "all given", "done", "ok", "तक्रार दाखल करा", "सगळं दिलं", or asks to proceed:
  1. Set ready_to_submit: true
  2. Write a concise English summary in the "summary" field.
  3. In "reply": Politely confirm in ${langName} that all details are recorded and ready, and tell them to click the Submit Grievance button (or that their complaint is being submitted).
` : `
Gather: category (one of: ${CATEGORY_KEYS.join('|')}), description, location_text, duration_or_details.
DO NOT re-ask for any field that is ALREADY GATHERED above. Ask only for what is still missing.
Ask ONE clear question at a time.
`}

CRITICAL INSTRUCTION WHEN ALL DETAILS (category + description + location_text) ARE GATHERED:
1. Set ready_to_submit: true
2. Write a concise 1-sentence English summary in the "summary" field.
3. In the "reply" field:
   - Thank the citizen politely.
   - State that the summary of their complaint has been generated.
   - Tell them to review the summary and click the Submit Grievance button to officially file it.
   - DO NOT say the issue has already been resolved or submitted.

Natural reply examples:
- If Marathi: "माहिती दिल्याबद्दल धन्यवाद. आपल्या तक्रारीचा सारांश तयार झाला आहे. कृपया बाजूला दिलेला सारांश तपासून 'तक्रार दाखल करा' या बटणावर क्लिक करा."
- If Hindi: "जानकारी देने के लिए धन्यवाद। आपकी शिकायत का सारांश तैयार हो गया है। कृपया विवरण की जांच करें और 'शिकायत दर्ज करें' बटन पर क्लिक करें।"
- If English: "Thank you for the details. The summary of your complaint has been generated. Please review the details in the summary panel and click on 'Submit Grievance' to officially submit your complaint."

IMPORTANT: Output must be a single valid JSON object with NO markdown code fences.
Output format: {"reply":"...","category":${currentExtracted.category ? JSON.stringify(currentExtracted.category) : 'null'},"description":${currentExtracted.description ? JSON.stringify(currentExtracted.description) : 'null'},"location_text":${currentExtracted.location_text ? JSON.stringify(currentExtracted.location_text) : 'null'},"latitude":null,"longitude":null,"duration_or_details":null,"summary":null,"ready_to_submit":${hasCore ? 'true' : 'false'}}`;
}

// POST /api/chatbot/message
// body: { message: string, history: [{role:'user'|'assistant', text:string}], language: 'en'|'mr'|'hi', currentExtracted?: object }
router.post('/message', authOptional, async (req, res) => {
  const { message, history = [], language = 'en', currentExtracted = {} } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (rawKeys.length === 0) {
    return res.status(503).json({
      error: 'AI assistant is not configured. Set GEMINI_API_KEYS in server/.env',
    });
  }

  // Gemini's `contents` array must start with a "user" turn and use "model"
  // (not "assistant") for the AI's turns.
  const firstUserIdx = history.findIndex((h) => h.role === 'user');
  const trimmedHistory = firstUserIdx === -1 ? [] : history.slice(firstUserIdx);

  const historyTurns = trimmedHistory.slice(-4).map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    text: h.text,
  }));

  // Avoid sending the new message twice if the client already included it
  const last = historyTurns[historyTurns.length - 1];
  if (last && last.role === 'user' && last.text === message) {
    historyTurns.pop();
  }

  // Collapse consecutive same-role turns
  const turns = [];
  for (const t of [...historyTurns, { role: 'user', text: message }]) {
    const prev = turns[turns.length - 1];
    if (prev && prev.role === t.role) {
      prev.text += `\n${t.text}`;
    } else {
      turns.push({ ...t });
    }
  }

  const contents = turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] }));

  let lastErr = null;
  for (let attempt = 0; attempt < rawKeys.length; attempt++) {
    const client = nextClient();
    keyIndex++;
    try {
      const resp = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: {
          systemInstruction: buildSystemPrompt(language, currentExtracted),
          responseMimeType: 'application/json',
          maxOutputTokens: 350,
          temperature: 0.0,
        },
      });
      const raw = (resp.text || '').trim();
      // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/,'').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (_e) {
        // Try to extract the first JSON object from the response (handles garbage prefix/suffix)
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (_e2) {
            parsed = null;
          }
        }
        if (!parsed) {
          // Last resort: if response looks like random/garbled text, return a safe fallback message
          const looksGarbled = !cleaned || /^[^{"a-zA-Z\u0900-\u097F\u0020-\u007E]{5,}/.test(cleaned);
          const safeReply = looksGarbled
            ? (language === 'mr' ? 'क्षमा करा, कृपया पुन्हा प्रयत्न करा.' : language === 'hi' ? 'क्षमा करें, कृपया पुनः प्रयास करें।' : 'Sorry, I did not understand. Please try again.')
            : cleaned;
          parsed = { reply: safeReply, category: null, description: null, location_text: null, latitude: null, longitude: null, duration_or_details: null, summary: null, ready_to_submit: false };
        }
      }
      // Validate lat/lng are numbers within Amravati bounding box (defense against hallucination)
      if (parsed.latitude != null || parsed.longitude != null) {
        const lat = parseFloat(parsed.latitude);
        const lng = parseFloat(parsed.longitude);
        if (isNaN(lat) || isNaN(lng) || lat < 20.8 || lat > 21.1 || lng < 77.5 || lng > 78.0) {
          parsed.latitude = null;
          parsed.longitude = null;
        }
      }

      // If citizen message contains exact GPS coordinates (e.g. "Badnera Road, Amravati (GPS: 20.93201, 77.75231)")
      const gpsMatch = message.match(/(?:GPS|gps)[:\s]+([0-9.]+)[,\s]+([0-9.]+)/i);
      if (gpsMatch) {
        const lat = parseFloat(gpsMatch[1]);
        const lng = parseFloat(gpsMatch[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= 20.8 && lat <= 21.1 && lng >= 77.5 && lng <= 78.0) {
          parsed.latitude = lat;
          parsed.longitude = lng;
          if (!parsed.location_text) {
            parsed.location_text = message.replace(/\s*\(?(?:GPS|gps)[:\s]+[0-9.]+[,\s]+[0-9.]+\)?/i, '').trim();
          }
        }
      }

      // Preserve already captured fields if parsed didn't re-extract them
      if (currentExtracted.category && !parsed.category) parsed.category = currentExtracted.category;
      if (currentExtracted.location_text && !parsed.location_text) parsed.location_text = currentExtracted.location_text;
      if (currentExtracted.description && !parsed.description) parsed.description = currentExtracted.description;
      if (currentExtracted.duration_or_details && !parsed.duration_or_details) parsed.duration_or_details = currentExtracted.duration_or_details;

      if (parsed.category && parsed.location_text && parsed.description) {
        parsed.ready_to_submit = true;
      }

      // If ready_to_submit is true, ensure reply does not falsely claim the issue is already submitted/resolved and clearly guides the user to click the Submit button
      if (parsed.ready_to_submit && parsed.reply) {
        parsed.reply = parsed.reply
          .replace(/recorded and generated/gi, 'generated')
          .replace(/generated and recorded/gi, 'generated')
          .replace(/नोंदवला आणि तयार केला/gi, 'तयार केला')
          .replace(/दर्ज और तैयार/gi, 'तैयार');

        const hasSubmitPrompt = /(?:submit|दाखल|नोंदव|दर्ज|button|बटण|बटन|click|क्लिक)/i.test(parsed.reply);
        if (!hasSubmitPrompt) {
          if (language === 'mr') {
            parsed.reply += `\n\n📌 तक्रारीचा सारांश तयार करण्यात आला आहे. कृपया बाजूला दिलेला सारांश तपासून 'तक्रार दाखल करा' (Submit Grievance) या बटणावर क्लिक करा.`;
          } else if (language === 'hi') {
            parsed.reply += `\n\n📌 आपकी शिकायत का सारांश तैयार कर लिया गया है। कृपया सारांश की जांच करें और 'शिकायत दर्ज करें' (Submit Grievance) बटन पर क्लिक करें।`;
          } else {
            parsed.reply += `\n\n📌 The summary of your complaint has been generated. Please review the details in the summary panel and click on 'Submit Grievance' to officially submit your complaint.`;
          }
        }
      }
      return res.json(parsed);
    } catch (err) {
      lastErr = err;
      // try next key on failure (rate limit / auth / transient)
      continue;
    }
  }
  console.error('Chatbot AI error (all keys failed):', lastErr?.message);
  return res.status(502).json({ error: 'AI assistant is temporarily unavailable. Please try again.' });
});

// POST /api/chatbot/analyze-image
// body: { imagePath: string, language: 'en'|'mr'|'hi' }
router.post('/analyze-image', authOptional, async (req, res) => {
  const { imagePath, language = 'en' } = req.body || {};
  if (!imagePath || typeof imagePath !== 'string') {
    return res.status(400).json({ error: 'imagePath is required' });
  }
  if (rawKeys.length === 0) {
    return res.status(503).json({ error: 'AI assistant is not configured. Set GEMINI_API_KEYS in server/.env' });
  }

  const safeFilename = path.basename(imagePath);
  const fullPath = path.join(__dirname, '..', '..', 'uploads', safeFilename);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Image file not found' });
  }

  const mimeType = getMimeType(fullPath);
  const imageBase64 = fs.readFileSync(fullPath).toString('base64');
  const langName = LANG_NAMES[language] || 'English';

  const promptText = `You are an AI civic grievance specialist for Amravati Municipal Corporation (AMC).
Analyze this uploaded citizen photograph and identify the municipal civic problem (e.g., potholes, broken road, leaking water pipe, broken streetlight, garbage heap, overflowing drain/sewer, etc.).
Determine:
1. is_civic_issue: boolean (true if it represents a city grievance)
2. category: one of ["water_supply", "roads_potholes", "street_light", "garbage_waste", "drainage_sewer", "other"]
3. severity: one of ["low", "normal", "high", "urgent"]
4. issue_title: short concise title in English
5. description: 1-2 sentence detailed objective description in English
6. suggested_message: a polite 1-2 sentence complaint message written naturally in ${langName} that the citizen can send to file this complaint.

Output ONLY a single valid JSON object with NO markdown formatting, NO backticks:
{"is_civic_issue": true, "category": "roads_potholes", "severity": "high", "issue_title": "...", "description": "...", "suggested_message": "..."}`;

  let lastErr = null;
  for (let attempt = 0; attempt < rawKeys.length; attempt++) {
    const client = nextClient();
    keyIndex++;
    try {
      const resp = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: promptText },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          maxOutputTokens: 500,
          temperature: 0.2,
        },
      });

      const raw = (resp.text || '').trim();
      const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (_e) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (!parsed) {
        return res.status(500).json({ error: 'Could not parse image analysis output.' });
      }

      if (!CATEGORY_KEYS.includes(parsed.category)) {
        parsed.category = 'other';
      }

      return res.json(parsed);
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  console.error('Image AI Vision error (all keys failed):', lastErr?.message);
  return res.status(502).json({ error: 'AI image analysis is temporarily unavailable.' });
});

module.exports = router;
