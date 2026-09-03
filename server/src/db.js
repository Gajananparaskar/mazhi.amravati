const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('citizen','officer','admin')) DEFAULT 'citizen',
  department_id INTEGER,
  language TEXT DEFAULT 'en',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_mr TEXT,
  name_hi TEXT,
  category_keys TEXT NOT NULL, -- comma separated category slugs this dept handles
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL, -- human friendly tracking ID e.g. AMC-2026-000123
  user_id INTEGER, -- nullable for anonymous/guest complaints
  guest_name TEXT,
  guest_contact TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  summary TEXT,
  language TEXT DEFAULT 'en',
  location_text TEXT,
  latitude REAL,
  longitude REAL,
  ward TEXT,
  photos TEXT, -- JSON array of file paths
  voice_note TEXT,
  department_id INTEGER,
  assigned_officer_id INTEGER,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','assigned','in_progress','resolved','rejected')),
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
  chat_transcript TEXT, -- JSON array of {role, text, ts}
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  changed_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- Upvotes / "me too" on existing complaints
CREATE TABLE IF NOT EXISTS complaint_upvotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  complaint_id INTEGER NOT NULL,
  voter_ip TEXT,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email 6-digit OTPs for Free Supabase / Local verification
CREATE TABLE IF NOT EXISTS email_otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  otp_type TEXT NOT NULL DEFAULT 'recovery', -- 'recovery' | 'login'
  expires_at TEXT NOT NULL,
  is_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Idempotent column migrations
try {
  db.exec('ALTER TABLE complaints ADD COLUMN upvote_count INTEGER DEFAULT 0');
} catch (_) { /* column already exists */ }

try {
  db.exec('ALTER TABLE complaints ADD COLUMN resolution_photo TEXT');
} catch (_) { /* column already exists */ }

try {
  db.exec('ALTER TABLE complaints ADD COLUMN rating INTEGER');
} catch (_) { /* column already exists */ }

try {
  db.exec('ALTER TABLE complaints ADD COLUMN rating_feedback TEXT');
} catch (_) { /* column already exists */ }

try {
  db.exec('ALTER TABLE complaints ADD COLUMN resolved_at TEXT');
} catch (_) { /* column already exists */ }

// Seed departments if empty
const deptCount = db.prepare('SELECT COUNT(*) c FROM departments').get().c;
if (deptCount === 0) {
  const insertDept = db.prepare(
    'INSERT INTO departments (name, name_mr, name_hi, category_keys) VALUES (?,?,?,?)'
  );
  const depts = [
    ['Water Supply Department', 'पाणीपुरवठा विभाग', 'जल आपूर्ति विभाग', 'water_supply'],
    ['Roads & Potholes Department', 'रस्ते व खड्डे विभाग', 'सड़क एवं गड्ढे विभाग', 'roads_potholes'],
    ['Street Lighting Department', 'स्ट्रीट लाईट विभाग', 'स्ट्रीट लाइट विभाग', 'street_light'],
    ['Solid Waste Management Department', 'कचरा व्यवस्थापन विभाग', 'ठोस अपशिष्ट प्रबंधन विभाग', 'garbage_waste'],
    ['Drainage & Sewerage Department', 'गटार / निचरा विभाग', 'जल निकासी एवं सीवरेज विभाग', 'drainage_sewer'],
    ['General Administration Department', 'सर्वसाधारण प्रशासन विभाग', 'सामान्य प्रशासन विभाग', 'other'],
  ];
  const tx = db.transaction((rows) => {
    for (const r of rows) insertDept.run(...r);
  });
  tx(depts);
}

// Seed default admin if no admin exists
const adminCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role='admin'").get().c;
if (adminCount === 0) {
  const hash = bcrypt.hashSync('Admin@123', 10);
  db.prepare(
    'INSERT INTO users (name, email, phone, password_hash, role) VALUES (?,?,?,?,?)'
  ).run('Super Admin', 'admin@amravati.gov.in', '9999999999', hash, 'admin');
  console.log('Seeded default admin -> email: admin@amravati.gov.in / password: Admin@123 (CHANGE THIS)');
}

