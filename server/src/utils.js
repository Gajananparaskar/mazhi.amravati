const db = require('./db');

function generateTrackingId() {
  const year = new Date().getFullYear();
  const row = db
    .prepare("SELECT COUNT(*) c FROM complaints WHERE public_id LIKE ?")
    .get(`AMC-${year}-%`);
  const seq = String((row.c || 0) + 1).padStart(6, '0');
  const candidate = `AMC-${year}-${seq}`;
  // guard against race/duplicate
  const exists = db.prepare('SELECT id FROM complaints WHERE public_id = ?').get(candidate);
  if (exists) return `AMC-${year}-${seq}-${Date.now().toString().slice(-4)}`;
  return candidate;
}

function assignDepartment(category) {
  const dept = db
    .prepare("SELECT * FROM departments WHERE ',' || category_keys || ',' LIKE '%,' || ? || ',%'")
    .get(category);
  if (dept) return dept;
  return db.prepare("SELECT * FROM departments WHERE category_keys LIKE '%other%'").get();
}

module.exports = { generateTrackingId, assignDepartment };
