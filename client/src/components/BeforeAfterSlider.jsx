import React, { useState, useRef, useCallback } from 'react';
import { Sparkles, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { fileUrl } from '../api';

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before (Reported)',
  afterLabel = 'After (Resolved)',
  height = 'h-64 sm:h-72',
  className = '',
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !e.touches[0]) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  // If only afterSrc exists
  if (!beforeSrc && afterSrc) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-emerald-300 shadow-sm ${height} ${className}`}>
        <img src={fileUrl(afterSrc)} alt="Resolved Proof" className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <CheckCircle2 size={11} /> {afterLabel}
        </span>
      </div>
    );
  }

  // If only beforeSrc exists
  if (beforeSrc && !afterSrc) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${height} ${className}`}>
        <img src={fileUrl(beforeSrc)} alt="Reported Issue" className="w-full h-full object-cover" />
        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-amber-600 text-white px-2.5 py-1 rounded-full shadow-md">
          {beforeLabel}
        </span>
      </div>
    );
  }

  if (!beforeSrc && !afterSrc) return null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative select-none overflow-hidden rounded-2xl border border-slate-200/90 shadow-md cursor-ew-resize group ${height} ${className}`}
    >
      {/* 1. After Image (Background layer) */}
      <img
        src={fileUrl(afterSrc)}
        alt="After resolution"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* 2. Before Image (Clipped overlay layer) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
      >
        <img
          src={fileUrl(beforeSrc)}
          alt="Before resolution"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* 3. Divider Line & Glowing Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center -translate-x-1/2 transition-colors group-hover:bg-brand-400"
        style={{ left: `${sliderPos}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="w-8 h-8 rounded-full bg-white shadow-xl border-2 border-brand-600 flex items-center justify-center text-brand-700 transition-transform group-hover:scale-110 active:scale-95">
          <ArrowLeftRight size={13} className="animate-pulse" />
        </div>
      </div>

      {/* 4. Labels & Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
        <span className="text-[10px] font-extrabold bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
          {beforeLabel}
        </span>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
        <span className="text-[10px] font-extrabold bg-emerald-950/85 backdrop-blur-md text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={11} className="text-emerald-400" /> {afterLabel}
        </span>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-bold bg-black/75 text-white/90 px-3 py-1 rounded-full backdrop-blur-sm shadow-xs">
          ↔ Drag to Compare Before & After
        </span>
      </div>
    </div>
  );
}