// Seed default department officers
const officerCount = db.prepare("SELECT COUNT(*) c FROM users WHERE role='officer'").get().c;
if (officerCount === 0) {
  const hash123 = bcrypt.hashSync('123', 10);
  const officers = [
    ['Suresh Deshmukh', 'sureshdeshmukh@gmail.com', '9822011001', hash123, 'officer', 1],
    ['Rajesh Patil', 'rajeshpatil@gmail.com', '9822011002', hash123, 'officer', 2],
    ['Nitin Kadam', 'nitinkadam@gmail.com', '9822011003', hash123, 'officer', 3],
    ['Anil Gawande', 'anilgawande@gmail.com', '9822011004', hash123, 'officer', 4],
    ['Sanjay Wankhede', 'sanjaywankhede@gmail.com', '9822011005', hash123, 'officer', 5],
    ['Pravin Bhagat', 'pravinbhagat@gmail.com', '9822011006', hash123, 'officer', 6],
  ];
  const insertOfficer = db.prepare(
    'INSERT INTO users (name, email, phone, password_hash, role, department_id) VALUES (?,?,?,?,?,?)'
  );
  const tx = db.transaction((rows) => {
    for (const r of rows) insertOfficer.run(...r);
  });
  tx(officers);
  console.log('Seeded 6 department officers with password: 123');
}

