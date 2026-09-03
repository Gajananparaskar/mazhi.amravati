import React, { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';
import api from '../api';
import { useI18n } from '../i18n.jsx';

export default function ForgotPasswordModal({ isOpen, onClose, defaultEmail = '' }) {
  const { lang } = useI18n();

  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password, 3 = Success
  const [email, setEmail] = useState(defaultEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');

  if (!isOpen) return null;

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError(lang === 'mr' ? 'कृपया वैध ईमेल पत्ता प्रविष्ट करा.' : 'Please enter a valid email address.');
      return;
    }
    setError('');
    setInfoMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password/send-otp', { email: email.trim() });
      if (data.dev_otp) setDevOtp(data.dev_otp);
      setInfoMsg(data.message || '6-digit OTP code sent to your email!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please check the email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError(lang === 'mr' ? 'कृपया ६ अंकी OTP कोड प्रविष्ट करा.' : 'Please enter the 6-digit OTP code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError(lang === 'mr' ? 'नवीन पासवर्ड किमान ६ अक्षरांचा असावा.' : 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(lang === 'mr' ? 'पासवर्ड जुळत नाहीत.' : 'Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP code or request failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setInfoMsg('');
    setDevOtp('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full relative border border-[#ebdcc9] shadow-2xl overflow-hidden font-sans">
        {/* Tricolor Stripe */}
        <div className="h-1.5 bg-gradient-to-r from-[#b85828] via-amber-400 to-[#1a4b77] -mx-7 -mt-7 mb-5" />

        {/* Close button */}
        <button
          onClick={resetState}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* ── STEP 1: Enter Email ────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#faeedd] text-[#b85828] flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="font-black text-stone-900 text-lg">
                  {lang === 'mr' ? 'पासवर्ड विसरलात?' : 'Forgot Password?'}
                </h3>
                <p className="text-xs text-stone-500">
                  {lang === 'mr' ? 'ईमेलद्वारे ६-अंकी OTP कोड मिळवा' : 'Reset password with 6-digit Email OTP'}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed mb-4 bg-stone-50 p-3 rounded-xl border border-stone-200">
              {lang === 'mr'
                ? 'आपला नोंदणीकृत ईमेल पत्ता प्रविष्ट करा. आम्ही त्वरित आपल्या इनबॉक्समध्ये ६-अंकी पडताळणी कोड पाठवू.'
                : 'Enter your registered email address. Supabase Auth will instantly send a 6-digit verification OTP code to your inbox.'}
            </p>

            {error && (
              <div className="mb-4 text-xs bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  {lang === 'mr' ? 'नोंदणीकृत ईमेल' : 'Registered Email Address'}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="namesurname@gmail.com"
                    className="w-full bg-[#fbf8f2] border border-[#d6c4aa] rounded-xl px-4 py-2.5 pl-10 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#b85828] focus:ring-2 focus:ring-[#b85828]/15"
                  />
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#b85828] hover:bg-[#9c451a] text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-sm disabled:opacity-60"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {loading ? (lang === 'mr' ? 'OTP पाठवत आहे...' : 'Sending OTP...') : (lang === 'mr' ? '६-अंकी OTP पाठवा' : 'Send 6-Digit OTP')}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 2: Enter 6-Digit OTP & New Password ──────────────────── */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-black text-stone-900 text-lg">
                  {lang === 'mr' ? 'OTP पडताळणी' : 'Enter Verification OTP'}
                </h3>
                <p className="text-xs text-stone-500">{email}</p>
              </div>
            </div>

            {infoMsg && (
              <div className="mb-4 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                <span>{infoMsg}</span>
              </div>
            )}

            {devOtp && (
              <div className="mb-4 bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  ⚡ Dev Testing OTP Code:
                </span>
                <div className="font-mono text-xl font-black text-amber-900 tracking-widest mt-0.5">
                  {devOtp}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 text-xs bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? '६-अंकी OTP कोड' : '6-Digit Email OTP Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full text-center font-mono tracking-widest font-black text-lg bg-[#fbf8f2] border border-[#d6c4aa] rounded-xl px-4 py-2 text-stone-900 focus:bg-white focus:outline-none focus:border-[#b85828]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? 'नवीन पासवर्ड' : 'New Password (min 6 characters)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#fbf8f2] border border-[#d6c4aa] rounded-xl px-4 py-2.5 pl-10 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#b85828]"
                  />
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'mr' ? 'नवीन पासवर्ड पुन्हा प्रविष्ट करा' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#fbf8f2] border border-[#d6c4aa] rounded-xl px-4 py-2.5 pl-10 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#b85828]"
                  />
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-[#b85828] font-bold hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={11} /> {lang === 'mr' ? 'पुन्हा OTP पाठवा' : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-stone-400 hover:text-stone-600 font-medium"
                >
                  {lang === 'mr' ? 'ईमेल बदला' : 'Change email'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-sm disabled:opacity-60 mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                {loading ? (lang === 'mr' ? 'पासवर्ड बदलत आहे...' : 'Resetting Password...') : (lang === 'mr' ? 'पासवर्ड रिसेट करा' : 'Verify & Set New Password')}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 3: Success Confirmation ──────────────────────────────── */}
        {step === 3 && (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-black text-stone-900 text-lg">
              {lang === 'mr' ? 'पासवर्ड यशस्वीरित्या बदलला!' : 'Password Reset Successful!'}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              {lang === 'mr'
                ? 'आपला पासवर्ड सुरक्षितपणे अपडेट करण्यात आला आहे. आपण आता नवीन पासवर्ड वापरून लॉग इन करू शकता.'
                : 'Your password has been successfully updated. You can now log in to the portal using your new credentials.'}
            </p>
            <button
              onClick={resetState}
              className="w-full bg-[#b85828] hover:bg-[#9c451a] text-white font-extrabold py-3 rounded-xl transition-all shadow-md text-sm mt-3"
            >
              {lang === 'mr' ? 'लॉगिन वर जा' : 'Back to Login'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
