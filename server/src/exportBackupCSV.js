const fs = require('fs');
const path = require('path');
const db = require('./db');

function exportBackupCSV() {
  const rows = db.prepare(`
    SELECT 
      c.id,
      c.public_id,
      c.guest_name,
      c.guest_contact,
      c.category,
      c.summary,
      c.description,
      c.location_text,
      c.latitude,
      c.longitude,
      c.ward,
      c.status,
      c.priority,
      d.name as department_name,
      u.name as assigned_officer_name,
      c.upvote_count,
      c.rating,
      c.rating_feedback,
      c.created_at,
      c.resolved_at,
      c.updated_at
    FROM complaints c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.assigned_officer_id = u.id
    ORDER BY c.id ASC
  `).all();

  const headers = [
    'ID',
    'Tracking_ID',
    'Citizen_Guest_Name',
    'Citizen_Contact',
    'Category',
    'Summary',
    'Description',
    'Location_Address',
    'Latitude',
    'Longitude',
    'Ward',
    'Status',
    'Priority',
    'Department',
    'Assigned_Officer',
    'Upvotes',
    'Citizen_Rating',
    'Rating_Feedback',
    'Created_At',
    'Resolved_At',
    'Updated_At'
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [headers.join(',')];

  for (const r of rows) {
    csvRows.push([
      r.id,
      escapeCSV(r.public_id),
      escapeCSV(r.guest_name || 'Citizen'),
      escapeCSV(r.guest_contact),
      escapeCSV(r.category),
      escapeCSV(r.summary),
      escapeCSV(r.description),
      escapeCSV(r.location_text),
      r.latitude || '',
      r.longitude || '',
      escapeCSV(r.ward),
      escapeCSV(r.status),
      escapeCSV(r.priority),
      escapeCSV(r.department_name),
      escapeCSV(r.assigned_officer_name),
      r.upvote_count || 0,
      r.rating || '',
      escapeCSV(r.rating_feedback),
      escapeCSV(r.created_at),
      escapeCSV(r.resolved_at),
      escapeCSV(r.updated_at)
    ].join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM for Excel compatibility

  const serverBackupPath = path.join(__dirname, '..', 'backup_complaints_archive.csv');
  const clientPublicPath = path.join(__dirname, '..', '..', 'client', 'public', 'backup_complaints_archive.csv');

  fs.writeFileSync(serverBackupPath, csvContent, 'utf8');
  fs.writeFileSync(clientPublicPath, csvContent, 'utf8');

  console.log(`✅ Backed up ${rows.length} complaints to:`);
  console.log(`   - ${serverBackupPath}`);
  console.log(`   - ${clientPublicPath}`);

  return { count: rows.length, serverBackupPath, clientPublicPath };
}

if (require.main === module) {
  exportBackupCSV();
}

module.exports = exportBackupCSV;