// Seed 5 resolved complaints with before & after photos for Amravati Issue Map
try {
  const resolvedCount = db.prepare("SELECT COUNT(*) c FROM complaints WHERE status = 'resolved' AND resolution_photo IS NOT NULL").get().c;
  if (resolvedCount < 5) {
    const resolved5 = [
      {
        public_id: 'AMC-2026-000001',
        guest_name: 'Aniket Sharma',
        guest_contact: '9822100001',
        category: 'roads_potholes',
        summary: 'Deep 1.5ft pothole repaired and re-asphalted smoothly near Rajkamal Square.',
        description: 'A massive dangerous pothole right in front of Rajkamal Chowk was causing severe traffic jams and two-wheeler slips. Demanded immediate hot-mix tar surfacing.',
        location_text: 'Rajkamal Chowk Main Road, Amravati, 444601 (GPS: 20.93201, 77.75231)',
        latitude: 20.93201,
        longitude: 77.75231,
        ward: 'Ward 8 - Rajkamal Central',
        department_id: 2,
        status: 'resolved',
        priority: 'high',
        photos: JSON.stringify(['pothole_rajkamal_before.jpg']),
        resolution_photo: 'pothole_rajkamal_after.jpg',
        upvote_count: 18,
        rating: 5,
        rating_feedback: 'Outstanding work by AMC road crew! Fixed within 24 hours with smooth asphalt.',
        created_at: '2026-09-01 09:15:00',
        resolved_at: '2026-09-01 17:30:00',
        updated_at: '2026-09-01 17:30:00',
      },
      {
        public_id: 'AMC-2026-000002',
        guest_name: 'Snehal Deshmukh',
        guest_contact: '9822100002',
        category: 'street_light',
        summary: 'Non-functional street light pole replaced with 72W high-illumination LED at Gadge Nagar.',
        description: 'Street light pole was dark for over 4 nights due to a severed overhead wire near Gadge Baba Temple. Resident safety was affected.',
        location_text: 'Gadge Nagar Main Road, Amravati, 444604 (GPS: 20.95420, 77.76180)',
        latitude: 20.95420,
        longitude: 77.76180,
        ward: 'Ward 12 - Gadge Nagar',
        department_id: 3,
        status: 'resolved',
        priority: 'normal',
        photos: JSON.stringify(['light_gadgenagar_before.jpg']),
        resolution_photo: 'light_gadgenagar_after.jpg',
        upvote_count: 12,
        rating: 5,
        rating_feedback: 'Entire lane is now bright and safe for evening walkers. Thank you Nitin sir!',
        created_at: '2026-09-01 10:20:00',
        resolved_at: '2026-09-01 18:45:00',
        updated_at: '2026-09-01 18:45:00',
      },
      {
        public_id: 'AMC-2026-000003',
        guest_name: 'Pooja Raut',
        guest_contact: '9822100003',
        category: 'garbage_waste',
        summary: 'Overflowing open garbage collection point 100% sanitized and cleared at Badnera Station Road.',
        description: 'Garbage was piling up near the station entrance causing severe stench and stray cattle gathering. Urgent mechanical cleaning was requested.',
        location_text: 'Badnera Railway Station Approach Road, Amravati, 444701 (GPS: 20.86560, 77.74040)',
        latitude: 20.86560,
        longitude: 77.74040,
        ward: 'Ward 22 - Badnera Town',
        department_id: 4,
        status: 'resolved',
        priority: 'urgent',
        photos: JSON.stringify(['garbage_badnera_before.jpg']),
        resolution_photo: 'garbage_badnera_after.jpg',
        upvote_count: 24,
        rating: 5,
        rating_feedback: 'Cleaned spotlessly and disinfected with lime powder. Daily bin truck scheduled.',
        created_at: '2026-09-01 11:00:00',
        resolved_at: '2026-09-01 16:15:00',
        updated_at: '2026-09-01 16:15:00',
      },
      {
        public_id: 'AMC-2026-000004',
        guest_name: 'Mahesh Joshi',
        guest_contact: '9822100004',
        category: 'water_supply',
        summary: 'Ruptured 6-inch water main distribution line clamped and normal pressure restored.',
        description: 'Underground pipeline burst near Rukmini Nagar square resulting in massive clean water loss and low pressure in 40 households.',
        location_text: 'Rukmini Nagar Chowk, Amravati, 444606 (GPS: 20.94120, 77.77350)',
        latitude: 20.94120,
        longitude: 77.77350,
        ward: 'Ward 15 - Rukmini Nagar',
        department_id: 1,
        status: 'resolved',
        priority: 'high',
        photos: JSON.stringify(['water_rukmini_before.jpg']),
        resolution_photo: 'water_rukmini_after.jpg',
        upvote_count: 15,
        rating: 5,
        rating_feedback: 'Water supply resumed with full pressure by evening. Great emergency response.',
        created_at: '2026-09-01 11:45:00',
        resolved_at: '2026-09-01 19:10:00',
        updated_at: '2026-09-01 19:10:00',
      },
      {
        public_id: 'AMC-2026-000005',
        guest_name: 'Dinesh Ingle',
        guest_contact: '9822100005',
        category: 'drainage_sewer',
        summary: 'Choked stormwater drain desilted and underground block cleared at Panchavati Square.',
        description: 'Heavy foul water overflow onto pedestrian walkway due to plastic clogging inside concrete chamber near Panchavati junction.',
        location_text: 'Panchavati Square, Amravati, 444603 (GPS: 20.94850, 77.76420)',
        latitude: 20.94850,
        longitude: 77.76420,
        ward: 'Ward 6 - Panchavati',
        department_id: 5,
        status: 'resolved',
        priority: 'urgent',
        photos: JSON.stringify(['drainage_panchavati_before.jpg']),
        resolution_photo: 'drainage_panchavati_after.jpg',
        upvote_count: 20,
        rating: 5,
        rating_feedback: 'Drain is flowing freely now with zero stagnation. Outstanding service!',
        created_at: '2026-09-01 12:15:00',
        resolved_at: '2026-09-01 17:50:00',
        updated_at: '2026-09-01 17:50:00',
      },
    ];

    for (const c of resolved5) {
      const existing = db.prepare('SELECT id FROM complaints WHERE public_id = ?').get(c.public_id);
      if (existing) {
        db.prepare(`
          UPDATE complaints
          SET category = ?, summary = ?, description = ?, location_text = ?,
              latitude = ?, longitude = ?, ward = ?, department_id = ?,
              status = 'resolved', priority = ?, photos = ?, resolution_photo = ?,
              upvote_count = ?, rating = ?, rating_feedback = ?, resolved_at = ?
          WHERE id = ?
        `).run(
          c.category, c.summary, c.description, c.location_text,
          c.latitude, c.longitude, c.ward, c.department_id,
          c.priority, c.photos, c.resolution_photo,
          c.upvote_count, c.rating, c.rating_feedback, c.resolved_at,
          existing.id
        );
      } else {
        db.prepare(`
          INSERT INTO complaints
          (public_id, guest_name, guest_contact, category, summary, description,
           location_text, latitude, longitude, ward, department_id, status,
           priority, photos, resolution_photo, upvote_count, rating,
           rating_feedback, created_at, resolved_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `).run(
          c.public_id, c.guest_name, c.guest_contact, c.category, c.summary, c.description,
          c.location_text, c.latitude, c.longitude, c.ward, c.department_id, c.status,
          c.priority, c.photos, c.resolution_photo, c.upvote_count, c.rating,
          c.rating_feedback, c.created_at, c.resolved_at, c.updated_at
        );
      }
    }
    console.log('✅ Seeded/Verified 5 Resolved Complaints with Before & After photos for Amravati Issue Map.');
  }
} catch (err) {
  console.error('Error seeding resolved complaints in db.js:', err.message);
}

module.exports = db;
