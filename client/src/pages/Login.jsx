import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ShieldCheck, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import AmravatiHeritageBackground from '../components/AmravatiHeritageBackground.jsx';
import CivicLogo from '../components/CivicLogo.jsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.jsx';

export default function Login() {
  const { t, lang } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ identifier: false, password: false });

  const identifierErr = touched.identifier && !identifier.trim() ? 'Email or phone is required.' : '';
  const passwordErr   = touched.password  && !password ? 'Password is required.' : '';

  useEffect(() => { document.title = 'Login — Mazhi Amravati'; }, []);

  const submit = async (e) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });
    if (!identifier.trim() || !password) return;
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'officer') navigate('/officer');
      else navigate('/track');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (err) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm text-stone-900 bg-[#fbf8f2] placeholder-stone-400 focus:bg-white focus:outline-none transition-all ${
      err ? 'border-red-400 focus:border-red-500' : 'border-[#d6c4aa] focus:border-[#b85828] focus:ring-2 focus:ring-[#b85828]/15'
    }`;

  return (
    <div className="relative min-h-screen bg-[#faf6ee] text-[#1e242b] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Clean Gradient Background (No Image) */}
      <AmravatiHeritageBackground showImage={false} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Back to Home link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8c5a31] hover:text-[#b85828] bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#d6c4aa] shadow-xs transition-all"
          >
            <ArrowLeft size={13} /> {t('home')}
          </Link>
        </div>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <CivicLogo size={56} className="mb-3" />
          <h1 className="text-[#1c1917] font-black text-xl tracking-tight">{t('appName')}</h1>
          <p className="text-[#8c5a31] text-xs mt-0.5 uppercase tracking-widest font-mono font-bold">
            {t('citizenLoginPortal')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-[#ebdcc9] p-7 sm:p-8">
          <h2 className="text-xl font-black text-[#1c1917] mb-1 tracking-tight">{t('welcomeBack')}</h2>
          <p className="text-[#78716c] text-xs sm:text-sm mb-6">{t('signInDesc')}</p>

          {error && (
            <div className="mb-5 text-xs bg-red-50 text-red-700 border border-red-200 px-3.5 py-2.5 rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">{t('emailOrPhone')}</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, identifier: true }))}
                placeholder={t('enterEmailOrPhone')}
                className={inputCls(identifierErr)}
              />
              {identifierErr && <p className="text-[11px] text-red-500 mt-1">{identifierErr}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-stone-700">{t('password')}</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-bold text-[#b85828] hover:text-[#9c451a] hover:underline"
                >
                  {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  placeholder={t('enterPassword')}
                  className={inputCls(passwordErr) + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordErr && <p className="text-[11px] text-red-500 mt-1">{passwordErr}</p>}
            </div>

            <button
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#b85828] hover:bg-[#9c451a] text-white font-extrabold py-3 rounded-xl disabled:opacity-60 transition-all shadow-md shadow-[#b85828]/25 text-sm mt-2"
            >
              <LogIn size={16} /> {loading ? t('pleaseWait') : t('login')}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#ebdcc9] space-y-2 text-xs text-center text-stone-500">
            <p>
              {t('noAccount')}{' '}
              <Link to="/register" className="text-[#b85828] font-bold hover:underline">
                {t('register')}
              </Link>
            </p>
            <p>
              <Link to="/track" className="text-stone-400 hover:text-[#b85828] hover:underline text-xs">
                {t('continueAsGuest')}
              </Link>
            </p>
          </div>
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-[#8c5a31] mt-5 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck size={14} className="text-[#b85828]" /> {t('securedBy')}
        </p>
      </div>

      {/* Supabase Free 6-Digit Email OTP Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        defaultEmail={identifier.includes('@') ? identifier : ''}
      />
    </div>
  );
}
