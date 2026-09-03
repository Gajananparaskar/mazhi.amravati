import React from 'react';
import { Activity, CheckCircle2, Clock, ThumbsUp, Award, Building2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useI18n } from '../i18n.jsx';

const WARD_PERFORMANCE = [
  { ward: 'Ward 12 - Rajkamal Chowk', grade: 'A+', avgHours: 18.2, resolvedPct: 96, active: 4, resolved: 112 },
  { ward: 'Ward 04 - Gadge Nagar', grade: 'A+', avgHours: 20.1, resolvedPct: 94, active: 6, resolved: 98 },
  { ward: 'Ward 08 - Panchavati Square', grade: 'A', avgHours: 22.4, resolvedPct: 91, active: 8, resolved: 85 },
  { ward: 'Ward 06 - Irwin Hospital', grade: 'A', avgHours: 23.0, resolvedPct: 89, active: 7, resolved: 78 },
  { ward: 'Ward 18 - Badnera Junction', grade: 'B+', avgHours: 26.5, resolvedPct: 86, active: 11, resolved: 92 },
  { ward: 'Ward 02 - Camp Area', grade: 'A+', avgHours: 19.4, resolvedPct: 95, active: 3, resolved: 64 },
  { ward: 'Ward 14 - Wadali Lake Road', grade: 'A', avgHours: 21.8, resolvedPct: 90, active: 5, resolved: 71 },
  { ward: 'Ward 09 - Amba Devi Mandir', grade: 'A+', avgHours: 17.6, resolvedPct: 97, active: 2, resolved: 89 },
  { ward: 'Ward 11 - Dastur Nagar', grade: 'B+', avgHours: 28.2, resolvedPct: 84, active: 9, resolved: 66 },
  { ward: 'Ward 15 - Chhatri Talao', grade: 'A', avgHours: 24.1, resolvedPct: 88, active: 6, resolved: 53 },
];

export default function Transparency() {
  const { lang } = useI18n();

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white py-12 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40 px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4">
            <Activity size={13} className="text-brand-400" /> Open Civic Governance
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            {lang === 'mr' ? 'अमरावती महानगरपालिका पारदर्शकता डॅशबोर्ड' : 'Amravati Municipal Transparency & SLA Dashboard'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mx-auto mt-2.5">
            Real-time public performance telemetry, ward grading, resolution speed benchmarks, and citizen satisfaction ratings.
          </p>
        </div>
      </section>

      {/* Main KPI Counters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Resolution Rate</span>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">92.4%</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">↑ 3.2% vs last month</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Avg SLA Speed</span>
              <Clock size={16} className="text-brand-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">21.8h</div>
            <div className="text-[11px] text-brand-600 font-semibold mt-1">Under 24h SLA target</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Citizen Satisfaction</span>
              <ThumbsUp size={16} className="text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">4.8 / 5</div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">Based on 850+ ratings</div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card card-hover-lift">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase mb-2">
              <span>Total Redressed</span>
              <Award size={16} className="text-purple-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono">1,420+</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">Across 22 Wards</div>
          </div>
        </div>

        {/* ── Ward Performance Scorecard Table ─────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-brand-600" />
                <span>Amravati Ward Performance Scorecard</span>
              </h2>
              <p className="text-xs text-slate-500">Ranked by resolution speed & SLA compliance</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span> Live Monitoring
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-6">Ward Name</th>
                  <th className="py-3 px-4 text-center">Grade</th>
                  <th className="py-3 px-4 text-center">Avg Speed</th>
                  <th className="py-3 px-4 text-center">Resolved %</th>
                  <th className="py-3 px-4 text-right">Fixed Issues</th>
                  <th className="py-3 px-6 text-right">Active Queue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {WARD_PERFORMANCE.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{w.ward}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black ${w.grade === 'A+' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {w.grade}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">{w.avgHours} hrs</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${w.resolvedPct}%` }}></div>
                        </div>
                        <span className="font-bold text-slate-800 font-mono text-[11px]">{w.resolvedPct}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-emerald-600 font-mono">{w.resolved}</td>
                    <td className="py-4 px-6 text-right font-black text-amber-600 font-mono">{w.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
