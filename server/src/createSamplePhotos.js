const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function createSvgAsset(filename, title, subtitle, tag, isBefore) {
  const bgColor = isBefore ? '#3a1e1e' : '#143826';
  const accentColor = isBefore ? '#ef4444' : '#10b981';
  const tagBg = isBefore ? '#fee2e2' : '#d1fae5';
  const tagText = isBefore ? '#991b1b' : '#065f46';
  const statusLabel = isBefore ? '🔴 CITIZEN EVIDENCE (BEFORE)' : '🟢 OFFICER RESOLUTION (AFTER WORK DONE)';
  const icon = isBefore ? '⚠️' : '✅';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgColor}" />
      <stop offset="100%" stop-color="${isBefore ? '#1f1313' : '#0a1c13'}" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${isBefore ? '#4a2525' : '#1e4834'}" stroke-width="1" opacity="0.4"/>
    </pattern>
  </defs>

  <rect width="800" height="600" fill="url(#grad)"/>
  <rect width="800" height="600" fill="url(#grid)"/>

  <!-- Top Badge -->
  <rect x="40" y="40" width="460" height="44" rx="22" fill="${tagBg}" stroke="${accentColor}" stroke-width="2"/>
  <text x="60" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="900" fill="${tagText}">${statusLabel}</text>

  <!-- Tag Pill -->
  <rect x="620" y="40" width="140" height="44" rx="12" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-width="1"/>
  <text x="690" y="67" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#ffffff">${tag}</text>

  <!-- Central Icon & Graphic -->
  <circle cx="400" cy="270" r="90" fill="${accentColor}" fill-opacity="0.15" stroke="${accentColor}" stroke-width="3" stroke-dasharray="${isBefore ? '6,6' : 'none'}"/>
  <text x="400" y="295" text-anchor="middle" font-size="70">${icon}</text>

  <!-- Main Title -->
  <text x="400" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="900" fill="#ffffff">${title}</text>
  
  <!-- Subtitle Details -->
  <text x="400" y="465" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="17" font-weight="600" fill="${isBefore ? '#fca5a5' : '#6ee7b7'}">${subtitle}</text>

  <!-- Footer Branding -->
  <line x1="60" y1="520" x2="740" y2="520" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1"/>
  <text x="400" y="555" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700" fill="#ffffff" fill-opacity="0.7">MAZHI AMRAVATI • AMRAVATI MUNICIPAL CORPORATION (AMC)</text>
</svg>`;

  const filePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filePath, svg, 'utf8');
  console.log(`📸 Created photo asset: ${filename}`);
}

const photoPairs = [
  {
    before: 'pothole_rajkamal_before.svg',
    after: 'pothole_rajkamal_after.svg',
    titleBefore: 'Dangerous Deep Pothole Reported',
    subtitleBefore: 'Rajkamal Chowk Main Road • 1.5ft deep crater',
    titleAfter: 'Bitumen Layering & Asphalt Sealed',
    subtitleAfter: 'Smooth motorable surface restored with quality test passed',
    tag: 'ROADS',
  },
  {
    before: 'light_gadgenagar_before.svg',
    after: 'light_gadgenagar_after.svg',
    titleBefore: 'Street Light Pole Wire Broken & Dark',
    subtitleBefore: 'Gadge Nagar Ward 12 • Pitch dark for 4 nights',
    titleAfter: '72W High-Efficiency LED Installed',
    subtitleAfter: 'Fully illuminated street with automated timer switch',
    tag: 'LIGHTING',
  },
  {
    before: 'garbage_badnera_before.svg',
    after: 'garbage_badnera_after.svg',
    titleBefore: 'Overflowing Waste Dump & Foul Odor',
    subtitleBefore: 'Badnera Railway Station Approach • Health hazard',
    titleAfter: '100% Cleared & Disinfected Zone',
    subtitleAfter: 'Sanitized with lime powder, twin color-coded bins placed',
    tag: 'SANITATION',
  },
  {
    before: 'water_rukmini_before.svg',
    after: 'water_rukmini_after.svg',
    titleBefore: 'Main 6-Inch Pipeline Rupture & Flooding',
    subtitleBefore: 'Rukmini Nagar Chowk • Potable water loss',
    titleAfter: 'Cast Iron Collar Fitted & Water Restored',
    subtitleAfter: 'Zero leakage pressure tested at 4.2 Bar',
    tag: 'WATER',
  },
  {
    before: 'drainage_panchavati_before.svg',
    after: 'drainage_panchavati_after.svg',
    titleBefore: 'Sewer Choke & Waste Water on Road',
    subtitleBefore: 'Panchavati Square North • Heavy mosquito breeding',
    titleAfter: 'Super-Sucker Machine Cleared & Desilted',
    subtitleAfter: 'Free gravity drainage flow restored with new chamber cover',
    tag: 'DRAINAGE',
  },
  {
    before: 'pothole_camp_before.svg',
    after: 'pothole_camp_after.svg',
    titleBefore: 'Multiple Surface Craters Near School',
    subtitleBefore: 'Camp Road Near Collector Office • Hazardous commute',
    titleAfter: 'Complete Resurfacing & White Thermoplastic Line',
    subtitleAfter: 'Road hot-mix asphalt finished to standard specifications',
    tag: 'ROADS',
  },
  {
    before: 'garbage_irwin_before.svg',
    after: 'garbage_irwin_after.svg',
    titleBefore: 'Commercial Waste Dump Outside Market',
    subtitleBefore: 'Irwin Square Sabji Mandi • Plastic littering',
    titleAfter: 'Compactor Cleared & Regular Collection Set',
    subtitleAfter: 'Daily morning & evening d2d collection van assigned',
    tag: 'SOLID WASTE',
  },
  {
    before: 'light_dastur_before.svg',
    after: 'light_dastur_after.svg',
    titleBefore: '4 Continuous Dark Poles on Highway Junction',
    subtitleBefore: 'Dastur Nagar Ring Road • Accident prone spot',
    titleAfter: 'Underground Cable Replaced & All 4 Lamps On',
    subtitleAfter: 'Phase distributor box re-fused and weather-sealed',
    tag: 'LIGHTING',
  },
  {
    before: 'drainage_sai_before.svg',
    after: 'drainage_sai_after.svg',
    titleBefore: 'Open Broken Stormwater Drain Slab',
    subtitleBefore: 'Sai Nagar Main Lane • Pedestrian hazard',
    titleAfter: 'Heavy-Duty Reinforced Concrete Slab Fixed',
    subtitleAfter: 'Load-tested precast concrete slabs aligned with pavement',
    tag: 'DRAINAGE',
  },
  {
    before: 'admin_tapadia_before.svg',
    after: 'admin_tapadia_after.svg',
    titleBefore: 'Fallen Tree Branch Obstructing Public Footpath',
    subtitleBefore: 'Tapadia City Centre Lane • Complete path blocked',
    titleAfter: 'Pruned, Cleared & Hauled by Tree Squad',
    subtitleAfter: 'Walkway opened and safe transit restored within 12h',
    tag: 'ADMIN',
  },
];

for (const pair of photoPairs) {
  createSvgAsset(pair.before, pair.titleBefore, pair.subtitleBefore, pair.tag, true);
  createSvgAsset(pair.after, pair.titleAfter, pair.subtitleAfter, pair.tag, false);
}

console.log('✨ All 20 photo assets generated successfully in server/uploads!');
