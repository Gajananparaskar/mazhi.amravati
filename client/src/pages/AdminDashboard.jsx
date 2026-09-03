import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Building2, ListChecks, Plus, Loader2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import api from '../api.js';
import Navbar from '../components/Navbar.jsx';

export default function AdminDashboard() {
  const { t, tStatus, tCategory } = useI18n();
  const [tab, setTab] = useState('overview');

  useEffect(() => { document.title = 'Admin Dashboard — Mazhi Amravati'; }, []);

  const TABS = [
    { key: 'overview',    labelKey: 'overview',     icon: LayoutDashboard },
    { key: 'departments', labelKey: 'departments',  icon: Building2 },
    { key: 'officers',    labelKey: 'officers',     icon: Users },
    { key: 'complaints',  labelKey: 'allComplaints', icon: ListChecks },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="text-brand-600" size={22} />
          <h1 className="text-2xl font-bold text-gray-900">{t('adminDashboardTitle')}</h1>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border ${tab === tb.key ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              <tb.icon size={15} /> {t(tb.labelKey)}
            </button>
          ))}
        </div>

        {tab === 'overview'    && <Overview t={t} />}
        {tab === 'departments' && <Departments t={t} />}
        {tab === 'officers'    && <Officers t={t} />}
        {tab === 'complaints'  && <AllComplaints t={t} tStatus={tStatus} tCategory={tCategory} />}
      </div>
    </div>
  );
}

