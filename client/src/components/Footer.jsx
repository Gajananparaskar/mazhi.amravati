import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Phone, Mail, MapPin, ShieldCheck, PhoneCall } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import CivicLogo from './CivicLogo.jsx';

export default function Footer() {
  const { t, lang } = useI18n();

  const HELPLINES = [
    { label: 'AMC Toll Free', number: '1800-233-1234', color: 'bg-emerald-950/80 border-emerald-700/50 text-emerald-400' },
    { label: 'Emergency', number: '112', color: 'bg-red-950/80 border-red-700/50 text-red-400' },
    { label: 'Fire Service', number: '101', color: 'bg-amber-950/80 border-amber-700/50 text-amber-400' },
    { label: 'Ambulance', number: '108', color: 'bg-blue-950/80 border-blue-700/50 text-blue-400' },
    { label: 'Water Helpline', number: '1916', color: 'bg-cyan-950/80 border-cyan-700/50 text-cyan-400' },
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      {/* 24x7 Emergency Help Bar */}
      <div className="border-b border-slate-900 bg-slate-900/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <PhoneCall size={14} className="text-saffron-400 animate-pulse" />
            <span>{lang === 'mr' ? '२४x७ आपत्कालीन हेल्पलाईन क्रमांक:' : lang === 'hi' ? '24x7 आपातकालीन हेल्पलाइन नंबर:' : '24x7 Municipal & Emergency Helplines:'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HELPLINES.map((h, i) => (
              <a
                key={i}
                href={`tel:${h.number.replace(/-/g, '')}`}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-mono font-medium hover:scale-105 transition-transform ${h.color}`}
              >
                <span className="text-[10px] text-slate-400">{h.label}:</span>
                <span className="font-bold">{h.number}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand column */}
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <CivicLogo size={42} />
            <div>
              <div className="font-bold text-white text-base tracking-tight">{t('appName')}</div>
              <div className="text-[10px] text-saffron-400 uppercase tracking-widest font-semibold">{t('tagline')}</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {t('footerDesc')}
          </p>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <MapPin size={13} className="mt-0.5 shrink-0 text-brand-400" />
              <span>Rajkamal Chowk, Amravati — 444601, Maharashtra</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={13} className="shrink-0 text-brand-400" />
              <a href="tel:07212662020" className="hover:text-white transition-colors">0721-2662020</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={13} className="shrink-0 text-brand-400" />
              <a href="mailto:info@amravaticorporation.org.in" className="hover:text-white transition-colors">
                info@amravaticorporation.org.in
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase text-xs">{t('quickLinks')}</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/"          className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('home')}</Link></li>
            <li><Link to="/complaint" className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('fileComplaint')}</Link></li>
            <li><Link to="/track"     className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('trackComplaint')}</Link></li>
            <li><Link to="/map"       className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('issueMap')}</Link></li>
            <li><Link to="/leaderboard" className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {lang === 'mr' ? 'नागरिक लीडरबोर्ड' : lang === 'hi' ? 'नागरिक लीडरबोर्ड' : 'Citizen Leaderboard'}</Link></li>
            <li><Link to="/help"      className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('help')}</Link></li>
          </ul>
        </div>

        {/* Portal Access */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase text-xs">{t('account')}</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/login"    className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('login')}</Link></li>
            <li><Link to="/register" className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> {t('register')}</Link></li>
            <li><Link to="/login"    className="hover:text-saffron-400 transition-colors flex items-center gap-1.5"><span className="text-slate-600">›</span> Officer & Admin Portal</Link></li>
          </ul>
          <div className="mt-4 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-200 flex items-center gap-1 mb-1">
              <ShieldCheck size={13} className="text-emerald-400" />
              100% Free & Open
            </div>
            SLA-monitored grievance redressal for Amravati citizens.
          </div>
        </div>

        {/* Municipal Corporation Accreditation */}
        <div>
          <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase text-xs">Amravati City</h4>
          <div className="space-y-3 text-xs text-slate-400">
            <p className="leading-relaxed">
              Official e-Governance platform powered by Google Gemini AI and OpenStreetMap.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                🇮🇳 Digital India
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                Maharashtra Gov
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-semibold">
                AMC Zone 1–5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-900 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © {new Date().getFullYear()} Amravati Municipal Corporation (अमरावती महानगरपालिका). All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href="https://www.amravaticorporation.org.in/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              amravaticorporation.org.in <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
