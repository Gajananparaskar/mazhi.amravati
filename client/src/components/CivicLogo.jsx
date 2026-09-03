import React from 'react';

/**
 * Official Mazhi Amravati Emblem Logo Component
 * Displays tightly-cropped, crisp emblem artwork zoomed in to fill container nicely.
 */
export default function CivicLogo({ size = 44, className = '' }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden shrink-0 shadow-xs border border-[#ebdcc9] bg-white flex items-center justify-center p-1 transition-all group-hover:scale-105 group-hover:shadow-md ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo.png"
        alt="Mazhi Amravati Logo"
        className="w-full h-full object-contain transform scale-110"
      />
    </div>
  );
}
