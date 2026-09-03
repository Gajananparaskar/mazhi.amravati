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

function buildSystemPrompt(language) {
  const langName = LANG_NAMES[language] || 'English';
  return `You are Takrar Sahayak, a helpful municipal grievance assistant for Amravati Municipal Corporation. Reply ONLY in ${langName} in a natural, polite, and fluent conversational tone (NEVER mix English words in parentheses inside Marathi or Hindi text).
Gather: category (one of: ${CATEGORY_KEYS.join('|')}), description, location_text, duration_or_details. Ask ONE clear question at a time.
latitude/longitude: only if citizen names a known Amravati area (lat 20.92-20.96, lng 77.74-77.82), else null.

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
Output format: {"reply":"...","category":null,"description":null,"location_text":null,"latitude":null,"longitude":null,"duration_or_details":null,"summary":null,"ready_to_submit":false}`;
}

const AMRAVATI_LOCATIONS = [
  { name: 'Rajkamal Chowk', keywords: ['rajkamal', 'राजकमल'], lat: 20.932, lng: 77.752 },
  { name: 'Badnera Road', keywords: ['badnera', 'बडनेरा'], lat: 20.871, lng: 77.745 },
  { name: 'Gadge Nagar', keywords: ['gadge nagar', 'गाडगे नगर', 'गाडगेनार'], lat: 20.952, lng: 77.765 },
  { name: 'Camp Area', keywords: ['camp', 'कॅम्प', 'कँप'], lat: 20.936, lng: 77.742 },
  { name: 'Panchavati Square', keywords: ['panchavati', 'पंचवटी'], lat: 20.941, lng: 77.768 },
  { name: 'Irwin Hospital Chowk', keywords: ['irwin', 'इर्विन', 'इरविन'], lat: 20.935, lng: 77.756 },
  { name: 'Rukmini Nagar', keywords: ['rukmini', 'रुक्मिणी'], lat: 20.927, lng: 77.762 },
  { name: 'Dastur Nagar', keywords: ['dastur', 'दस्तुर'], lat: 20.918, lng: 77.781 },
  { name: 'Sai Nagar', keywords: ['sai nagar', 'साई नगर'], lat: 20.912, lng: 77.769 },
  { name: 'Tapadia City', keywords: ['tapadia', 'तपाडिया'], lat: 20.946, lng: 77.773 },
  { name: 'Moshi', keywords: ['moshi', 'मोशी'], lat: 20.948, lng: 77.770 },
  { name: 'Navsari', keywords: ['navsari', 'नवसारी'], lat: 20.960, lng: 77.775 },
];

function detectCivicIntent(message, history = [], language = 'en') {
  const fullContext = (history.map((h) => h.text).join(' ') + ' ' + message).toLowerCase();
  const current = message.toLowerCase();

  // 1. Detect Category
  let category = null;
  if (/street|light|दिवा|लाईट|लाइट|विद्युत|पोल|pole|bulb|अंधार|dark/i.test(fullContext)) category = 'street_light';
  else if (/pothole|road|खड्डा|खड्डे|रस्ता|सड़क|गड्ढा|डामर|पोटहोल/i.test(fullContext)) category = 'roads_potholes';
  else if (/garbage|waste|trash|कचरा|घाण|डस्टबिन|गंदगी|कचराकुंडी|दुर्गंधी/i.test(fullContext)) category = 'garbage_waste';
  else if (/water|pipe|pipeline|पाणी|नल|जल|गळती|सप्लाय|लीक/i.test(fullContext)) category = 'water_supply';
  else if (/drain|sewer|gutter|गटार|नाली|ड्रेनेज|सांडपाणी/i.test(fullContext)) category = 'drainage_sewer';

  // 2. Detect Location in full text or current message
  let matchedLoc = null;
  for (const loc of AMRAVATI_LOCATIONS) {
    if (loc.keywords.some((k) => fullContext.includes(k))) {
      matchedLoc = loc;
      break;
    }
  }

  let locationText = matchedLoc ? matchedLoc.name : null;
  if (!locationText) {
    const locMatch = current.match(/(?:at|near|in|on|जवळ|येथे|पर|में)\s+([A-Za-z0-9\u0900-\u097F\s]{3,30})/i);
    if (locMatch) locationText = locMatch[1].trim();
  }

  // If category detected and NO location yet -> ask for location naturally
  if (category && !locationText) {
    const askLocReply = language === 'mr'
      ? 'माहिती दिल्याबद्दल धन्यवाद. ही समस्या अमरावतीमध्ये नक्की कोणत्या भागात किंवा रस्त्यावर आहे?'
      : language === 'hi'
      ? 'जानकारी देने के लिए धन्यवाद। यह समस्या अमरावती में किस क्षेत्र या सड़क पर है?'
      : 'Thank you for reporting this issue. Could you please specify the road, area, or landmark in Amravati where it is located?';
    
    return {
      reply: askLocReply,
      category,
      description: message,
      location_text: null,
      latitude: null,
      longitude: null,
      duration_or_details: null,
      summary: null,
      ready_to_submit: false,
    };
  }

  // If BOTH category and location are detected -> ready to submit!
  if (category && locationText) {
    const readyReply = language === 'mr'
      ? 'माहिती दिल्याबद्दल धन्यवाद. आपल्या तक्रारीचा सारांश तयार झाला आहे. कृपया बाजूला दिलेला सारांश तपासून \'तक्रार दाखल करा\' या बटणावर क्लिक करा.'
      : language === 'hi'
      ? 'विवरण देने के लिए धन्यवाद। आपकी शिकायत का सारांश तैयार हो गया है। कृपया सारांश की जांच करें और \'शिकायत दर्ज करें\' बटन पर क्लिक करें।'
      : 'Thank you for the details. The summary of your complaint has been generated. Please review it in the summary panel and click \'Submit Grievance\' to officially file it.';

    const catNiceName = category.replace('_', ' ');
    const summary = `Citizen reported ${catNiceName} issue at ${locationText}, Amravati for prompt municipal redressal.`;

    return {
      reply: readyReply,
      category,
      description: history.length > 0 ? history[0].text : message,
      location_text: locationText,
      latitude: matchedLoc ? matchedLoc.lat : 20.935,
      longitude: matchedLoc ? matchedLoc.lng : 77.755,
      duration_or_details: 'Urgent municipal action requested',
      summary,
      ready_to_submit: true,
    };
  }

  return null;
}

// POST /api/chatbot/message
// body: { message: string, history: [{role:'user'|'assistant', text:string}], language: 'en'|'mr'|'hi' }
router.post('/message', authOptional, async (req, res) => {
  const { message, history = [], language = 'en' } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  // 1. Check fast-path civic intent engine (instant sub-10ms response)
  const fastResult = detectCivicIntent(message, history, language);
  if (fastResult) {
    return res.json(fastResult);
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
          systemInstruction: buildSystemPrompt(language),
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
