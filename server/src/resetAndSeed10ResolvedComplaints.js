const db = require('./db');
const supabase = require('./supabase');
const exportBackupCSV = require('./exportBackupCSV');

// Ensure backup is always generated first
exportBackupCSV();

const officers = {
  water: db.prepare("SELECT id FROM users WHERE email = 'sureshdeshmukh@gmail.com'").get()?.id || 1,
  roads: db.prepare("SELECT id FROM users WHERE email = 'rajeshpatil@gmail.com'").get()?.id || 2,
  lights: db.prepare("SELECT id FROM users WHERE email = 'nitinkadam@gmail.com'").get()?.id || 3,
  waste: db.prepare("SELECT id FROM users WHERE email = 'anilgawande@gmail.com'").get()?.id || 4,
  drainage: db.prepare("SELECT id FROM users WHERE email = 'sanjaywankhede@gmail.com'").get()?.id || 5,
  admin: db.prepare("SELECT id FROM users WHERE email = 'pravinbhagat@gmail.com'").get()?.id || 6,
};

const newComplaints = [
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
    department_id: 2, // Roads & Potholes
    assigned_officer_id: officers.roads,
    status: 'resolved',
    priority: 'high',
    photos: JSON.stringify(['pothole_rajkamal_before.svg']),
    resolution_photo: 'pothole_rajkamal_after.svg',
    upvote_count: 14,
    rating: 5,
    rating_feedback: 'Outstanding work by AMC road crew! Fixed within 24 hours with smooth asphalt.',
    created_at: '2026-09-01 09:15:00',
    resolved_at: '2026-09-01 17:30:00',
    updated_at: '2026-09-01 17:30:00',
    historyNote: 'Hot-mix asphalt laid and compacted. Bitumen leveling test passed.',
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
    department_id: 3, // Street Lighting
    assigned_officer_id: officers.lights,
    status: 'resolved',
    priority: 'normal',
    photos: JSON.stringify(['light_gadgenagar_before.svg']),
    resolution_photo: 'light_gadgenagar_after.svg',
    upvote_count: 9,
    rating: 5,
    rating_feedback: 'Entire lane is now bright and safe for evening walkers. Thank you Nitin sir!',
    created_at: '2026-09-01 10:20:00',
    resolved_at: '2026-09-01 18:45:00',
    updated_at: '2026-09-01 18:45:00',
    historyNote: 'Replaced faulty junction box and installed new 72W energy-efficient LED luminaire.',
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
    department_id: 4, // Solid Waste Management
    assigned_officer_id: officers.waste,
    status: 'resolved',
    priority: 'urgent',
    photos: JSON.stringify(['garbage_badnera_before.svg']),
    resolution_photo: 'garbage_badnera_after.svg',
    upvote_count: 22,
    rating: 5,
    rating_feedback: 'Cleaned spotlessly and disinfected with lime powder. Daily bin truck scheduled.',
    created_at: '2026-09-01 11:00:00',
    resolved_at: '2026-09-01 16:15:00',
    updated_at: '2026-09-01 16:15:00',
    historyNote: 'Hydraulic compactor lifted 3.5 tons of waste. Area sanitized and warning board placed.',
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
    department_id: 1, // Water Supply
    assigned_officer_id: officers.water,
    status: 'resolved',
    priority: 'urgent',
    photos: JSON.stringify(['water_rukmini_before.svg']),
    resolution_photo: 'water_rukmini_after.svg',
    upvote_count: 18,
    rating: 5,
    rating_feedback: 'Water supply restored before evening cooking hours. Excellent emergency response!',
    created_at: '2026-09-02 08:30:00',
    resolved_at: '2026-09-02 14:10:00',
    updated_at: '2026-09-02 14:10:00',
    historyNote: 'Excavated ruptured line, installed heavy-duty CI split collar, pressure tested at 4.2 Bar.',
  },
  {
    public_id: 'AMC-2026-000005',
    guest_name: 'Amit Verma',
    guest_contact: '9822100005',
    category: 'drainage_sewer',
    summary: 'Choked underground sewer line de-silted with Super-Sucker machine at Panchavati.',
    description: 'Black sewer water was back-flowing onto the market road near Panchavati Square causing foul odor and pedestrian inconvenience.',
    location_text: 'Panchavati Square North, Amravati, 444603 (GPS: 20.94850, 77.76420)',
    latitude: 20.94850,
    longitude: 77.76420,
    ward: 'Ward 5 - Panchavati',
    department_id: 5, // Drainage & Sewerage
    assigned_officer_id: officers.drainage,
    status: 'resolved',
    priority: 'high',
    photos: JSON.stringify(['drainage_panchavati_before.svg']),
    resolution_photo: 'drainage_panchavati_after.svg',
    upvote_count: 11,
    rating: 5,
    rating_feedback: 'Drainage line is totally clear now and water flows freely into the trunk sewer.',
    created_at: '2026-09-02 09:00:00',
    resolved_at: '2026-09-02 15:40:00',
    updated_at: '2026-09-02 15:40:00',
    historyNote: 'Jetting machine deployed. Removed plastic silt blockage; fitted reinforced chamber lid.',
  },
  {
    public_id: 'AMC-2026-000006',
    guest_name: 'Vikram Kale',
    guest_contact: '9822100006',
    category: 'roads_potholes',
    summary: 'School access road craters filled and leveled with hot bitumen mix near Camp area.',
    description: 'School buses and cycles were getting stuck in eroded road patch right opposite the District Collectorate Camp Road.',
    location_text: 'Camp Road Near Collector Office, Amravati, 444602 (GPS: 20.92800, 77.74500)',
    latitude: 20.92800,
    longitude: 77.74500,
    ward: 'Ward 3 - Camp Civil Lines',
    department_id: 2, // Roads & Potholes
    assigned_officer_id: officers.roads,
    status: 'resolved',
    priority: 'normal',
    photos: JSON.stringify(['pothole_camp_before.svg']),
    resolution_photo: 'pothole_camp_after.svg',
    upvote_count: 16,
    rating: 4,
    rating_feedback: 'Prompt road patch work done before school morning timings.',
    created_at: '2026-09-02 10:15:00',
    resolved_at: '2026-09-02 16:50:00',
    updated_at: '2026-09-02 16:50:00',
    historyNote: 'Resurfaced 45m stretch with dense bituminous macadam and road markings.',
  },
  {
    public_id: 'AMC-2026-000007',
    guest_name: 'Priya Kulkarni',
    guest_contact: '9822100007',
    category: 'garbage_waste',
    summary: 'Market vegetable waste dumped outside Irwin Hospital cleared and daily round assigned.',
    description: 'Rotting vegetable residue from weekend mandi was lying unattended near Irwin Hospital gate attracting flies.',
    location_text: 'Irwin Square Sabji Mandi, Amravati, 444601 (GPS: 20.93550, 77.75520)',
    latitude: 20.93550,
    longitude: 77.75520,
    ward: 'Ward 9 - Irwin Market',
    department_id: 4, // Solid Waste Management
    assigned_officer_id: officers.waste,
    status: 'resolved',
    priority: 'high',
    photos: JSON.stringify(['garbage_irwin_before.svg']),
    resolution_photo: 'garbage_irwin_after.svg',
    upvote_count: 19,
    rating: 5,
    rating_feedback: 'Hospital approach is sparkling clean and smells fresh. Great job AMC sanitation team!',
    created_at: '2026-09-02 11:30:00',
    resolved_at: '2026-09-02 17:15:00',
    updated_at: '2026-09-02 17:15:00',
    historyNote: 'Waste cleared with front loader. Bleaching powder sprayed across 200 sq meters.',
  },
  {
    public_id: 'AMC-2026-000008',
    guest_name: 'Rahul Tiwari',
    guest_contact: '9822100008',
    category: 'street_light',
    summary: 'Four dark highway junction light poles repaired with underground cable rewiring.',
    description: 'Dastur Nagar ring road circle had 4 continuous unlit poles causing dangerous blind spots at night for oncoming highway traffic.',
    location_text: 'Dastur Nagar Ring Road Junction, Amravati, 444606 (GPS: 20.91900, 77.76800)',
    latitude: 20.91900,
    longitude: 77.76800,
    ward: 'Ward 18 - Dastur Nagar',
    department_id: 3, // Street Lighting
    assigned_officer_id: officers.lights,
    status: 'resolved',
    priority: 'high',
    photos: JSON.stringify(['light_dastur_before.svg']),
    resolution_photo: 'light_dastur_after.svg',
    upvote_count: 25,
    rating: 5,
    rating_feedback: 'All 4 high-mast lamps are glowing brightly. Accident risk neutralized!',
    created_at: '2026-09-02 12:00:00',
    resolved_at: '2026-09-02 19:30:00',
    updated_at: '2026-09-02 19:30:00',
    historyNote: 'Excavated 12m trench, replaced burnt 3-phase aluminum cable, certified lighting LUX level.',
  },
  {
    public_id: 'AMC-2026-000009',
    guest_name: 'Neha Patil',
    guest_contact: '9822100009',
    category: 'drainage_sewer',
    summary: 'Dangerous broken concrete drain slab replaced with heavy-duty RCC cover in Sai Nagar.',
    description: 'Stormwater drain slab had collapsed into the canal creating a 4-foot deep hazard for senior citizens and children walking in lane 3.',
    location_text: 'Sai Nagar Main Lane 3, Amravati, 444607 (GPS: 20.92500, 77.78000)',
    latitude: 20.92500,
    longitude: 77.78000,
    ward: 'Ward 20 - Sai Nagar East',
    department_id: 5, // Drainage & Sewerage
    assigned_officer_id: officers.drainage,
    status: 'resolved',
    priority: 'high',
    photos: JSON.stringify(['drainage_sai_before.svg']),
    resolution_photo: 'drainage_sai_after.svg',
    upvote_count: 13,
    rating: 5,
    rating_feedback: 'Solid new concrete slab installed flush with the walking pavement. Very safe now.',
    created_at: '2026-09-02 13:40:00',
    resolved_at: '2026-09-02 18:20:00',
    updated_at: '2026-09-02 18:20:00',
    historyNote: 'Cast-in-situ reinforced concrete slab positioned and leveled with road surface.',
  },
  {
    public_id: 'AMC-2026-000010',
    guest_name: 'Sachin More',
    guest_contact: '9822100010',
    category: 'other',
    summary: 'Storm-uprooted tree trunk and heavy branches cut and cleared from public walkway.',
    description: 'A heavy banyan branch snapped during rain, blocking pedestrian access and optical fiber lines near Tapadia City Centre complex.',
    location_text: 'Tapadia City Centre Mall Road, Amravati, 444605 (GPS: 20.93800, 77.76000)',
    latitude: 20.93800,
    longitude: 77.76000,
    ward: 'Ward 11 - City Commercial Centre',
    department_id: 6, // General Administration
    assigned_officer_id: officers.admin,
    status: 'resolved',
    priority: 'normal',
    photos: JSON.stringify(['admin_tapadia_before.svg']),
    resolution_photo: 'admin_tapadia_after.svg',
    upvote_count: 8,
    rating: 5,
    rating_feedback: 'Tree cutting squad arrived with power saw within 2 hours and hauled away debris.',
    created_at: '2026-09-02 14:15:00',
    resolved_at: '2026-09-02 19:10:00',
    updated_at: '2026-09-02 19:10:00',
    historyNote: 'Garden & Disaster wing cut trunk, cleared footpath, and restored overhead lines.',
  },
];

