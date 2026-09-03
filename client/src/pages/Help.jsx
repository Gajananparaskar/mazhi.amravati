import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((v) => !v);
  const handleKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${open ? 'border-brand-400 shadow-gov' : 'border-gov-border'}`}>
      <button
        onClick={toggle}
        onKeyDown={handleKey}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-inset"
      >
        <span className="font-semibold text-gray-800 text-sm">{q}</span>
        <span className="shrink-0 text-brand-500">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gov-muted leading-relaxed border-t border-gov-border pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const { t } = useI18n();

  useEffect(() => { document.title = 'Help & FAQs — Mazhi Amravati'; }, []);

  const FAQS = [
    { q: t('faq1q'), a: t('faq1a') },
    { q: t('faq2q'), a: t('faq2a') },
    { q: t('faq3q'), a: t('faq3a') },
    { q: t('faq4q'), a: t('faq4a') },
    { q: t('faq5q'), a: t('faq5a') },
    { q: t('faq6q'), a: t('faq6a') },
  ];

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center">
            <HelpCircle className="text-brand-600" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{t('helpFaqs')}</h1>
            <p className="text-gov-muted text-sm">{t('helpSubtitle')}</p>
          </div>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-3 gap-4 mt-8 mb-10">
          <Link
            to="/complaint"
            className="bg-white border border-gov-border rounded-xl p-5 hover:border-brand-400 hover:shadow-gov transition-all flex flex-col items-center text-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center">
              <MessageCircle className="text-brand-600" size={20} />
            </div>
            <span className="text-sm font-bold text-gray-800">{t('chatWithAI')}</span>
            <span className="text-xs text-gov-muted">{t('fileComplaintNow')}</span>
          </Link>

          <a
            href="tel:07212662020"
            className="bg-white border border-gov-border rounded-xl p-5 hover:border-brand-400 hover:shadow-gov transition-all flex flex-col items-center text-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <Phone className="text-green-600" size={20} />
            </div>
            <span className="text-sm font-bold text-gray-800">{t('callHelpline')}</span>
            <span className="text-xs text-gov-muted">0721-2662020</span>
          </a>

          <a
            href="mailto:info@amravaticorporation.org.in"
            className="bg-white border border-gov-border rounded-xl p-5 hover:border-brand-400 hover:shadow-gov transition-all flex flex-col items-center text-center gap-2"
          >
            <div className="w-10 h-10 rounded-full bg-saffron-400/10 flex items-center justify-center">
              <Mail className="text-saffron-500" size={20} />
            </div>
            <span className="text-sm font-bold text-gray-800">{t('emailUs')}</span>
            <span className="text-xs text-gov-muted">info@amravaticorporation.org.in</span>
          </a>
        </div>

        {/* FAQ section */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-bold text-brand-500 uppercase tracking-widest">{t('faqLabel')}</span>
          <div className="flex-1 h-px bg-gov-border" />
        </div>
        <div className="space-y-2.5">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
