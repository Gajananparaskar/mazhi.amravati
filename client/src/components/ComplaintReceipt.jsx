import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, CheckCircle2, ShieldCheck, MapPin, Calendar, Loader2 } from 'lucide-react';
import CivicLogo from './CivicLogo.jsx';
import { useI18n } from '../i18n.jsx';

function cleanAddress(addr) {
  if (!addr) return '';
  return addr.replace(/\s*\(?(?:GPS|gps)[:\s]+[0-9.]+[,\s]+[0-9.]+\)?/gi, '').trim();
}

export default function ComplaintReceipt({ complaint, guestName, className = '' }) {
  const { t, lang, tCategory } = useI18n();
  const receiptRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const downloadImage = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      // Small timeout to ensure fonts/images are rendered
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2.5, // Crisp 2.5x retina export
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `AMC-Receipt-${complaint.public_id || 'Complaint'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download receipt image:', err);
      alert('Could not download image. Please try again or take a screenshot.');
    } finally {
      setDownloading(false);
    }
  };

  const locale = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
  const formattedDate = new Date(complaint.created_at || Date.now()).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Printable / Exportable Official Receipt Canvas ───────────────────── */}
      <div
        ref={receiptRef}
        className="bg-white rounded-2xl border-2 border-[#d6c4aa] shadow-lg overflow-hidden p-6 sm:p-7 text-stone-800 font-sans relative"
        style={{ width: '100%', maxWidth: '480px', margin: '0 auto', background: '#ffffff' }}
      >
        {/* Tricolor Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-[#b85828] via-amber-400 to-[#1a4b77] -mx-7 -mt-7 mb-5" />

        {/* Official Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#ebdcc9] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <CivicLogo size={46} />
            <div>
              <div className="font-black text-stone-900 text-sm sm:text-base tracking-tight leading-tight">
                {t('appName')}
              </div>
              <div className="text-[10px] font-bold text-[#8c5a31] uppercase tracking-wider">
                Amravati Municipal Corporation
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 size={11} /> Filed
            </span>
          </div>
        </div>

        {/* Receipt Title & Tracking ID */}
        <div className="text-center bg-[#faf6ee] rounded-xl border border-[#ebdcc9] p-3 mb-4">
          <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-0.5">
            Official Grievance Acknowledgment
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#b85828] font-mono tracking-wider">
            {complaint.public_id}
          </div>
          <div className="text-[10px] text-stone-400 mt-0.5 flex items-center justify-center gap-1">
            <Calendar size={11} /> {formattedDate}
          </div>
        </div>

        {/* Key Grievance Information Grid */}
        <div className="space-y-2.5 text-xs border-b border-[#ebdcc9] pb-4 mb-4">
          <div className="flex justify-between py-1 border-b border-stone-100">
            <span className="text-stone-500 font-medium">Category / श्रेणी:</span>
            <span className="font-bold text-stone-900">{tCategory(complaint.category)}</span>
          </div>

          <div className="flex justify-between py-1 border-b border-stone-100">
            <span className="text-stone-500 font-medium">Citizen / नागरिक:</span>
            <span className="font-bold text-stone-900">{complaint.citizen_name || complaint.guest_name || guestName || 'Citizen'}</span>
          </div>

          <div className="flex flex-col py-1 border-b border-stone-100 gap-1">
            <span className="text-stone-500 font-medium">Location / ठिकाण:</span>
            <span className="font-bold text-stone-900 flex items-start gap-1">
              <MapPin size={13} className="text-[#b85828] shrink-0 mt-0.5" />
              <span>{cleanAddress(complaint.location_text) || 'Amravati, Maharashtra'}</span>
            </span>
          </div>

          {complaint.summary && (
            <div className="flex flex-col py-1 gap-1">
              <span className="text-stone-500 font-medium">Description / सारांश:</span>
              <span className="font-medium text-stone-700 italic bg-stone-50 p-2 rounded-lg border border-stone-100 text-[11px] leading-relaxed">
                "{complaint.summary || complaint.description}"
              </span>
            </div>
          )}
        </div>

        {/* SLA Guarantee & Authentication Seal */}
        <div className="flex items-center justify-between text-[10px] text-stone-500">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>SLA Monitored & Verified</span>
          </div>
          <div className="font-mono text-stone-500 text-[10px] font-bold">
            Mazhi Amravati
          </div>
        </div>
      </div>

      {/* ── Action: Download Receipt Button ──────────────────────────────────── */}
      <button
        onClick={downloadImage}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2 bg-[#b85828] hover:bg-[#9c451a] text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-all text-xs sm:text-sm active:scale-[0.99] disabled:opacity-70"
      >
        {downloading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Generating Image…</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>{lang === 'mr' ? 'पावती फोटो डाउनलोड करा (PNG)' : lang === 'hi' ? 'रसीद इमेज डाउनलोड करें (PNG)' : 'Download Receipt as Image (PNG)'}</span>
          </>
        )}
      </button>
    </div>
  );
}
