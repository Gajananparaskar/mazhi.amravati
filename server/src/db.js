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

module.exports = db;
