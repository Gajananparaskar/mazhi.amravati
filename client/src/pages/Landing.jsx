import React from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare, Zap, Bot, MapPin, Shield,
  PenSquare, Search, ChevronRight, Droplets,
  AlertTriangle, Lightbulb, Trash2, Wind, FileText,
  ArrowRight, CheckCircle2, Paperclip, Send,
} from 'lucide-react';
import { useI18n, LANGS } from '../i18n.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import AmravatiHeritageBackground from '../components/AmravatiHeritageBackground.jsx';

const SERVICES = [
  { icon: <Droplets size={20} />,      key: 'water_supply',    color: 'text-sky-700',    bg: 'bg-sky-50',    ring: 'hover:ring-sky-200' },
  { icon: <AlertTriangle size={20} />, key: 'roads_potholes',  color: 'text-amber-700',  bg: 'bg-amber-50',  ring: 'hover:ring-amber-200' },
  { icon: <Lightbulb size={20} />,     key: 'street_light',    color: 'text-orange-700', bg: 'bg-orange-50', ring: 'hover:ring-orange-200' },
  { icon: <Trash2 size={20} />,        key: 'garbage_waste',   color: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'hover:ring-emerald-200' },
  { icon: <Wind size={20} />,          key: 'drainage_sewer',  color: 'text-teal-700',   bg: 'bg-teal-50',   ring: 'hover:ring-teal-200' },
  { icon: <FileText size={20} />,      key: 'other',           color: 'text-amber-900',  bg: 'bg-stone-100', ring: 'hover:ring-stone-200' },
];

const STEPS = [
  { num: '01', icon: <MessageSquare size={22} />, titleKey: 'step1Title', subKey: 'step1Sub' },
  { num: '02', icon: <Bot size={22} />,           titleKey: 'step2Title', subKey: 'step2Sub' },
  { num: '03', icon: <CheckCircle2 size={22} />,  titleKey: 'step3Title', subKey: 'step3Sub' },
];

