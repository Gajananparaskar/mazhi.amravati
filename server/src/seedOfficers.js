const bcrypt = require('bcryptjs');
const db = require('./db');
const supabase = require('./supabase');

const officers = [
  {
    name: 'Suresh Deshmukh',
    email: 'sureshdeshmukh@gmail.com',
    phone: '9822011001',
    password: '123',
    department_id: 1,
    department_name: 'Water Supply Department',
    role: 'officer',
  },
  {
    name: 'Rajesh Patil',
    email: 'rajeshpatil@gmail.com',
    phone: '9822011002',
    password: '123',
    department_id: 2,
    department_name: 'Roads & Potholes Department',
    role: 'officer',
  },
  {
    name: 'Nitin Kadam',
    email: 'nitinkadam@gmail.com',
    phone: '9822011003',
    password: '123',
    department_id: 3,
    department_name: 'Street Lighting Department',
    role: 'officer',
  },
  {
    name: 'Anil Gawande',
    email: 'anilgawande@gmail.com',
    phone: '9822011004',
    password: '123',
    department_id: 4,
    department_name: 'Solid Waste Management Department',
    role: 'officer',
  },
  {
    name: 'Sanjay Wankhede',
    email: 'sanjaywankhede@gmail.com',
    phone: '9822011005',
    password: '123',
    department_id: 5,
    department_name: 'Drainage & Sewerage Department',
    role: 'officer',
  },
  {
    name: 'Pravin Bhagat',
    email: 'pravinbhagat@gmail.com',
    phone: '9822011006',
    password: '123',
    department_id: 6,
    department_name: 'General Administration Department',
    role: 'officer',
  },
];

async function seed() {
  console.log('🌱 Seeding Department Officers into Database...');
  const hash = bcrypt.hashSync('123', 10);

  for (const off of officers) {
    // Check if user with this email exists in SQLite
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(off.email);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, department_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(off.name, off.email, off.phone, hash, off.role, off.department_id);
      console.log(`✅ [SQLite] Inserted Officer: ${off.name} (${off.email}) -> ${off.department_name}`);
    } else {
      // Update password hash to 123 and ensure department_id and role are set
      db.prepare(`
        UPDATE users
        SET name = ?, password_hash = ?, role = ?, department_id = ?, phone = ?
        WHERE email = ?
      `).run(off.name, hash, off.role, off.department_id, off.phone, off.email);
      console.log(`🔄 [SQLite] Updated Officer: ${off.name} (${off.email}) -> Password set to '123'`);
    }

    // Sync to Supabase if connected
    if (supabase) {
      try {
        const { error } = await supabase.from('users').upsert(
          {
            name: off.name,
            email: off.email,
            phone: off.phone,
            password_hash: hash,
            role: off.role,
            department_id: off.department_id,
          },
          { onConflict: 'email' }
        );
        if (error) {
          console.warn(`⚠️ [Supabase] Officer sync notice (${off.email}):`, error.message);
        } else {
          console.log(`✅ [Supabase] Synced Officer: ${off.name} (${off.email})`);
        }
      } catch (err) {
        console.warn(`⚠️ [Supabase] Could not sync officer (${off.email}):`, err.message);
      }
    }
  }

  console.log('✨ All Department Officers seeded successfully with password: 123');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error('Error seeding officers:', err);
    process.exit(1);
  });
}

module.exports = seed;
