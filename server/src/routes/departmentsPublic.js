const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, name_mr, name_hi, category_keys FROM departments ORDER BY name ASC').all();
  res.json({ departments: rows });
});

module.exports = router;
