import React, { useEffect, useState } from 'react';
import { ClipboardList, MapPin, Loader2, CheckCircle2, ChevronLeft, ChevronRight, Navigation } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { fileUrl } from '../api.js';
import Navbar from '../components/Navbar.jsx';

const STATUS_FLOW = ['assigned', 'in_progress', 'resolved', 'rejected'];
const STATUS_COLORS = {
  submitted: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const PHOTO_MANDATORY_CATEGORIES = ['roads_potholes', 'garbage_waste', 'street_light', 'drainage_sewer', 'water_supply'];

const PAGE_SIZE = 10;

export default function OfficerDashboard() {
  const { t, tStatus, tCategory } = useI18n();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});
  const [resolvePhoto, setResolvePhoto] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => { document.title = 'Officer Dashboard — Mazhi Amravati'; }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/complaints/assigned');
      setComplaints(data.complaints);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleResolutionPhotoUpload = async (complaintId, file) => {
    if (!file) return;
    setUploadingPhoto(complaintId);
    const formData = new FormData();
    formData.append('files', file);
    try {
      const { data } = await api.post('/complaints/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.files?.[0]) {
        setResolvePhoto((prev) => ({ ...prev, [complaintId]: data.files[0] }));
      }
    } catch (err) {
      alert('Photo upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingPhoto(null);
    }
  };

  const updateStatus = async (c, status) => {
    const isMandatory = PHOTO_MANDATORY_CATEGORIES.includes(c.category);
    if (status === 'resolved' && isMandatory && !resolvePhoto[c.id] && !c.resolution_photo) {
      alert(`⚠️ Photo Required: A proof-of-work photo is mandatory to resolve complaints for "${tCategory(c.category)}". Please click "+ Upload Photo" before marking as resolved.`);
      return;
    }

    setUpdating(c.id);
    try {
      await api.patch(`/complaints/${c.id}/status`, {
        status,
        note: noteDraft[c.id] || undefined,
        resolution_photo: status === 'resolved' ? resolvePhoto[c.id] : undefined,
      });
      await load();
      setNoteDraft((d) => ({ ...d, [c.id]: '' }));
      setResolvePhoto((d) => ({ ...d, [c.id]: undefined }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever filter changes
  useEffect(() => { setPage(1); }, [filter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="text-brand-600" size={22} />
          <h1 className="text-2xl font-bold text-gray-900">{t('officerDashboard')}</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">{t('welcomeOfficer').replace('{name}', user?.name)}</p>

        <div className="flex gap-2 mb-5 flex-wrap">
          {['all', 'submitted', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${filter === s ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {s === 'all' ? t('allFilter') : tStatus(s)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map((n) => (
              <div key={n} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-4 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                </div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">{t('noComplaintsCategory')}</div>
        ) : (
          <div className="space-y-4">
            {visible.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex flex-wrap justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-400">{c.public_id}</div>
                    <div className="font-semibold text-gray-900">{tCategory(c.category)}</div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full h-fit ${STATUS_COLORS[c.status]}`}>{tStatus(c.status)}</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{c.summary || c.description}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-gray-600 mb-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin size={13} className="text-[#b85828] shrink-0" />
                    <span>{c.location_text}</span>
                  </div>
                  {c.latitude && c.longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-all"
                    >
                      <Navigation size={11} /> 🗺️ GPS Directions (Google Maps)
                    </a>
                  )}
                </div>
                {c.photos?.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {c.photos.map((p) => (
                      <img key={p} src={fileUrl(p)} alt="evidence" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-400 mb-3">
                  {t('citizen')}: {c.citizen_name || c.guest_name || t('guest')} · {t('filed')} {new Date(c.created_at).toLocaleDateString()}
                </div>

                {/* Resolution proof and Citizen rating if resolved */}
                {c.status === 'resolved' && (
                  <div className="mt-3 p-3.5 bg-green-50/80 border border-green-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-green-800 flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-green-600" /> Resolved by Officer
                      </span>
                      {c.resolved_at && (
                        <span className="text-[11px] text-green-700">{new Date(c.resolved_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    {c.resolution_photo && (
                      <div>
                        <div className="text-[11px] font-semibold text-green-800 mb-1">Proof of Work (Resolution Photo):</div>
                        <img src={fileUrl(c.resolution_photo)} alt="Resolution Proof" className="w-24 h-24 rounded-lg object-cover border border-green-300 shadow-sm" />
                      </div>
                    )}
                    {c.rating && (
                      <div className="pt-2 border-t border-green-200/60 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-800">Citizen Rating:</span>
                        <div className="flex text-amber-500 text-xs">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i}>{i < c.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        {c.rating_feedback && <span className="text-xs text-gray-600 italic">"{c.rating_feedback}"</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Status change actions */}
                {c.status !== 'resolved' && c.status !== 'rejected' && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {/* Proof of Resolution upload */}
                    <div className={`flex items-center gap-3 p-2.5 rounded-lg border flex-wrap ${
                      PHOTO_MANDATORY_CATEGORIES.includes(c.category)
                        ? 'bg-amber-50/80 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="text-xs font-medium flex items-center gap-1">
                        <span className="text-gray-800 font-semibold">Proof of Work Photo:</span>
                        {PHOTO_MANDATORY_CATEGORIES.includes(c.category) ? (
                          <span className="text-amber-800 font-bold text-[10px] bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            * Mandatory to Resolve
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[11px]">(Optional for this Dept)</span>
                        )}
                      </div>
                      <label className="cursor-pointer text-xs font-bold text-brand-600 hover:text-brand-700 bg-white border border-brand-200 px-3 py-1 rounded-md shadow-sm">
                        {uploadingPhoto === c.id ? 'Uploading…' : resolvePhoto[c.id] ? '✓ Photo Attached' : '+ Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => handleResolutionPhotoUpload(c.id, e.target.files?.[0])}
                        />
                      </label>
                      {resolvePhoto[c.id] && (
                        <span className="text-[11px] text-green-700 font-semibold flex items-center gap-1">
                          ✓ Photo ready for verification
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={noteDraft[c.id] || ''}
                        onChange={(e) => setNoteDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                        placeholder={t('addNote')}
                        className="flex-1 min-w-[160px] text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                      {STATUS_FLOW.filter((s) => s !== c.status).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(c, s)}
                          disabled={updating === c.id || uploadingPhoto === c.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border flex items-center gap-1 disabled:opacity-50 transition-colors ${
                            s === 'resolved'
                              ? 'bg-green-600 text-white border-green-600 hover:bg-green-700 shadow-sm font-bold'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {updating === c.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} {t('markAs')} {tStatus(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 text-sm">
            <span className="text-gray-500 text-xs">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                    n === page ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
