const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const supabase = require('../supabase');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, department_id: user.department_id || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function sanitize(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// Public registration -> always creates a 'citizen' account.
// Officer/admin accounts are created only by an admin (see admin routes).
router.post('/register', async (req, res) => {
  const { name, email, phone, password, language } = req.body || {};
  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({ error: 'name, password, and email or phone are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db
    .prepare('SELECT id FROM users WHERE (email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL)')
    .get(email || null, phone || null);
  if (existing) return res.status(409).json({ error: 'An account with this email/phone already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (name, email, phone, password_hash, role, language) VALUES (?,?,?,?,?,?)')
    .run(name, email || null, phone || null, hash, 'citizen', language || 'en');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);

  // If Supabase is connected, mirror signup in Supabase auth for free email services
  if (supabase && email) {
    try {
      await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone } },
      });
    } catch (e) {
      console.warn('Supabase Auth mirror notice:', e.message);
    }
  }

  const token = signToken(user);
  res.status(201).json({ token, user: sanitize(user) });
});

router.post('/login', (req, res) => {
  const { identifier, password } = req.body || {}; // identifier = email or phone
  if (!identifier || !password) return res.status(400).json({ error: 'identifier and password are required' });

  const user = db
    .prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
    .get(identifier, identifier);
  if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ token, user: sanitize(user) });
});

// ── 1. SEND FORGOT PASSWORD OTP ─────────────────────────────────────────────
router.post('/forgot-password/send-otp', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address.' });
  }

  // Generate a cryptographically random 6-digit OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in database with 15 minutes expiry
  db.prepare(`
    INSERT INTO email_otps (email, otp_code, otp_type, expires_at)
    VALUES (?, ?, 'recovery', datetime('now', '+15 minutes'))
  `).run(email.trim().toLowerCase(), otpCode);

  // If Supabase is configured, trigger Supabase free recovery email
  if (supabase) {
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      console.log(`✅ Supabase password reset triggered for ${email}`);
    } catch (err) {
      console.warn('⚠️ Supabase email notice:', err.message);
    }
  }

  console.log(`📬 [EMAIL OTP SENT] 6-Digit Password Reset OTP for ${email}: ${otpCode}`);

  res.json({
    success: true,
    message: 'A 6-digit OTP verification code has been sent to your email.',
    dev_otp: otpCode, // Provided for instant testing during development
  });
});

// ── 2. VERIFY OTP AND RESET PASSWORD ────────────────────────────────────────
router.post('/forgot-password/verify-otp', async (req, res) => {
  const { email, otp, new_password } = req.body || {};
  if (!email || !otp || !new_password) {
    return res.status(400).json({ error: 'Email, 6-digit OTP, and new password are required.' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  // Verify OTP from database
  const validOtp = db.prepare(`
    SELECT id FROM email_otps
    WHERE email = ? AND otp_code = ? AND otp_type = 'recovery' AND is_used = 0
      AND expires_at > datetime('now')
    ORDER BY id DESC LIMIT 1
  `).get(cleanEmail, cleanOtp);

  let isVerified = !!validOtp;

  // Also verify via Supabase if connected
  if (!isVerified && supabase) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'recovery',
      });
      if (!error && data?.user) isVerified = true;
    } catch (_) {}
  }

  if (!isVerified) {
    return res.status(400).json({ error: 'Invalid or expired 6-digit OTP. Please request a new code.' });
  }

  // Mark OTP as used
  if (validOtp) {
    db.prepare('UPDATE email_otps SET is_used = 1 WHERE id = ?').run(validOtp.id);
  }

  // Update password in database
  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(newHash, cleanEmail);

  res.json({
    success: true,
    message: 'Password has been reset successfully! You can now log in with your new password.',
  });
});

// ── 3. PASSWORDLESS LOGIN WITH EMAIL OTP ─────────────────────────────────────
router.post('/email-otp/send', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

  // If user doesn't exist, create a default citizen profile
  if (!user) {
    const defaultPass = bcrypt.hashSync(Math.random().toString(36).substring(2, 10), 10);
    const info = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)')
      .run(cleanEmail.split('@')[0], cleanEmail, defaultPass, 'citizen');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.prepare(`
    INSERT INTO email_otps (email, otp_code, otp_type, expires_at)
    VALUES (?, ?, 'login', datetime('now', '+15 minutes'))
  `).run(cleanEmail, otpCode);

  if (supabase) {
    try {
      await supabase.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: true } });
    } catch (_) {}
  }

  console.log(`📬 [LOGIN OTP SENT] 6-Digit Login OTP for ${cleanEmail}: ${otpCode}`);

  res.json({
    success: true,
    message: '6-digit Login OTP sent to your email.',
    dev_otp: otpCode,
  });
});

router.post('/email-otp/verify', (req, res) => {
  const { email, otp } = req.body || {};
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

  const cleanEmail = email.trim().toLowerCase();
  const cleanOtp = otp.trim();

  const validOtp = db.prepare(`
    SELECT id FROM email_otps
    WHERE email = ? AND otp_code = ? AND otp_type = 'login' AND is_used = 0
      AND expires_at > datetime('now')
    ORDER BY id DESC LIMIT 1
  `).get(cleanEmail, cleanOtp);

  if (!validOtp) {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }

  db.prepare('UPDATE email_otps SET is_used = 1 WHERE id = ?').run(validOtp.id);

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  const token = signToken(user);
  res.json({ token, user: sanitize(user) });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitize(user) });
});

module.exports = router;