export default function Landing() {
  const { t, lang, changeLang, tCategory } = useI18n();

  return (
    <div className="min-h-screen bg-[#faf6ee] text-[#1e242b] font-sans selection:bg-[#fed7aa] selection:text-[#9a3412]">
      <Navbar />

      {/* ── Hero Section (Warm Heritage Amravati Temple Aesthetic) ──────── */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center pt-8 pb-14 lg:py-16 border-b border-[#ebdcc9]">
        {/* Authentic Fixed Amravati Temple Heritage Background */}
        <AmravatiHeritageBackground />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-8 items-center z-10 w-full">
          
          {/* Left Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Top Official Portal Badge */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbf7f0]/95 border border-[#d6c4aa] shadow-xs backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#b85828] animate-pulse" />
                <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-[#8c5a31] uppercase font-mono">
                  {t('officialPortal')}
                </span>
              </div>
            </div>

            {/* Signature Headline (Without 'Resolved' keyword) */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-black leading-[1.08] tracking-tight text-[#1c1917]">
              {t('heroTitle1')}<br />
              <span className="text-[#b85828]">{t('heroTitle2')}</span>
            </h1>

            {/* Subtext in 3 Languages */}
            <p className="text-[#57534e] text-base sm:text-lg leading-relaxed max-w-xl font-normal">
              {t('heroGrievanceSub')}
            </p>

            {/* 5-Item Feature Grid (Without Real-Time Updates) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 max-w-lg">
              {/* Feature 1 */}
              <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-[#e4d6c4] px-3.5 py-2.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#e0edf7] text-[#16466f] flex items-center justify-center shrink-0">
                  <MessageSquare size={14} />
                </div>
                <span className="text-xs font-bold text-[#292524]">{t('featSupportLang')}</span>
              </div>

              {/* Feature 2 */}
              <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-[#e4d6c4] px-3.5 py-2.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#faeedd] text-[#b85828] flex items-center justify-center shrink-0">
                  <Zap size={14} />
                </div>
                <span className="text-xs font-bold text-[#292524]">{t('featFastFiling')}</span>
              </div>

              {/* Feature 3 */}
              <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-[#e4d6c4] px-3.5 py-2.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#e0edf7] text-[#16466f] flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <span className="text-xs font-bold text-[#292524]">{t('featAIAssistant')}</span>
              </div>

              {/* Feature 4 */}
              <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-[#e4d6c4] px-3.5 py-2.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#e0edf7] text-[#16466f] flex items-center justify-center shrink-0">
                  <MapPin size={14} />
                </div>
                <span className="text-xs font-bold text-[#292524]">{t('featTrackMap')}</span>
              </div>

              {/* Feature 5 */}
              <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-md border border-[#e4d6c4] px-3.5 py-2.5 rounded-xl shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#faeedd] text-[#b85828] flex items-center justify-center shrink-0">
                  <Shield size={14} />
                </div>
                <span className="text-xs font-bold text-[#292524]">{t('featSecureReliable')}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap gap-3.5 items-center">
              <Link
                to="/complaint"
                className="inline-flex items-center gap-2.5 bg-[#b85828] hover:bg-[#9c451a] text-white font-extrabold px-7 py-3.5 rounded-xl shadow-lg shadow-[#b85828]/25 hover:shadow-[#b85828]/40 hover:-translate-y-0.5 transition-all text-sm tracking-wide"
              >
                <PenSquare size={16} /> {t('fileGrievance')}
                <ArrowRight size={14} />
              </Link>

              <Link
                to="/track"
                className="inline-flex items-center gap-2 bg-[#fcf9f2] hover:bg-white border border-[#d6c4aa] hover:border-[#b85828] text-[#1c1917] font-bold px-6 py-3.5 rounded-xl transition-all text-sm hover:-translate-y-0.5 shadow-xs"
              >
                <Search size={16} className="text-[#8c5a31]" /> {t('trackGrievance')}
              </Link>
            </div>

            {/* Guest Start prompt */}
            <p className="text-xs text-[#78716c] font-medium">
              {t('startAsGuest')}{' '}
              <Link to="/login" className="text-[#b85828] font-bold hover:underline">
                {t('loginRegister')}
              </Link>
            </p>

            {/* 🌐 Choose Language Option (Positioned Below Track Grievance & Above Services) */}
            <div className="pt-3 border-t border-[#ebdcc9]/80">
              <div className="text-[11px] font-bold text-[#8c5a31] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>🌐</span> {t('chooseLanguage')}:
              </div>
              <div className="inline-flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/95 border border-[#d6c4aa] shadow-xs backdrop-blur-md">
                {Object.entries(LANGS).map(([code, l]) => (
                  <button
                    key={code}
                    onClick={() => changeLang(code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      lang === code
                        ? 'bg-[#b85828] text-white shadow-xs scale-[1.02]'
                        : 'text-[#78716c] hover:text-[#1c1917] hover:bg-[#faeedd]'
                    }`}
                  >
                    <span>{code === 'mr' ? '🇮🇳' : code === 'hi' ? '🇮🇳' : '🌐'}</span>
                    <span>{l.native}</span>
                    <span className={`text-[10px] ${lang === code ? 'text-white/80' : 'text-stone-400'}`}>({l.label})</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column — Authentic Heritage Prussian Blue Civic AI Card (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#d6c4aa]/80 bg-[#fdfbf7] transition-all hover:shadow-[0_20px_50px_rgba(22,70,111,0.15)]">
              
              {/* Card Header (Deep Prussian Blue) */}
              <div className="bg-[#1a4b77] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Saffron Avatar */}
                  <div className="w-10 h-10 rounded-2xl bg-[#b85828] flex items-center justify-center font-black text-white text-lg shadow-sm border border-white/20">
                    म
                  </div>
                  <div>
                    <div className="text-sm font-extrabold flex items-center gap-1.5 tracking-wide">
                      <span>{t('appName')}</span>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                    <div className="text-[11px] text-sky-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                      <span>{t('chatBotStatus')}</span>
                    </div>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs opacity-70">
                  💬
                </div>
              </div>

              {/* Chat Canvas (Warm Ivory with Realistic Messages) */}
              <div className="p-5 space-y-4 bg-[#fbf8f2] min-h-[250px] text-xs">
                
                {/* 1. Bot Welcome Message */}
                <div className="flex flex-col items-start max-w-[90%]">
                  <div className="bg-white text-[#1c1917] rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-[#ebdcc9] leading-relaxed font-medium">
                    <p className="font-semibold text-slate-900">{t('chatBotWelcome1')}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{t('chatBotWelcome2')}</p>
                  </div>
                </div>

                {/* 2. User Message (Prussian Blue) */}
                <div className="flex flex-col items-end">
                  <div className="bg-[#1a4b77] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-md max-w-[85%] leading-relaxed">
                    <p className="font-medium">{t('chatUserMsg1')}</p>
                    <p className="text-sky-200 text-[11px]">{t('chatUserMsg2')}</p>
                  </div>
                </div>

                {/* 3. Bot Routing Response */}
                <div className="flex flex-col items-start max-w-[90%]">
                  <div className="bg-white text-[#1c1917] rounded-2xl rounded-tl-xs p-3.5 shadow-sm border border-[#ebdcc9] leading-relaxed font-medium space-y-2">
                    <p>{t('chatBotReply')}</p>
                    <div className="inline-block bg-[#faeedd] text-[#b85828] border border-[#ebdcc9] px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold">
                      GRV-2026-04821
                    </div>
                  </div>
                </div>

              </div>

              {/* Simulated Input Row */}
              <div className="p-3.5 bg-white border-t border-[#ebdcc9] flex items-center gap-2.5">
                <button className="text-[#78716c] hover:text-[#1c1917] transition-colors p-1">
                  <Paperclip size={16} />
                </button>
                <Link
                  to="/complaint"
                  className="flex-1 text-xs text-[#a8a29e] hover:text-[#57534e] px-2 py-1.5 transition-colors"
                >
                  {t('typeMessage')}
                </Link>
                <Link
                  to="/complaint"
                  className="w-9 h-9 rounded-xl bg-[#b85828] hover:bg-[#9c451a] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105"
                  title="Send message"
                >
                  <Send size={14} className="translate-x-0.5" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Services Bento Grid (Warm Civic Theme) ───────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#8c5a31] bg-[#fbf7f0] border border-[#d6c4aa] px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3 shadow-xs">
            <span>🏛️</span> {t('servicesLabel')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#1c1917] tracking-tight">
            {t('servicesTitle')}
          </h2>
          <p className="text-[#57534e] text-sm sm:text-base mt-2.5 max-w-lg mx-auto font-normal">
            {t('servicesSub')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SERVICES.map((s) => (
            <Link
              key={s.key}
              to="/complaint"
              className="group relative bg-white/90 backdrop-blur-sm rounded-3xl border border-[#ebdcc9] p-6 card-hover-lift flex flex-col justify-between overflow-hidden shadow-xs hover:border-[#b85828]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-13 h-13 rounded-2xl flex items-center justify-center ${s.bg} ${s.color} p-3.5 shadow-xs group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded-full bg-[#faf5eb] text-[#8c5a31] group-hover:bg-[#faeedd] group-hover:text-[#b85828] transition-colors border border-[#ebdcc9]">
                  Direct SLA
                </span>
              </div>
              <div>
                <div className="font-bold text-[#1c1917] text-base group-hover:text-[#b85828] transition-colors">
                  {tCategory(s.key)}
                </div>
                <p className="text-xs text-[#78716c] mt-1.5 leading-relaxed font-medium">
                  Fast automatic routing with AI vision & location tracking.
                </p>
                <div className="text-xs font-bold text-[#b85828] mt-4 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {t('fileComplaintLink')} <ChevronRight size={13} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works (Deep Royal Theme) ─────────────────── */}
      <section className="bg-[#1a4b77] text-white py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#b85828]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-extrabold text-[#fed7aa] bg-white/10 border border-white/15 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3 backdrop-blur-md">
              {t('processLabel')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{t('howItWorks')}</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="relative flex flex-col p-7 rounded-3xl bg-white/10 border border-white/15 backdrop-blur-xl card-hover-lift hover:border-white/25"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-[#b85828] text-white flex items-center justify-center shadow-md shadow-[#b85828]/30">
                    {s.icon}
                  </div>
                  <span className="text-2xl font-black text-white/30 font-mono">{s.num}</span>
                </div>
                <div className="font-extrabold text-white text-lg mb-2">{t(s.titleKey)}</div>
                <div className="text-xs text-sky-100 leading-relaxed font-normal">{t(s.subKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
