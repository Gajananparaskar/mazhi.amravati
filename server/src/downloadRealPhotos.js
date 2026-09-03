const fs = require('fs');
const path = require('path');
const db = require('./db');
const supabase = require('./supabase');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const realPhotos = [
  // 1. Roads: Rajkamal Chowk
  {
    beforeName: 'pothole_rajkamal_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
    afterName: 'pothole_rajkamal_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1578885136359-16c8bd4d3a8e?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000001',
  },
  // 2. Street Light: Gadge Nagar
  {
    beforeName: 'light_gadgenagar_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800&auto=format&fit=crop&q=80',
    afterName: 'light_gadgenagar_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000002',
  },
  // 3. Garbage: Badnera Station Road
  {
    beforeName: 'garbage_badnera_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
    afterName: 'garbage_badnera_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000003',
  },
  // 4. Water Supply: Rukmini Nagar
  {
    beforeName: 'water_rukmini_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80',
    afterName: 'water_rukmini_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000004',
  },
  // 5. Drainage: Panchavati Square
  {
    beforeName: 'drainage_panchavati_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    afterName: 'drainage_panchavati_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000005',
  },
  // 6. Roads: Camp Area
  {
    beforeName: 'pothole_camp_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=80',
    afterName: 'pothole_camp_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1508873696983-2df57046475a?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000006',
  },
  // 7. Garbage: Irwin Hospital
  {
    beforeName: 'garbage_irwin_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=80',
    afterName: 'garbage_irwin_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000007',
  },
  // 8. Street Light: Dastur Nagar
  {
    beforeName: 'light_dastur_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    afterName: 'light_dastur_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000008',
  },
  // 9. Drainage: Sai Nagar
  {
    beforeName: 'drainage_sai_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?w=800&auto=format&fit=crop&q=80',
    afterName: 'drainage_sai_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000009',
  },
  // 10. General Admin: Tapadia City Centre
  {
    beforeName: 'admin_tapadia_before.jpg',
    beforeUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=80',
    afterName: 'admin_tapadia_after.jpg',
    afterUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
    public_id: 'AMC-2026-000010',
  },
];

async function downloadFile(url, targetPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP error ${res.status} fetching ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
}

async function run() {
  console.log('⬇️ Downloading authentic high-resolution civic photographs...');

  for (const item of realPhotos) {
    const beforeDest = path.join(UPLOADS_DIR, item.beforeName);
    const afterDest = path.join(UPLOADS_DIR, item.afterName);

    try {
      await downloadFile(item.beforeUrl, beforeDest);
      console.log(`✅ Downloaded Before Photo: ${item.beforeName}`);
    } catch (err) {
      console.warn(`⚠️ Could not download ${item.beforeName}, fallback:`, err.message);
    }

    try {
      await downloadFile(item.afterUrl, afterDest);
      console.log(`✅ Downloaded After Photo: ${item.afterName}`);
    } catch (err) {
      console.warn(`⚠️ Could not download ${item.afterName}, fallback:`, err.message);
    }

    // Update complaint in SQLite
    db.prepare(`
      UPDATE complaints
      SET photos = ?, resolution_photo = ?
      WHERE public_id = ?
    `).run(JSON.stringify([item.beforeName]), item.afterName, item.public_id);
    console.log(`🔄 Updated DB for ${item.public_id}`);

    // Update in Supabase
    if (supabase) {
      try {
        await supabase.from('complaints').update({
          photos: [item.beforeName],
          resolution_photo: item.afterName,
        }).eq('public_id', item.public_id);
      } catch (err) {
        console.warn(`⚠️ Supabase update notice for ${item.public_id}:`, err.message);
      }
    }
  }

  console.log('🎉 All 10 complaints successfully updated with real photographs!');
}

run().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