function Overview({ t }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(({ data }) => setStats(data)); }, []);
  if (!stats) return <div className="flex justify-center py-16 text-gray-400"><Loader2 className="animate-spin" /></div>;

  const statusCard = (label, value, color) => (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {statusCard(t('totalComplaints'), stats.totalComplaints, 'text-gray-900')}
        {statusCard(t('totalCitizens'), stats.totalCitizens, 'text-gray-900')}
        {statusCard(t('totalOfficers'), stats.totalOfficers, 'text-gray-900')}
      </div>
      <div className="grid sm:grid-cols-5 gap-3">
        {['submitted', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => {
          const found = stats.totals.find((tv) => tv.status === s);
          return statusCard(s.replace('_', ' '), found?.c || 0, 'text-brand-600');
        })}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="font-semibold text-gray-900 mb-3">{t('complaintsByDept')}</div>
        <div className="space-y-2">
          {stats.byDept.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{d.name}</span>
              <span className="font-semibold text-gray-900">{d.c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Departments({ t }) {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', name_mr: '', name_hi: '', category_keys: '' });
  const [loading, setLoading] = useState(false);

  const load = () => api.get('/admin/departments').then(({ data }) => setDepartments(data.departments));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/departments', form);
      setForm({ name: '', name_mr: '', name_hi: '', category_keys: '' });
      load();
    } finally { setLoading(false); }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="font-semibold text-gray-900 mb-4">{t('departments')}</div>
        <div className="space-y-2">
          {departments.map((d) => (
            <div key={d.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-gray-800">{d.name}</div>
                <div className="text-xs text-gray-400">{d.name_mr} · {d.name_hi}</div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{d.category_keys}</span>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-5 h-fit space-y-3">
        <div className="font-semibold text-gray-900 flex items-center gap-1.5"><Plus size={16} /> {t('addDepartment')}</div>
        <input required placeholder="Name (English)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input placeholder="Name (Marathi)" value={form.name_mr} onChange={(e) => setForm({ ...form, name_mr: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input placeholder="Name (Hindi)" value={form.name_hi} onChange={(e) => setForm({ ...form, name_hi: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input required placeholder="category_keys e.g. water_supply" value={form.category_keys} onChange={(e) => setForm({ ...form, category_keys: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
          {loading ? t('adding') : t('addDepartment')}
        </button>
      </form>
    </div>
  );
}

function Officers({ t }) {
  const [officers, setOfficers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', department_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/admin/officers').then(({ data }) => setOfficers(data.officers));
    api.get('/admin/departments').then(({ data }) => setDepartments(data.departments));
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/admin/officers', form);
      setForm({ name: '', email: '', phone: '', password: '', department_id: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add officer');
    } finally { setLoading(false); }
  };

  const toggleActive = async (id, is_active) => {
    await api.patch(`/admin/officers/${id}/status`, { is_active: !is_active });
    load();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6">
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="font-semibold text-gray-900 mb-4">{t('departmentOfficers')}</div>
        <div className="space-y-2">
          {officers.map((o) => (
            <div key={o.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 text-sm">
              <div>
                <div className="font-medium text-gray-800">{o.name}</div>
                <div className="text-xs text-gray-400">{o.email || o.phone} · {o.department_name}</div>
              </div>
              <button
                onClick={() => toggleActive(o.id, o.is_active)}
                className={`text-xs font-semibold px-3 py-1 rounded-full ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                {o.is_active ? t('active') : t('disabled')}
              </button>
            </div>
          ))}
          {officers.length === 0 && <div className="text-sm text-gray-400 py-6 text-center">{t('noOfficers')}</div>}
        </div>
      </div>
      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-5 h-fit space-y-3">
        <div className="font-semibold text-gray-900 flex items-center gap-1.5"><Plus size={16} /> {t('addOfficer')}</div>
        {error && <div className="text-xs bg-red-50 text-red-600 px-2 py-1.5 rounded">{error}</div>}
        <input required placeholder={t('yourFullName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input placeholder={t('email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input placeholder={t('phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <input required type="password" placeholder={t('tempPassword')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
        <select required value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
          <option value="">{t('selectDepartment')}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <button disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50">
          {loading ? t('adding') : t('addOfficer')}
        </button>
      </form>
    </div>
  );
}

const ADMIN_PAGE_SIZE = 15;

function AllComplaints({ t, tStatus, tCategory }) {
  const [complaints, setComplaints] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api.get('/complaints', { params: status ? { status } : {} })
      .then(({ data }) => setComplaints(data.complaints))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setPage(1); }, [status]);

  const totalPages = Math.ceil(complaints.length / ADMIN_PAGE_SIZE);
  const pageItems  = complaints.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE);

  const exportToCSV = () => {
    if (!complaints.length) return;
    const headers = ['Tracking ID', 'Category', 'Summary / Description', 'Location', 'Ward', 'Status', 'Department', 'Officer', 'Upvotes', 'Rating', 'Rating Feedback', 'Filed Date', 'Resolved Date'];
    const rows = complaints.map((c) => [
      c.public_id,
      tCategory(c.category),
      `"${(c.summary || c.description || '').replace(/"/g, '""')}"`,
      `"${(c.location_text || '').replace(/"/g, '""')}"`,
      c.ward || '—',
      c.status,
      `"${(c.department_name || '—').replace(/"/g, '""')}"`,
      `"${(c.officer_name || '—').replace(/"/g, '""')}"`,
      c.upvote_count || 0,
      c.rating || '—',
      `"${(c.rating_feedback || '').replace(/"/g, '""')}"`,
      c.created_at || '—',
      c.resolved_at || '—',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `amravati_municipal_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="font-semibold text-gray-900">{t('allComplaints')}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            disabled={!complaints.length}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-brand-50 hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
            title="Download CSV for Excel / Google Sheets"
          >
            📥 Export to CSV / Excel
          </button>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
            <option value="">{t('allStatuses')}</option>
            {['submitted', 'assigned', 'in_progress', 'resolved', 'rejected'].map((s) => <option key={s} value={s}>{tStatus(s)}</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map((n) => (
            <div key={n} className="h-9 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-4">{t('tableId')}</th>
                  <th className="py-2 pr-4">{t('tableCategory')}</th>
                  <th className="py-2 pr-4">{t('tableDepartment')}</th>
                  <th className="py-2 pr-4">{t('tableOfficer')}</th>
                  <th className="py-2 pr-4">{t('tableStatus')}</th>
                  <th className="py-2 pr-4">{t('tableFiled')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-brand-700">{c.public_id}</td>
                    <td className="py-2 pr-4">{tCategory(c.category)}</td>
                    <td className="py-2 pr-4">{c.department_name || '—'}</td>
                    <td className="py-2 pr-4">{c.officer_name || '—'}</td>
                    <td className="py-2 pr-4">{tStatus(c.status)}</td>
                    <td className="py-2 pr-4 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {complaints.length === 0 && <div className="text-sm text-gray-400 py-8 text-center">{t('noComplaintsFound')}</div>}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-400 text-xs">
                {(page - 1) * ADMIN_PAGE_SIZE + 1}–{Math.min(page * ADMIN_PAGE_SIZE, complaints.length)} of {complaints.length}
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
        </>
      )}
    </div>
  );
}
