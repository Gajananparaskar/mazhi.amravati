import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Building2, User, Loader2, CheckCircle2, Clock, XCircle, FileSearch, Download, X, ThumbsUp } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import api, { fileUrl } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import ComplaintReceipt from '../components/ComplaintReceipt.jsx';

const STATUS_CONFIG = {
  submitted:   { cls: 'bg-gray-100 text-gray-700 border-gray-200',   dot: 'bg-gray-400',   icon: <Clock size={13} /> },
  assigned:    { cls: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500',   icon: <Clock size={13} /> },
  in_progress: { cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500',  icon: <Clock size={13} /> },
  resolved:    { cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500',  icon: <CheckCircle2 size={13} /> },
  rejected:    { cls: 'bg-red-50 text-red-700 border-red-200',       dot: 'bg-red-500',    icon: <XCircle size={13} /> },
};

const STATUS_STEPS = ['submitted', 'assigned', 'in_progress', 'resolved'];

function StatusProgressBar({ status, tStatus, lang }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  const isRejected = status === 'rejected';
  return (
    <div className="mb-6">
      <div className="text-xs font-semibold text-gov-muted mb-3 uppercase tracking-widest">
        {lang === 'mr' ? 'प्रगती स्थिती' : lang === 'hi' ? 'प्रगति स्थिति' : 'Progress Timeline'}
      </div>
      {isRejected ? (
        <div className="flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle size={15} /> {tStatus ? tStatus('rejected') : 'Complaint Rejected'}
        </div>
      ) : (
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((step, i) => {
            const done    = i <= currentIdx;
            const active  = i === currentIdx;
            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all ${
                    active  ? 'bg-brand-600 border-brand-600 text-white shadow-md ring-4 ring-brand-100' :
                    done    ? 'bg-emerald-600 border-emerald-600 text-white' :
                              'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {done && !active ? <CheckCircle2 size={15} /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-semibold text-center leading-tight hidden sm:block ${active ? 'text-brand-700 font-bold' : done ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {tStatus ? tStatus(step) : step.replace('_', ' ')}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 mb-4 rounded-full ${i < currentIdx ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Track() {
  const { t, lang, tStatus, tCategory } = useI18n();
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get('id') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Rating & feedback state
  const [ratingVal, setRatingVal] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showReceipt, setShowReceipt]           = useState(false);
  const [upvoting, setUpvoting]                 = useState(false);
  const [upvoteDone, setUpvoteDone]             = useState(false);

  useEffect(() => { document.title = 'Track Complaint — Mazhi Amravati'; }, []);

  const handleUpvote = async () => {
    if (!result?.complaint || upvoting || upvoteDone) return;
    setUpvoting(true);
    try {
      const res = await api.post(`/complaints/${result.complaint.id}/upvote`);
      const newCount = res.data.upvote_count ?? res.data.upvotes ?? ((result.complaint.upvote_count || 0) + 1);
      setResult((prev) => ({
        ...prev,
        complaint: {
          ...prev.complaint,
          upvote_count: newCount,
        },
      }));
      setUpvoteDone(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setUpvoteDone(true);
        const currentVotes = err.response.data.upvote_count ?? err.response.data.upvotes;
        if (currentVotes !== undefined) {
          setResult((prev) => ({
            ...prev,
            complaint: {
              ...prev.complaint,
              upvote_count: currentVotes,
            },
          }));
        }
      }
    } finally {
      setUpvoting(false);
    }
  };

  const fetchComplaint = useCallback(async (targetId) => {
    const searchId = (targetId !== undefined ? targetId : id || '').trim();
    if (!searchId) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSearched(true);
    setUpvoteDone(false);
    try {
      const { data } = await api.get(`/complaints/track/${encodeURIComponent(searchId)}`);
      setResult(data);
      if (data.complaint.rating) {
        setRatingVal(data.complaint.rating);
        setFeedbackText(data.complaint.rating_feedback || '');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'No complaint found with this tracking ID');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const urlId = params.get('id');
    if (urlId) {
      setId(urlId);
      fetchComplaint(urlId);
    }
  }, [params, fetchComplaint]);

  const search = (e) => {
    e?.preventDefault();
    fetchComplaint(id);
  };

  const submitRating = async (e) => {
    e?.preventDefault();
    if (!ratingVal) return;
    setSubmittingRating(true);
    try {
      await api.post(`/complaints/track/${result.complaint.public_id}/rating`, {
        rating: ratingVal,
        feedback: feedbackText,
      });
      setRatingSuccess(true);
      setResult((prev) => ({
        ...prev,
        complaint: {
          ...prev.complaint,
          rating: ratingVal,
          rating_feedback: feedbackText,
        },
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Could not submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const cfg = result ? (STATUS_CONFIG[result.complaint.status] || STATUS_CONFIG.submitted) : null;

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('trackTitle')}</h1>
          <p className="text-gov-muted text-sm mt-1">{t('enterTrackingId')}</p>
        </div>

        {/* Search bar */}
        <form onSubmit={search} className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-lg shadow-slate-200/50 mb-8 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. AMC-2026-000123"
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-brand-500 transition-all font-mono font-bold"
            />
          </div>
          <button
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-saffron-500 to-amber-500 hover:from-saffron-600 hover:to-amber-600 text-white font-extrabold px-6 py-3 rounded-xl disabled:opacity-60 transition-all shadow-md shadow-saffron-500/20 text-sm shrink-0"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} {t('search')}
          </button>
        </form>

        {/* Skeleton while loading */}
        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card-lg overflow-hidden animate-pulse">
            <div className="bg-gradient-to-r from-brand-600 to-indigo-700 h-24 rounded-t-3xl" />
            <div className="p-7 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-5 bg-slate-200 rounded-lg w-2/3" />
                  </div>
                ))}
              </div>
              <div className="h-20 bg-slate-100 rounded-2xl" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 text-red-700 border border-red-200 text-sm px-5 py-3.5 rounded-2xl mb-6 shadow-xs font-medium">
            {error}
          </div>
        )}

        {/* Empty state: searched but nothing found */}
        {!loading && !result && searched && !error && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <FileSearch size={28} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">No complaint found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Make sure you have entered the exact ID from your confirmation (e.g. <span className="font-mono font-bold text-slate-700">AMC-2026-000123</span>).
            </p>
          </div>
        )}

        {/* Pre-search empty state */}
        {!loading && !result && !searched && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shadow-xs">
              <Search size={28} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800 mb-1">Enter your Complaint ID to track</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Real-time department routing, resolution timeline, and verified before & after photos will appear here.
            </p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card-lg overflow-hidden">

            {/* Result header */}
            <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-950 text-white px-7 py-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs text-brand-300 mb-1 uppercase tracking-widest font-bold">{t('complaintId')}</div>
                <div className="text-2xl sm:text-3xl font-black tracking-wide font-mono">{result.complaint.public_id}</div>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleUpvote}
                  disabled={upvoting || upvoteDone}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs ${
                    upvoteDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 border border-white/25 text-white'
                  }`}
                  title="Support this civic grievance"
                >
                  <ThumbsUp size={13} className={upvoteDone ? 'fill-current' : ''} />
                  <span>{result.complaint.upvote_count || 0}</span>
                  <span className="text-[11px]">{upvoteDone ? 'Voted' : 'Upvote'}</span>
                </button>
                <button
                  onClick={() => setShowReceipt(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white transition-all shadow-xs"
                >
                  <Download size={13} /> {lang === 'mr' ? 'पावती फोटो' : 'Receipt (PNG)'}
                </button>
                <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-full border shadow-sm ${cfg.cls}`}>
                  {cfg.icon} {tStatus(result.complaint.status)}
                </span>
              </div>
            </div>

            {/* Download Receipt Modal */}
            {showReceipt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
                <div className="bg-[#faf6ee] rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative border border-[#ebdcc9] shadow-2xl">
                  <button
                    onClick={() => setShowReceipt(false)}
                    className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white border border-[#ebdcc9] flex items-center justify-center text-stone-600 hover:text-stone-900 shadow-xs z-10"
                  >
                    <X size={16} />
                  </button>
                  <div className="pt-2">
                    <ComplaintReceipt complaint={result.complaint} />
                  </div>
                </div>
              </div>
            )}

            <div className="p-7">
              {/* Status progress bar */}
              <StatusProgressBar status={result.complaint.status} tStatus={tStatus} lang={lang} />

              {/* Info grid */}
              <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70">
                <InfoRow icon={<Building2 size={15} />} label={t('problemType')} value={tCategory(result.complaint.category)} />
                <InfoRow
                  icon={<Building2 size={15} />}
                  label={t('department')}
                  value={
                    (lang === 'mr' && result.complaint.department_name_mr) ||
                    (lang === 'hi' && result.complaint.department_name_hi) ||
                    result.complaint.department_name ||
                    '—'
                  }
                />
                <InfoRow icon={<MapPin size={15} />} label={t('location')} value={result.complaint.location_text} />
                <InfoRow icon={<User size={15} />} label={t('assignedOfficer')} value={result.complaint.officer_name || t('pendingAssignment')} />
                <InfoRow icon={<Calendar size={15} />} label={t('filedOn')} value={new Date(result.complaint.created_at).toLocaleString()} />
              </div>

              {/* Description */}
              <div className="mb-6 bg-slate-50/60 rounded-2xl p-4 border border-slate-200/80">
                <div className="text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">{t('details')}</div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">{result.complaint.summary || result.complaint.description}</p>
              </div>

              {/* Proof of Resolution (Before & After) */}
              {(result.complaint.photos?.length > 0 || result.complaint.resolution_photo) && (
                <div className="mb-6">
                  <div className="text-xs font-black text-slate-800 mb-3 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>📸</span> {result.complaint.resolution_photo ? (lang === 'mr' ? 'निराकरण पुरावा (आधी व नंतर तुलना)' : 'Resolution Proof (Before & After Comparison)') : t('photos')}
                    </span>
                    {result.complaint.resolution_photo && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        ✓ Officer On-Site Verified
                      </span>
                    )}
                  </div>

                  {/* Interactive Before/After Split Swipe Slider */}
                  {result.complaint.photos?.length > 0 && result.complaint.resolution_photo ? (
                    <div className="mb-4">
                      <BeforeAfterSlider
                        beforeSrc={result.complaint.photos[0]}
                        afterSrc={result.complaint.resolution_photo}
                        beforeLabel={lang === 'mr' ? 'आधी (तक्रार)' : 'Before (Reported)'}
                        afterLabel={lang === 'mr' ? 'नंतर (दुरुस्त)' : 'After (Resolved)'}
                        height="h-72 sm:h-80"
                      />
                    </div>
                  ) : null}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {result.complaint.photos?.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                        <div className="text-xs font-bold text-slate-700 mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500" /> Before (Citizen Report)
                          </span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {result.complaint.photos.map((p) => (
                            <a key={p} href={fileUrl(p)} target="_blank" rel="noreferrer" title="Click to view full photo">
                              <img src={fileUrl(p)} alt="Before" className="w-24 h-24 rounded-xl object-cover border border-slate-200 shadow-sm hover:scale-105 transition-transform" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.complaint.resolution_photo && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4">
                        <div className="text-xs font-extrabold text-emerald-800 mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" /> After (Officer Fixed Proof)
                          </span>
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                            ✓ Verified
                          </span>
                        </div>
                        <a href={fileUrl(result.complaint.resolution_photo)} target="_blank" rel="noreferrer" title="Click to view full photo">
                          <img src={fileUrl(result.complaint.resolution_photo)} alt="After Resolution" className="w-24 h-24 rounded-xl object-cover border border-emerald-300 shadow-md ring-2 ring-emerald-400/40 hover:scale-105 transition-transform" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Citizen Rating & Feedback Section */}
              {result.complaint.status === 'resolved' && (
                <div className="mb-6 p-6 bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-50 border border-amber-200/90 rounded-3xl shadow-xs">
                  <div className="flex items-center justify-between mb-3.5">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        ⭐️ Citizen Resolution Rating
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">Rate how satisfied you are with the AMC resolution</p>
                    </div>
                    {result.complaint.rating ? (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-200 shadow-xs">
                        ✓ Rating Submitted
                      </span>
                    ) : null}
                  </div>

                  {result.complaint.rating ? (
                    <div className="bg-white/95 border border-amber-200/80 rounded-2xl p-4.5 space-y-1.5 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="flex text-amber-400 text-lg">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{i < result.complaint.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        <span className="text-xs font-black text-slate-800">({result.complaint.rating} / 5 stars)</span>
                      </div>
                      {result.complaint.rating_feedback && (
                        <p className="text-xs text-slate-700 italic font-medium">"{result.complaint.rating_feedback}"</p>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={submitRating} className="space-y-3.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700">Your Rating:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingVal(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(0)}
                              className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                            >
                              <span className={(hoverRating || ratingVal) >= star ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'}>
                                ★
                              </span>
                            </button>
                          ))}
                        </div>
                        {(hoverRating || ratingVal) > 0 && (
                          <span className="text-xs font-extrabold text-amber-700 ml-1">
                            {['', '😡 Poor', '😟 Needs Work', '😐 Average', '😊 Good Job', '😍 Outstanding!'][hoverRating || ratingVal]}
                          </span>
                        )}
                      </div>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Write a short feedback (e.g. Clean road repair, resolved within 24 hours, polite municipal team...)"
                        rows={2}
                        className="w-full text-xs p-3.5 bg-white border border-amber-200 rounded-2xl focus:ring-2 focus:ring-amber-400 focus:outline-none shadow-xs"
                      />
                      <button
                        type="submit"
                        disabled={!ratingVal || submittingRating}
                        className="text-xs font-black px-5 py-2.5 bg-gradient-to-r from-amber-500 to-saffron-500 hover:from-amber-600 hover:to-saffron-600 disabled:opacity-50 text-white rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                      >
                        {submittingRating ? <Loader2 size={13} className="animate-spin" /> : null} Submit 5-Star Rating
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Timeline */}
              <div>
                <div className="text-xs font-semibold text-gov-muted mb-4 uppercase tracking-widest">{t('timeline')}</div>
                <div className="relative">
                  {result.history.map((h, i) => (
                    <div key={h.id} className="flex gap-4 mb-4 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm mt-0.5 ${
                          i === result.history.length - 1 ? 'bg-brand-600' : 'bg-gray-300'
                        }`} />
                        {i < result.history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-1">
                        <div className="text-sm font-bold text-gray-800">{tStatus(h.status)}</div>
                        {h.note && <div className="text-xs text-gray-500 mt-0.5">{h.note}</div>}
                        <div className="text-[11px] text-gov-muted mt-1">{new Date(h.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-brand-500 mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-xs text-gov-muted font-medium uppercase tracking-widest">{label}</div>
        <div className="text-gray-800 font-semibold text-sm mt-0.5">{value}</div>
      </div>
    </div>
  );
}
