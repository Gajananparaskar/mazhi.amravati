require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db'); // ensures DB + seed run on boot
require('./supabase'); // initialize Supabase PostgreSQL & PostGIS client

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const chatbotRoutes = require('./routes/chatbot');
const adminRoutes = require('./routes/admin');
const departmentsPublicRoutes = require('./routes/departmentsPublic');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'amravati-samvad-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentsPublicRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Amravati Samvad API running on http://localhost:${PORT}`));