async function resetAndSeed() {
  console.log('🧹 Clearing existing complaint data...');
  db.prepare('DELETE FROM complaint_upvotes').run();
  db.prepare('DELETE FROM complaint_status_history').run();
  db.prepare('DELETE FROM complaints').run();

  if (supabase) {
    try {
      await supabase.from('complaint_upvotes').delete().neq('id', 0);
      await supabase.from('complaint_status_history').delete().neq('id', 0);
      await supabase.from('complaints').delete().neq('id', 0);
      console.log('✅ Supabase old complaint tables cleared');
    } catch (err) {
      console.warn('⚠️ Supabase clear notice:', err.message);
    }
  }

  console.log('🌱 Inserting 10 resolved complaints with before & after photos...');

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (
      public_id, guest_name, guest_contact, category, summary, description,
      location_text, latitude, longitude, ward, department_id, assigned_officer_id,
      status, priority, photos, resolution_photo, upvote_count, rating, rating_feedback,
      created_at, resolved_at, updated_at
    ) VALUES (
      @public_id, @guest_name, @guest_contact, @category, @summary, @description,
      @location_text, @latitude, @longitude, @ward, @department_id, @assigned_officer_id,
      @status, @priority, @photos, @resolution_photo, @upvote_count, @rating, @rating_feedback,
      @created_at, @resolved_at, @updated_at
    )
  `);

  const insertHistory = db.prepare(`
    INSERT INTO complaint_status_history (complaint_id, status, note, changed_by, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const c of newComplaints) {
    const res = insertComplaint.run(c);
    const complaintId = res.lastInsertRowid;

    // Insert complete lifecycle steps
    insertHistory.run(complaintId, 'submitted', 'Grievance submitted by citizen with photographic evidence.', null, c.created_at);
    insertHistory.run(complaintId, 'assigned', `Assigned to department officer for on-site inspection.`, c.assigned_officer_id, c.created_at);
    insertHistory.run(complaintId, 'in_progress', 'Field team dispatched to location with repair machinery.', c.assigned_officer_id, c.created_at);
    insertHistory.run(complaintId, 'resolved', `Issue resolved on site. Proof of work uploaded. ${c.historyNote}`, c.assigned_officer_id, c.resolved_at);

    console.log(`✅ [Complaint ${c.public_id}] Resolved by Officer ${c.assigned_officer_id} -> ${c.summary}`);

    // Sync to Supabase
    if (supabase) {
      try {
        await supabase.from('complaints').upsert({
          id: complaintId,
          public_id: c.public_id,
          guest_name: c.guest_name,
          guest_contact: c.guest_contact,
          category: c.category,
          summary: c.summary,
          description: c.description,
          location_text: c.location_text,
          latitude: c.latitude,
          longitude: c.longitude,
          ward: c.ward,
          department_id: c.department_id,
          assigned_officer_id: c.assigned_officer_id,
          status: c.status,
          priority: c.priority,
          photos: JSON.parse(c.photos),
          resolution_photo: c.resolution_photo,
          upvote_count: c.upvote_count,
          rating: c.rating,
          rating_feedback: c.rating_feedback,
          created_at: c.created_at,
          resolved_at: c.resolved_at,
          updated_at: c.updated_at,
        });
      } catch (err) {
        console.warn(`⚠️ Supabase complaint sync (${c.public_id}):`, err.message);
      }
    }
  }

  console.log('🎉 Successfully seeded 10 resolved complaints with photos and ratings!');
}

if (require.main === module) {
  resetAndSeed().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = resetAndSeed;
