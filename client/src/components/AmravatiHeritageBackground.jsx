import React from 'react';

/**
 * Aesthetic Warm Heritage Background
 * Supports showing the clean architectural temple artwork or a clean gradient canvas without image.
 */
export default function AmravatiHeritageBackground({ showImage = true, className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}>
      {/* 1. Base Warm Ivory Canvas */}
      <div className="absolute inset-0 bg-[#faf6ee]" />

      {/* 2. Temple Artwork (Shown on Landing Page, Hidden on Auth Pages) */}
      {showImage && (
        <>
          <img
            src="/amravati_temple_bg.jpg"
            alt="Amravati Heritage Temple Background"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-95 transition-opacity duration-500"
          />
          {/* Subtle Left & Bottom Fog Blend for Optimal Typography Contrast */}
          <div className="absolute inset-y-0 left-0 w-full lg:w-[55%] bg-gradient-to-r from-[#faf6ee]/90 via-[#faf6ee]/50 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#faf6ee] to-transparent" />
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#faf6ee]/50 to-transparent" />
        </>
      )}

      {/* 3. Soft Ambient Atmospheric Glows */}
      <div className="absolute -top-24 right-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[#fed7aa]/30 via-[#fde68a]/15 to-transparent blur-[130px]" />
      <div className="absolute top-1/3 left-0 w-[600px] h-[600px] rounded-full bg-[#faeedd]/40 blur-[140px]" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[500px] rounded-full bg-[#e0edf7]/30 blur-[120px]" />

      {/* 4. Soft Edge Vignette */}
      {!showImage && (
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf6ee]/50 via-transparent to-[#faf6ee]/30" />
      )}
    </div>
  );
}
