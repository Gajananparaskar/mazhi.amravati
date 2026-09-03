import React from 'react';

/**
 * Aesthetic Illuminated Map Background of Amravati City
 * Supports both 'light' and 'dark' themes.
 * Features real landmark coordinate nodes, arterial road networks, water bodies (Wadali & Chhatri Talao),
 * geodesic grid lines, and pulsating civic beacons.
 */
export default function AmravatiMapBackground({ theme = 'light', className = '' }) {
  const isLight = theme === 'light';

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}>
      {/* Dynamic Ambient Background Illumination */}
      {isLight ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-sky-50/40 to-slate-50" />
          <div className="absolute -top-24 left-1/4 w-[650px] h-[650px] rounded-full bg-blue-400/10 blur-[130px]" />
          <div className="absolute top-1/4 right-0 w-[550px] h-[550px] rounded-full bg-saffron-400/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[600px] h-[350px] rounded-full bg-indigo-400/8 blur-[100px]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a1128] to-slate-950" />
          <div className="absolute -top-24 left-1/4 w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[130px]" />
          <div className="absolute top-1/4 right-0 w-[550px] h-[550px] rounded-full bg-saffron-500/16 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 w-[650px] h-[400px] rounded-full bg-emerald-500/12 blur-[100px]" />
        </>
      )}

      {/* SVG Map Grid & City Vector Layer */}
      <svg
        className={`absolute inset-0 w-full h-full object-cover ${isLight ? 'opacity-70' : 'opacity-50 mix-blend-screen'}`}
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Gradients for arterial roads */}
          <linearGradient id="arterial-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#2563eb' : '#38bdf8'} stopOpacity="0.8" />
            <stop offset="50%" stopColor={isLight ? '#4f46e5' : '#6366f1'} stopOpacity="0.9" />
            <stop offset="100%" stopColor={isLight ? '#6366f1' : '#818cf8'} stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="arterial-saffron" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="lake-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isLight ? '#38bdf8' : '#0284c7'} stopOpacity={isLight ? '0.35' : '0.4'} />
            <stop offset="100%" stopColor={isLight ? '#0284c7' : '#0369a1'} stopOpacity={isLight ? '0.15' : '0.15'} />
          </linearGradient>

          {/* Grid pattern */}
          <pattern id="civic-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke={isLight ? 'rgba(148, 163, 184, 0.12)' : 'rgba(255, 255, 255, 0.05)'}
              strokeWidth="1"
            />
            <circle cx="80" cy="80" r="1.5" fill={isLight ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)'} />
          </pattern>

          {/* Radar beacon animation glow */}
          <radialGradient id="beacon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Base coordinate grid */}
        <rect width="100%" height="100%" fill="url(#civic-grid)" />

        {/* 2. Topographic contours */}
        <path
          d="M100,150 Q400,80 750,140 T1350,110 M80,380 Q500,310 900,360 T1400,330 M120,620 Q600,560 1050,600 T1420,580 M90,820 Q480,780 880,810 T1380,790"
          stroke={isLight ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.1)'}
          strokeWidth="1.2"
          strokeDasharray="4 6"
          fill="none"
        />

        {/* 3. Water Bodies */}
        {/* Wadali Lake */}
        <g opacity="0.9">
          <path
            d="M980,180 C1040,160 1120,190 1100,250 C1080,300 1000,310 960,270 C920,230 940,195 980,180 Z"
            fill="url(#lake-gradient)"
            stroke={isLight ? '#0284c7' : '#38bdf8'}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          <text
            x="1000"
            y="245"
            fill={isLight ? '#0369a1' : '#38bdf8'}
            opacity="0.8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="2"
          >
            WADALI LAKE
          </text>
        </g>

        {/* Chhatri Talao */}
        <g opacity="0.85">
          <path
            d="M1080,580 C1140,560 1220,590 1200,660 C1180,710 1100,720 1060,680 C1020,640 1040,600 1080,580 Z"
            fill="url(#lake-gradient)"
            stroke={isLight ? '#0284c7' : '#38bdf8'}
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />
          <text
            x="1090"
            y="650"
            fill={isLight ? '#0369a1' : '#38bdf8'}
            opacity="0.8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            letterSpacing="2"
          >
            CHHATRI TALAO
          </text>
        </g>

        {/* 4. Amravati Major Road Network */}
        {/* Badnera - Rajkamal Central Expressway */}
        <path
          d="M180,890 C280,760 420,610 560,490 C640,420 720,380 860,340 C1020,300 1240,240 1440,200"
          stroke="url(#arterial-blue)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Morshi - Warud Highway */}
        <path
          d="M720,380 C780,260 890,160 1050,70"
          stroke="url(#arterial-saffron)"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* Paratwada / Achalpur Road */}
        <path
          d="M720,380 C680,240 640,140 590,-20"
          stroke="url(#arterial-blue)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Walgaon Road */}
        <path
          d="M720,380 C580,310 440,240 280,160"
          stroke={isLight ? 'rgba(79, 70, 229, 0.45)' : 'rgba(99, 102, 241, 0.6)'}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Chandur Railway Road */}
        <path
          d="M720,380 C820,490 980,640 1180,820"
          stroke={isLight ? 'rgba(2, 132, 199, 0.5)' : 'rgba(56, 189, 248, 0.6)'}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Ring Road */}
        <ellipse
          cx="720"
          cy="380"
          rx="220"
          ry="150"
          stroke={isLight ? 'rgba(234, 88, 12, 0.45)' : 'rgba(249, 115, 22, 0.55)'}
          strokeWidth="2"
          strokeDasharray="8 4"
          fill="none"
        />

        {/* Outer Ring Road */}
        <ellipse
          cx="720"
          cy="380"
          rx="440"
          ry="310"
          stroke={isLight ? 'rgba(100, 116, 139, 0.25)' : 'rgba(148, 163, 184, 0.3)'}
          strokeWidth="1.5"
          strokeDasharray="12 6"
          fill="none"
        />

        {/* Secondary Municipal Streets Web */}
        <path
          d="
            M560,490 L610,610 L740,680 L860,600 L860,480 L720,380 Z
            M720,380 L800,280 L920,290 L950,390 L860,480 Z
            M560,490 L490,420 L550,330 L720,380 Z
            M550,330 L610,250 L720,290 L720,380 Z
            M800,280 L880,210 L980,260 L920,290 Z
            M490,420 L380,480 L440,590 L560,490 Z
            M610,610 L580,740 L700,790 L740,680 Z
            M740,680 L840,780 L960,720 L860,600 Z
          "
          stroke={isLight ? 'rgba(148, 163, 184, 0.22)' : 'rgba(255, 255, 255, 0.16)'}
          strokeWidth="1.2"
          fill="none"
        />

        {/* 5. Key Landmarks & Civic Beacons (Pulsating GPS Nodes) */}
        
        {/* 📍 RAJKAMAL CHOWK */}
        <g transform="translate(720, 380)">
          <circle r="32" fill="url(#beacon-glow)" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle r="12" fill="#ea580c" stroke="#ffffff" strokeWidth="2.5" />
          <circle r="4" fill="#ffffff" />
          <rect
            x="18"
            y="-12"
            width="135"
            height="24"
            rx="6"
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
            stroke="#ea580c"
            strokeWidth="1"
            filter={isLight ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.1))' : undefined}
          />
          <text
            x="26"
            y="4"
            fill={isLight ? '#9a3412' : '#fed7aa'}
            fontSize="10"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            📍 RAJKAMAL CHOWK
          </text>
        </g>

        {/* 📍 GADGE NAGAR */}
        <g transform="translate(860, 270)">
          <circle r="18" fill="rgba(56, 189, 248, 0.35)" className="animate-pulse" />
          <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
          <circle r="3" fill="#ffffff" />
          <rect
            x="14"
            y="-10"
            width="105"
            height="20"
            rx="5"
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
            stroke="#0284c7"
            strokeWidth="1"
          />
          <text
            x="20"
            y="4"
            fill={isLight ? '#0369a1' : '#bae6fd'}
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            📍 GADGE NAGAR
          </text>
        </g>

        {/* 📍 BADNERA JUNCTION */}
        <g transform="translate(240, 810)">
          <circle r="18" fill="rgba(249, 115, 22, 0.3)" className="animate-pulse" />
          <circle r="8" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
          <circle r="3" fill="#ffffff" />
          <rect
            x="14"
            y="-10"
            width="130"
            height="20"
            rx="5"
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
            stroke="#ea580c"
            strokeWidth="1"
          />
          <text
            x="20"
            y="4"
            fill={isLight ? '#9a3412' : '#ffedd5'}
            fontSize="9"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            🚉 BADNERA JUNCTION
          </text>
        </g>

        {/* 📍 AMBA DEVI MANDIR */}
        <g transform="translate(620, 320)">
          <circle r="7" fill="#d97706" stroke="#ffffff" strokeWidth="1.8" />
          <rect
            x="12"
            y="-9"
            width="115"
            height="18"
            rx="4"
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
            stroke="#d97706"
            strokeWidth="1"
          />
          <text
            x="18"
            y="3"
            fill={isLight ? '#92400e' : '#fef3c7'}
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            🛕 AMBA DEVI TEMPLE
          </text>
        </g>

        {/* 📍 IRWIN CHOWK / HOSPITAL */}
        <g transform="translate(610, 470)">
          <circle r="7" fill="#059669" stroke="#ffffff" strokeWidth="1.8" />
          <rect
            x="12"
            y="-9"
            width="100"
            height="18"
            rx="4"
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
            stroke="#059669"
            strokeWidth="1"
          />
          <text
            x="18"
            y="3"
            fill={isLight ? '#065f46' : '#d1fae5'}
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            🏥 IRWIN SQUARE
          </text>
        </g>

        {/* 📍 CAMP / COLLECTORATE */}
        <g transform="translate(480, 270)">
          <circle r="7" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.8" />
          <rect
            x="12"
            y="-9"
            width="110"
            height="18"
            rx="4"
            fill={isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)'}
            stroke="#4f46e5"
            strokeWidth="1"
          />
          <text
            x="18"
            y="3"
            fill={isLight ? '#3730a3' : '#e0e7ff'}
            fontSize="8.5"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            🏛️ COLLECTORATE
          </text>
        </g>

        {/* 6. Geodesic coordinates watermark */}
        <g opacity="0.35" fill={isLight ? '#64748b' : '#94a3b8'} fontSize="10" fontFamily="monospace" letterSpacing="1.5">
          <text x="40" y="60">AMC MUNICIPAL JURISDICTION // ZONE 01-05</text>
          <text x="40" y="80">COORD: 20.9320° N, 77.7523° E • ELEV 343M</text>
          <text x="1160" y="860">AMRAVATI SMART CITY GIS • LIVE</text>
        </g>
      </svg>
    </div>
  );
}
