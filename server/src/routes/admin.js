const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('admin'));

// ---- Departments ----
router.get('/departments', (req, res) => {
  const rows = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
  res.json({ departments: rows });
});

router.post('/departments', (req, res) => {
  const { name, name_mr, name_hi, category_keys } = req.body || {};
  if (!name || !category_keys) return res.status(400).json({ error: 'name and category_keys are required' });
  const info = db
    .prepare('INSERT INTO departments (name, name_mr, name_hi, category_keys) VALUES (?,?,?,?)')
    .run(name, name_mr || null, name_hi || null, category_keys);
  res.status(201).json({ department: db.prepare('SELECT * FROM departments WHERE id = ?').get(info.lastInsertRowid) });
});

router.delete('/departments/:id', (req, res) => {
  const inUse = db.prepare('SELECT COUNT(*) c FROM users WHERE department_id = ?').get(req.params.id).c;
  if (inUse > 0) return res.status(400).json({ error: 'Cannot delete a department with assigned officers' });
  db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---- Officers ----
router.get('/officers', (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active, u.created_at, d.name as department_name, d.id as department_id
       FROM users u LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.role = 'officer' ORDER BY u.created_at DESC`
    )
    .all();
  res.json({ officers: rows });
});

router.post('/officers', (req, res) => {
  const { name, email, phone, password, department_id } = req.body || {};
  if (!name || !password || !department_id || (!email && !phone)) {
    return res.status(400).json({ error: 'name, password, department_id, and email or phone are required' });
  }
  const existing = db
    .prepare('SELECT id FROM users WHERE (email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL)')
    .get(email || null, phone || null);
  if (existing) return res.status(409).json({ error: 'An account with this email/phone already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, phone, password_hash, role, department_id) VALUES (?,?,?,?,?,?)')
    .run(name, email || null, phone || null, hash, 'officer', department_id);
  res.status(201).json({ officer: db.prepare('SELECT id, name, email, phone, department_id FROM users WHERE id = ?').get(info.lastInsertRowid) });
});

router.patch('/officers/:id/status', (req, res) => {
  const { is_active } = req.body || {};
  db.prepare('UPDATE users SET is_active = ? WHERE id = ? AND role = ?').run(is_active ? 1 : 0, req.params.id, 'officer');
  res.json({ success: true });
});

// ---- Dashboard stats ----
router.get('/stats', (req, res) => {
  const totals = db.prepare('SELECT status, COUNT(*) c FROM complaints GROUP BY status').all();
  const byDept = db
    .prepare(
      `SELECT d.name, COUNT(c.id) c FROM departments d
       LEFT JOIN complaints c ON c.department_id = d.id GROUP BY d.id`
    )
    .all();
  const totalComplaints = db.prepare('SELECT COUNT(*) c FROM complaints').get().c;
  const totalCitizens = db.prepare("SELECT COUNT(*) c FROM users WHERE role='citizen'").get().c;
  const totalOfficers = db.prepare("SELECT COUNT(*) c FROM users WHERE role='officer'").get().c;
  res.json({ totals, byDept, totalComplaints, totalCitizens, totalOfficers });
});

module.exports = router;
