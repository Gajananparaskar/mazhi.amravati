const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const supabase = require('../supabase');
const { authRequired, authOptional, requireRole } = require('../middleware/auth');
const { generateTrackingId, assignDepartment } = require('../utils');

const router = express.Router();

// Helper to sync new complaint to Supabase
async function syncComplaintToSupabase(data) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('complaints').upsert([
      {
        public_id: data.public_id,
        guest_name: data.guest_name,
        guest_contact: data.guest_contact,
        category: data.category,
        description: data.description,
        summary: data.summary,
        language: data.language || 'en',
        location_text: data.location_text,
        latitude: data.latitude,
        longitude: data.longitude,
        ward: data.ward,
        photos: data.photos || [],
        voice_note: data.voice_note,
        status: data.status || 'submitted',
        chat_transcript: data.chat_transcript || [],
      },
    ], { onConflict: 'public_id' });
    if (error) {
      console.warn('⚠️ Supabase complaint sync warning:', error.message);
    } else {
      console.log(`✅ Complaint ${data.public_id} successfully saved to Supabase PostgreSQL!`);
    }
  } catch (err) {
    console.warn('⚠️ Supabase sync error:', err.message);
  }
}

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype) || /^audio\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image or audio files are allowed'));
  },
});

// POST /api/complaints/upload - upload photos/voice note (used during chat flow)
router.post('/upload', authOptional, (req, res) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    const files = (req.files || []).map((f) => `/uploads/${f.filename}`);
    res.json({ files });
  });
});

