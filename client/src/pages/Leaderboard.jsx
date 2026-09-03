import React, { useState, useRef } from 'react';
import { Trophy, Medal, Download, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { useI18n } from '../i18n.jsx';

const LEADERBOARD_DATA = [
  { rank: 1, name: 'Rahul Deshmukh', ward: 'Ward 12 - Rajkamal', resolvedCount: 14, karma: 680, badge: '👑 Amravati Swachhata Ratna', color: 'from-amber-400 to-yellow-600', icon: '🥇' },
  { rank: 2, name: 'Priya Sharma', ward: 'Ward 04 - Gadge Nagar', resolvedCount: 11, karma: 540, badge: '🎖️ Ward Guardian', color: 'from-slate-300 to-slate-500', icon: '🥈' },
  { rank: 3, name: 'Amit Verma', ward: 'Ward 08 - Panchavati', resolvedCount: 9, karma: 460, badge: '💧 Jal Suraksha Doot', color: 'from-amber-600 to-amber-800', icon: '🥉' },
  { rank: 4, name: 'Dr. Sameer Khan', ward: 'Ward 06 - Irwin Hospital', resolvedCount: 8, karma: 390, badge: '🌿 Green Amravati Warrior', color: 'from-emerald-500 to-teal-700', icon: '⭐' },
  { rank: 5, name: 'Sunita Raut', ward: 'Ward 11 - Dastur Nagar', resolvedCount: 7, karma: 330, badge: '🌟 Civic Champion', color: 'from-blue-500 to-indigo-700', icon: '⭐' },
  { rank: 6, name: 'Ganesh Meshram', ward: 'Ward 18 - Badnera Junction', resolvedCount: 6, karma: 280, badge: '⚡ Active Citizen', color: 'from-indigo-500 to-purple-700', icon: '⭐' },
  { rank: 7, name: 'Kavita Joshi', ward: 'Ward 02 - Camp Area', resolvedCount: 5, karma: 230, badge: '⚡ Active Citizen', color: 'from-indigo-500 to-purple-700', icon: '⭐' },
];

export default function Leaderboard() {
  const { lang } = useI18n();
  const [certName, setCertName] = useState('Rahul Deshmukh');
  const [certWard, setCertWard] = useState('Ward 12 - Rajkamal');
  const certRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gov-bg flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-brand-950 to-slate-950 text-white py-14 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-full mb-4 shadow-sm backdrop-blur-md">
            <Trophy size={14} className="text-amber-400" />
            <span>{lang === 'mr' ? 'अमरावती नागरिक स्वच्छता कर्म लीडरबोर्ड' : lang === 'hi' ? 'अमरावती नागरिक स्वच्छता कर्म लीडरबोर्ड' : 'Amravati Citizen Swachhata Karma Leaderboard'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {lang === 'mr' ? 'आपले शहर, आपले योगदान' : lang === 'hi' ? 'आपका शहर, आपका योगदान' : 'Your City. Your Contribution.'}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mt-3 font-normal">
            {lang === 'mr' 
              ? 'तक्रारी नोंदवून, समस्यांचे निराकरण तपासून अमरावती शहराला स्वच्छ आणि सुंदर बनवणाऱ्या जागरूक नागरिकांचा सन्मान!' 
              : 'Recognizing proactive citizens who report genuine civic hazards and help keep Amravati clean, safe, and beautiful.'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        
        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {/* Rank 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card text-center relative overflow-hidden order-2 md:order-1 card-hover-lift">
            <div className="text-4xl mb-2">🥈</div>
            <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              Rank #2
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 mt-3">{LEADERBOARD_DATA[1].name}</h3>
            <p className="text-xs text-slate-500">{LEADERBOARD_DATA[1].ward}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around">
              <div>
                <div className="text-xl font-black text-brand-600">{LEADERBOARD_DATA[1].karma}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Karma Pts</div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-600">{LEADERBOARD_DATA[1].resolvedCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Fixed Issues</div>
              </div>
            </div>
          </div>

          {/* Rank 1 (Gold Podium) */}
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl p-7 border-2 border-amber-400 shadow-xl text-center relative overflow-hidden order-1 md:order-2 transform md:-translate-y-4 card-hover-lift">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
              👑 Top Contributor
            </div>
            <div className="text-5xl mb-2 animate-bounce [animation-duration:2.5s]">🥇</div>
            <span className="text-xs font-black uppercase tracking-wider bg-amber-400/30 text-amber-900 border border-amber-300 px-3.5 py-1 rounded-full">
              Rank #1 Winner
            </span>
            <h3 className="font-black text-xl text-slate-900 mt-3">{LEADERBOARD_DATA[0].name}</h3>
            <p className="text-xs font-semibold text-amber-800">{LEADERBOARD_DATA[0].badge}</p>
            <div className="mt-5 pt-4 border-t border-amber-200 flex items-center justify-around">
              <div>
                <div className="text-2xl font-black text-amber-600">{LEADERBOARD_DATA[0].karma}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Karma Pts</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-600">{LEADERBOARD_DATA[0].resolvedCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Fixed Issues</div>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card text-center relative overflow-hidden order-3 card-hover-lift">
            <div className="text-4xl mb-2">🥉</div>
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
              Rank #3
            </span>
            <h3 className="font-extrabold text-lg text-slate-900 mt-3">{LEADERBOARD_DATA[2].name}</h3>
            <p className="text-xs text-slate-500">{LEADERBOARD_DATA[2].ward}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-around">
              <div>
                <div className="text-xl font-black text-brand-600">{LEADERBOARD_DATA[2].karma}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Karma Pts</div>
              </div>
              <div>
                <div className="text-xl font-black text-emerald-600">{LEADERBOARD_DATA[2].resolvedCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Fixed Issues</div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Medal size={18} className="text-amber-500" />
              <span>{lang === 'mr' ? 'सर्व अव्वल नागरिक क्रमवारी' : 'Top Citizen Rankings'}</span>
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Updated Live
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {LEADERBOARD_DATA.map((user) => (
              <div key={user.rank} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3.5">
                  <span className="font-black text-base w-7 text-center font-mono text-slate-400">{user.icon}</span>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>{user.name}</span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                        {user.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{user.ward}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="text-sm font-black text-brand-700 font-mono">{user.karma}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Points</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-black text-emerald-600 font-mono">{user.resolvedCount}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Resolved</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Official AMC Civic Certificate Generator ─────────────────────── */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3">
                <Sparkles size={12} className="text-amber-400" /> Official Recognition
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                {lang === 'mr' ? 'नागरिक सन्मान प्रमाणपत्र जनरेटर' : 'Official AMC Civic Appreciation Certificate'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Enter your name below to generate and download your personalized certificate issued by Amravati Municipal Corporation.
              </p>
            </div>

            {/* Customizer Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 no-print">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Full Name:</label>
                <input
                  type="text"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-xl bg-slate-800/90 border border-white/20 text-white focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. Rahul Deshmukh"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Your Ward / Area:</label>
                <input
                  type="text"
                  value={certWard}
                  onChange={(e) => setCertWard(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-xl bg-slate-800/90 border border-white/20 text-white focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g. Ward 12 - Rajkamal"
                />
              </div>
            </div>

            {/* Renderable Certificate Frame */}
            <div
              ref={certRef}
              className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 border-8 border-double border-amber-400 shadow-2xl relative select-none"
            >
              {/* Corner Ornaments */}
              <div className="absolute top-2 left-2 text-amber-500 text-lg">⚜️</div>
              <div className="absolute top-2 right-2 text-amber-500 text-lg">⚜️</div>
              <div className="absolute bottom-2 left-2 text-amber-500 text-lg">⚜️</div>
              <div className="absolute bottom-2 right-2 text-amber-500 text-lg">⚜️</div>

              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-600 font-extrabold text-xs tracking-widest uppercase">
                  <span>🏛️ AMRAVATI MUNICIPAL CORPORATION</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-serif">
                  CERTIFICATE OF CIVIC APPRECIATION
                </h3>
                <p className="text-xs text-slate-500 italic">This Certificate is proudly presented to</p>

                <div className="text-2xl sm:text-3xl font-extrabold text-brand-700 py-1 font-serif underline decoration-amber-400 underline-offset-8">
                  {certName || 'Citizen of Amravati'}
                </div>

                <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                  In recognition of your proactive civic participation, timely grievance reporting, and invaluable contribution toward making <strong>Amravati Smart City</strong> cleaner, safer, and better for all citizens.
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-left">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Jurisdiction Ward</div>
                    <div className="text-xs font-bold text-slate-800">{certWard || 'Amravati Municipal Area'}</div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-700 font-bold text-center text-[9px] shadow-sm">
                    AMC<br />VERIFIED
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Issued By</div>
                    <div className="text-xs font-bold text-slate-800">Municipal Commissioner</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Print & Download Button */}
            <div className="mt-6 text-center no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-saffron-500 hover:from-amber-600 hover:to-saffron-600 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/30 hover:scale-105 transition-all text-sm"
              >
                <Download size={16} /> Print / Save Official Certificate (PDF)
              </button>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
