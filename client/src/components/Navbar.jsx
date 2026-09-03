import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Globe, ChevronDown, LogOut, User, Menu, X, LayoutDashboard } from 'lucide-react';
import { useI18n, LANGS } from '../i18n.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import CivicLogo from './CivicLogo.jsx';

export default function Navbar() {
  const { t, lang, changeLang } = useI18n();
  const { user, logout } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (to) => location.pathname === to;

  const NAV_LINKS = [
    { to: '/', label: t('home') },
    { to: '/complaint', label: t('fileComplaint') },
    { to: '/track', label: t('trackComplaint') },
    { to: '/map', label: t('issueMap') },
    { to: '/transparency', label: lang === 'mr' ? 'पारदर्शकता' : lang === 'hi' ? 'पारदर्शिता' : 'Transparency' },
    { to: '/help', label: t('help') },
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 ${
      scrolled
        ? 'bg-[#fdfbf7]/95 backdrop-blur-md shadow-sm border-b border-[#ebdcc9]'
        : 'bg-[#fdfbf7]/90 backdrop-blur-sm border-b border-[#ebdcc9]/80 shadow-xs'
    }`}>
      {/* Tricolor accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#b85828] via-amber-400 to-[#1a4b77]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <CivicLogo size={42} />
          <div className="leading-tight">
            <div className="font-extrabold text-[#1c1917] text-[16px] tracking-tight">
              {t('appName')}
            </div>
            <div className="text-[10px] text-[#78716c] font-semibold uppercase tracking-widest hidden sm:block">{t('tagline')}</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3.5 py-2 rounded-xl transition-all text-xs lg:text-sm ${
                isActive(to)
                  ? 'text-[#b85828] bg-[#faeedd] font-bold shadow-xs border border-[#ebdcc9]'
                  : 'text-[#57534e] hover:text-[#1c1917] hover:bg-[#f5eedf]'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gov-border text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <Globe size={13} className="text-brand-500" /> {LANGS[lang].native} <ChevronDown size={11} className="text-gray-400" />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gov-border rounded-xl shadow-card-lg py-1.5 z-50">
                {Object.entries(LANGS).map(([code, l]) => (
                  <button
                    key={code}
                    onClick={() => { changeLang(code); setLangOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-sm hover:bg-brand-50 transition-colors ${
                      lang === code ? 'text-brand-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {l.native}
                    <span className="text-xs text-gray-400 ml-1.5">{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          {!user && (
            <>
              <Link
                to="/login"
                className="hidden sm:inline-block text-xs px-3.5 py-1.5 rounded-xl border border-[#d6c4aa] text-[#1c1917] font-bold hover:bg-[#faeedd] transition-all shadow-xs"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                className="text-xs px-3.5 py-1.5 rounded-xl bg-[#b85828] text-white font-extrabold hover:bg-[#9c451a] transition-all shadow-xs"
              >
                {t('register')}
              </Link>
            </>
          )}

          {user && (
            <div className="flex items-center gap-1.5">
              {user.role === 'officer' && (
                <Link to="/officer" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gov-border text-gray-700 hover:bg-gray-50 transition-all font-medium">
                  <LayoutDashboard size={13} className="text-brand-500" /> {t('officerDashboard')}
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gov-border text-gray-700 hover:bg-gray-50 transition-all font-medium">
                  <LayoutDashboard size={13} className="text-brand-500" /> {t('adminDashboard')}
                </Link>
              )}
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-700 bg-brand-50 border border-brand-100 px-2.5 py-1.5 rounded-lg font-medium">
                <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">
                  {user.name?.[0]?.toUpperCase() || <User size={10} />}
                </div>
                {user.name?.split(' ')[0]}
              </div>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-all border border-red-100 font-medium"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => { setMobileOpen((v) => !v); }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gov-border bg-white/98 backdrop-blur-md pb-4 px-4 pt-2 space-y-0.5">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => { setMobileOpen(false); window.scrollTo(0, 0); }}
              className={`block px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(to)
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
          {!user && (
            <div className="flex gap-2 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm py-2.5 rounded-lg border border-gov-border text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                {t('login')}
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 transition-colors"
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