// POST /api/complaints - finalize & submit a complaint (citizen logged-in or guest)
router.post('/', authOptional, (req, res) => {
  const {
    category,
    description,
    summary,
    language,
    location_text,
    latitude,
    longitude,
    ward,
    photos,
    voice_note,
    chat_transcript,
    guest_name,
    guest_contact,
  } = req.body || {};

  if (!category || !description || !location_text) {
    return res.status(400).json({ error: 'category, description and location_text are required' });
  }

  const dept = assignDepartment(category);
  const publicId = generateTrackingId();

  const info = db
    .prepare(
      `INSERT INTO complaints
       (public_id, user_id, guest_name, guest_contact, category, description, summary, language,
        location_text, latitude, longitude, ward, photos, voice_note, department_id, status, chat_transcript)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .run(
      publicId,
      req.user ? req.user.id : null,
      req.user ? null : guest_name || 'Guest',
      req.user ? null : guest_contact || null,
      category,
      description,
      summary || null,
      language || 'en',
      location_text,
      latitude ?? null,
      longitude ?? null,
      ward || null,
      JSON.stringify(photos || []),
      voice_note || null,
      dept ? dept.id : null,
      'submitted',
      JSON.stringify(chat_transcript || [])
    );

  db.prepare(
    'INSERT INTO complaint_status_history (complaint_id, status, note, changed_by) VALUES (?,?,?,?)'
  ).run(info.lastInsertRowid, 'submitted', 'Complaint filed via AI chatbot', req.user ? req.user.id : null);

  // Sync to Supabase PostgreSQL in background
  syncComplaintToSupabase({
    public_id: publicId,
    guest_name: req.user ? null : guest_name || 'Guest',
    guest_contact: req.user ? null : guest_contact || null,
    category,
    description,
    summary: summary || null,
    language: language || 'en',
    location_text,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    ward: ward || null,
    photos: photos || [],
    voice_note: voice_note || null,
    status: 'submitted',
    chat_transcript: chat_transcript || [],
  });

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ complaint: { ...complaint, photos: JSON.parse(complaint.photos || '[]') }, department: dept });
});

// GET /api/complaints/map - public: all complaints with lat/lng (for map view)
router.get('/map', (req, res) => {
  const { category, status } = req.query;
  let sql = `SELECT c.id, c.public_id, c.category, c.status, c.summary, c.description,
                    c.location_text, c.latitude, c.longitude, c.ward,
                    c.upvote_count, c.created_at, c.photos,
                    c.resolution_photo, c.rating, c.resolved_at,
                    d.name as department_name, d.name_mr as department_name_mr, d.name_hi as department_name_hi
             FROM complaints c
             LEFT JOIN departments d ON d.id = c.department_id
             WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL`;
  const params = [];
  if (category) { sql += ' AND c.category = ?'; params.push(category); }
  if (status)   { sql += ' AND c.status = ?';   params.push(status); }
  sql += ' ORDER BY c.created_at DESC LIMIT 500';
  const rows = db.prepare(sql).all(...params);
  res.json({ complaints: rows.map((r) => ({ ...r, photos: JSON.parse(r.photos || '[]') })) });
});

// GET /api/complaints/nearby - check for similar complaint within radius (metres) before submitting
router.get('/nearby', (req, res) => {
  const { lat, lng, radius = 50, category } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

  const latF = parseFloat(lat);
  const lngF = parseFloat(lng);
  const radiusM = parseFloat(radius);

  // Use the Haversine approximation inside SQLite (degrees to metres)
  // 1° lat ≈ 111320 m; 1° lng ≈ 111320 * cos(lat) m
  // We use a bounding-box pre-filter then exact Haversine for the shortlist.
  const degLat = radiusM / 111320;
  const degLng = radiusM / (111320 * Math.cos((latF * Math.PI) / 180));

  let sql = `SELECT c.id, c.public_id, c.category, c.status, c.summary, c.description,
                    c.location_text, c.latitude, c.longitude, c.upvote_count, c.created_at,
                    d.name as department_name
             FROM complaints c
             LEFT JOIN departments d ON d.id = c.department_id
             WHERE c.latitude BETWEEN ? AND ?
               AND c.longitude BETWEEN ? AND ?
               AND c.status NOT IN ('rejected')`;
  const params = [latF - degLat, latF + degLat, lngF - degLng, lngF + degLng];
  if (category) { sql += ' AND c.category = ?'; params.push(category); }
  sql += ' ORDER BY c.created_at DESC';

  const rows = db.prepare(sql).all(...params);

  // Exact Haversine filter
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const haversine = (la1, lo1, la2, lo2) => {
    const dLat = toRad(la2 - la1);
    const dLon = toRad(lo2 - lo1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const nearby = rows.filter((r) => haversine(latF, lngF, r.latitude, r.longitude) <= radiusM);
  res.json({ nearby });
});

// POST /api/complaints/:id/upvote - upvote / "me too" on an existing complaint
router.post('/:id/upvote', authOptional, (req, res) => {
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ? OR public_id = ?').get(req.params.id, req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const voterIp = req.ip || req.connection?.remoteAddress || 'unknown';
  const userId = req.user ? req.user.id : null;

  // Prevent duplicate vote from same user / ip per complaint
  const existing = userId
    ? db.prepare('SELECT id FROM complaint_upvotes WHERE complaint_id = ? AND user_id = ?').get(complaint.id, userId)
    : db.prepare('SELECT id FROM complaint_upvotes WHERE complaint_id = ? AND voter_ip = ? AND user_id IS NULL').get(complaint.id, voterIp);

  if (existing) {
    const currentVotes = complaint.upvote_count || 0;
    return res.status(409).json({
      error: 'You have already upvoted this complaint',
      upvote_count: currentVotes,
      upvotes: currentVotes,
    });
  }

  db.prepare('INSERT INTO complaint_upvotes (complaint_id, voter_ip, user_id) VALUES (?,?,?)').run(complaint.id, voterIp, userId);
  db.prepare("UPDATE complaints SET upvote_count = COALESCE(upvote_count, 0) + 1, updated_at = datetime('now') WHERE id = ?").run(complaint.id);

  const updated = db.prepare('SELECT upvote_count FROM complaints WHERE id = ?').get(complaint.id);
  const finalVotes = updated.upvote_count || 0;
  res.json({ upvote_count: finalVotes, upvotes: finalVotes });
});

// GET /api/complaints/track/:publicId - public tracking (no auth needed)
router.get('/track/:publicId', (req, res) => {
  const complaint = db
    .prepare(
      `SELECT c.*, d.name as department_name, d.name_mr as department_name_mr, d.name_hi as department_name_hi,
              u.name as officer_name
       FROM complaints c
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN users u ON u.id = c.assigned_officer_id
       WHERE c.public_id = ?`
    )
    .get(req.params.publicId);
  if (!complaint) return res.status(404).json({ error: 'No complaint found with this tracking ID' });

  const history = db
    .prepare('SELECT * FROM complaint_status_history WHERE complaint_id = ? ORDER BY created_at ASC')
    .all(complaint.id);

  res.json({
    complaint: { ...complaint, photos: JSON.parse(complaint.photos || '[]') },
    history,
  });
});

// GET /api/complaints/mine - logged in citizen's own complaints
router.get('/mine', authRequired, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json({ complaints: rows.map((r) => ({ ...r, photos: JSON.parse(r.photos || '[]') })) });
});

// GET /api/complaints/assigned - officer's queue (their department)
router.get('/assigned', authRequired, requireRole('officer', 'admin'), (req, res) => {
  const deptId = req.query.department_id || req.user.department_id;
  const rows = db
    .prepare(
      `SELECT c.*, u.name as citizen_name FROM complaints c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.department_id = ? ORDER BY c.created_at DESC`
    )
    .all(deptId);
  res.json({ complaints: rows.map((r) => ({ ...r, photos: JSON.parse(r.photos || '[]') })) });
});

// GET /api/complaints - admin: all complaints, with filters
router.get('/', authRequired, requireRole('admin'), (req, res) => {
  const { status, department_id } = req.query;
  let sql = `SELECT c.*, d.name as department_name, u.name as officer_name
             FROM complaints c
             LEFT JOIN departments d ON d.id = c.department_id
             LEFT JOIN users u ON u.id = c.assigned_officer_id WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND c.status = ?'; params.push(status); }
  if (department_id) { sql += ' AND c.department_id = ?'; params.push(department_id); }
  sql += ' ORDER BY c.created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ complaints: rows.map((r) => ({ ...r, photos: JSON.parse(r.photos || '[]') })) });
});

// PATCH /api/complaints/:id/status - officer/admin update status
router.patch('/:id/status', authRequired, requireRole('officer', 'admin'), (req, res) => {
  const { status, note, resolution_photo } = req.body || {};
  const allowed = ['assigned', 'in_progress', 'resolved', 'rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
  if (req.user.role === 'officer' && complaint.department_id !== req.user.department_id) {
    return res.status(403).json({ error: 'Not authorized for this department' });
  }

  // Enforce mandatory resolution photo for departments capable of providing after photos
  const PHOTO_MANDATORY_CATEGORIES = ['roads_potholes', 'garbage_waste', 'street_light', 'drainage_sewer', 'water_supply'];
  if (status === 'resolved' && PHOTO_MANDATORY_CATEGORIES.includes(complaint.category)) {
    const finalPhoto = resolution_photo || complaint.resolution_photo;
    if (!finalPhoto) {
      return res.status(400).json({
        error: 'A resolution proof photo is mandatory before marking this issue as resolved for this department.'
      });
    }
  }

  db.prepare(
    `UPDATE complaints
     SET status = ?,
         resolution_photo = COALESCE(?, resolution_photo),
         resolved_at = CASE WHEN ? = 'resolved' THEN datetime('now') ELSE resolved_at END,
         updated_at = datetime('now'),
         assigned_officer_id = COALESCE(assigned_officer_id, ?)
     WHERE id = ?`
  ).run(
    status,
    resolution_photo || null,
    status,
    req.user.role === 'officer' ? req.user.id : complaint.assigned_officer_id,
    req.params.id
  );

  db.prepare('INSERT INTO complaint_status_history (complaint_id, status, note, changed_by) VALUES (?,?,?,?)')
    .run(req.params.id, status, note || (status === 'resolved' ? 'Issue marked as resolved by officer' : null), req.user.id);

  // Sync to Supabase in background
  if (supabase) {
    supabase
      .from('complaints')
      .update({
        status,
        resolution_photo: resolution_photo || complaint.resolution_photo || null,
        resolved_at: status === 'resolved' ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('public_id', complaint.public_id)
      .then(() => console.log(`✅ Status for ${complaint.public_id} updated in Supabase to '${status}'`))
      .catch((err) => console.warn('Supabase status sync error:', err.message));
  }

  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id);
  res.json({ complaint: { ...updated, photos: JSON.parse(updated.photos || '[]') } });
});

// POST /api/complaints/track/:publicId/rating - citizen submits star rating & feedback for resolved complaint
router.post('/track/:publicId/rating', authOptional, (req, res) => {
  const { rating, feedback } = req.body || {};
  const numRating = parseInt(rating, 10);
  if (!numRating || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE public_id = ?').get(req.params.publicId);
  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  if (complaint.status !== 'resolved') {
    return res.status(400).json({ error: 'Ratings are only available for resolved complaints.' });
  }

  db.prepare(
    "UPDATE complaints SET rating = ?, rating_feedback = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(numRating, feedback || null, complaint.id);

  // Sync rating to Supabase
  if (supabase) {
    supabase
      .from('complaints')
      .update({
        rating: numRating,
        rating_feedback: feedback || null,
        updated_at: new Date().toISOString(),
      })
      .eq('public_id', req.params.publicId)
      .then(() => console.log(`✅ Rating for ${req.params.publicId} saved to Supabase (${numRating}★)`))
      .catch((err) => console.warn('Supabase rating sync error:', err.message));
  }

  const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaint.id);
  res.json({
    success: true,
    rating: updated.rating,
    rating_feedback: updated.rating_feedback,
  });
});

module.exports = router;
