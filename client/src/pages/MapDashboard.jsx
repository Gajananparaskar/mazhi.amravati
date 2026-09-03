import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Map as MapIcon, Filter, X, Share2, ThumbsUp, ExternalLink,
  MapPin, Loader2, RefreshCw,
  AlertTriangle, Droplets, Lightbulb, Trash2, Wind, FileText,
  LocateFixed, Target,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import api, { fileUrl } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx';
import { useI18n } from '../i18n.jsx';

// Fix default Leaflet icon paths
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// ── Amravati City Coordinates & Bounds ─────────────────────────────────────────
const AMRAVATI_CENTER = [20.9320, 77.7523]; // Central Amravati (Rajkamal Chowk)
const AMRAVATI_BOUNDS = [
  [20.70, 77.45], // South-West corner
  [21.20, 78.10], // North-East corner
];

// ── Category Config ───────────────────────────────────────────────────────────
const CAT = {
  water_supply:    { color: '#2563eb', bg: '#dbeafe', icon: <Droplets size={14} /> },
  roads_potholes:  { color: '#ea580c', bg: '#ffedd5', icon: <AlertTriangle size={14} /> },
  street_light:    { color: '#ca8a04', bg: '#fef9c3', icon: <Lightbulb size={14} /> },
  garbage_waste:   { color: '#16a34a', bg: '#dcfce7', icon: <Trash2 size={14} /> },
  drainage_sewer:  { color: '#0d9488', bg: '#ccfbf1', icon: <Wind size={14} /> },
  other:           { color: '#7c3aed', bg: '#ede9fe', icon: <FileText size={14} /> },
};

const STATUS_BADGE = {
  submitted:   'bg-gray-100 text-gray-700',
  assigned:    'bg-blue-50 text-blue-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved:    'bg-green-50 text-green-700',
  rejected:    'bg-red-50 text-red-700',
};

export function cleanAddress(addr) {
  if (!addr) return '';
  return addr.replace(/\s*\(?(?:GPS|gps)[:\s]+[0-9.]+[,\s]+[0-9.]+\)?/gi, '').trim();
}

// ── Individual Category Dot Icon ──────────────────────────────────────────────
function makeCatIcon(category, upvotes = 0) {
  const cfg = CAT[category] || CAT.other;
  const size = upvotes > 9 ? 34 : upvotes > 4 ? 28 : 24;
  return L.divIcon({
    className: 'custom-cat-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${cfg.color}; border: 2.5px solid #ffffff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: 800; color: #ffffff;
      cursor: pointer; transition: transform 0.15s ease;
    ">${upvotes > 0 ? upvotes : ''}</div>`,
  });
}

// ── Cluster Dot Icon (Collapses multiple complaints in one area like Ithe Paha) ─
function makeClusterIcon(count) {
  let size = 36;
  let bg = '#b85828'; // Terracotta
  let ring = 'rgba(184, 88, 40, 0.35)';

  if (count >= 15) {
    size = 46;
    bg = '#dc2626'; // Red for high density
    ring = 'rgba(220, 38, 38, 0.4)';
  } else if (count >= 6) {
    size = 40;
    bg = '#1a4b77'; // Prussian blue
    ring = 'rgba(26, 75, 119, 0.35)';
  }

  return L.divIcon({
    className: 'custom-cluster-badge',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${bg};
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 4px ${ring}, 0 4px 12px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: 900;
        font-family: Inter, system-ui, sans-serif;
        font-size: ${count > 99 ? '11px' : '13px'};
        cursor: pointer;
        animation: pulse-subtle 2s infinite;
      ">
        ${count}
      </div>
    `,
  });
}

// ── WhatsApp share helper ────────────────────────────────────────────────────
function buildWhatsAppLink(c) {
  const status = c.status.replace('_', ' ').toUpperCase();
  const msg = `🏛️ *Mazhi Amravati — Civic Grievance*\n\n` +
    `*ID:* ${c.public_id}\n` +
    `*Category:* ${CAT[c.category]?.label || c.category}\n` +
    `*Location:* ${c.location_text || 'Amravati'}\n` +
    `*Status:* ${status}\n` +
    `*Upvotes:* ${c.upvote_count || 0}\n\n` +
    `Track: ${window.location.origin}/track?id=${c.public_id}\n` +
    `_Report via Mazhi Amravati_`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

// ── Fly-to helper component ──────────────────────────────────────────────────
function FlyTo({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, 16, { duration: 1.2 });
  }, [coords, map]);
  return null;
}

// ── Supercluster Clustered Markers Engine (Ithe Paha Style) ───────────────────
function ClusteredMarkers({ complaints, onUpvote, upvoting, upvoteDone, tCategory, lang }) {
  const map = useMap();
  const [clusters, setClusters] = useState([]);
  const superclusterRef = useRef(null);

  // Index complaints into Supercluster
  useEffect(() => {
    const valid = complaints.filter(
      (c) => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude)
    );

    const points = valid.map((c) => ({
      type: 'Feature',
      properties: {
        cluster: false,
        complaintId: c.id,
        complaint: c,
      },
      geometry: {
        type: 'Point',
        coordinates: [parseFloat(c.longitude), parseFloat(c.latitude)],
      },
    }));

    const sc = new Supercluster({
      radius: 60, // Cluster radius in pixels
      maxZoom: 16, // Maximum zoom level to cluster points
    });
    sc.load(points);
    superclusterRef.current = sc;

    updateClusters();
  }, [complaints]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateClusters = useCallback(() => {
    if (!superclusterRef.current || !map) return;
    const b = map.getBounds();
    const bbox = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    const zoom = Math.floor(map.getZoom());
    try {
      const res = superclusterRef.current.getClusters(bbox, zoom);
      setClusters(res);
    } catch (_) {}
  }, [map]);

  useEffect(() => {
    map.on('moveend', updateClusters);
    map.on('zoomend', updateClusters);
    updateClusters();
    return () => {
      map.off('moveend', updateClusters);
      map.off('zoomend', updateClusters);
    };
  }, [map, updateClusters]);

  return (
    <>
      {clusters.map((feat) => {
        const [lng, lat] = feat.geometry.coordinates;
        const isCluster = feat.properties.cluster;

        if (isCluster) {
          const count = feat.properties.point_count;
          const clusterId = feat.id;

          return (
            <Marker
              key={`cluster-${clusterId}-${lat}-${lng}`}
              position={[lat, lng]}
              icon={makeClusterIcon(count)}
              eventHandlers={{
                click: () => {
                  if (!superclusterRef.current) return;
                  const expansionZoom = Math.min(
                    superclusterRef.current.getClusterExpansionZoom(clusterId),
                    18
                  );
                  map.flyTo([lat, lng], expansionZoom, { duration: 0.8 });
                },
              }}
            />
          );
        }

        const c = feat.properties.complaint;
        return (
          <Marker
            key={`complaint-${c.id}`}
            position={[lat, lng]}
            icon={makeCatIcon(c.category, c.upvote_count || 0)}
          >
            <Popup minWidth={280} maxWidth={340} className="civic-custom-popup">
              <ComplaintPopup
                c={c}
                onUpvote={() => onUpvote(c)}
                upvoting={!!upvoting[c.id]}
                upvoteDone={!!upvoteDone[c.id]}
                tCategory={tCategory}
                lang={lang}
              />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

// ── Reset to Amravati Control Component ──────────────────────────────────────
function AmravatiCenterButton() {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '12px', marginRight: '12px' }}>
      <div className="leaflet-control flex flex-col gap-2">
        <button
          onClick={() => map.flyTo(AMRAVATI_CENTER, 13, { duration: 1 })}
          title="Center on Amravati City"
          className="bg-white/95 hover:bg-white text-stone-800 font-bold px-3 py-2 rounded-xl shadow-md border border-[#ebdcc9] text-xs flex items-center gap-1.5 transition-all hover:scale-105"
        >
          <Target size={14} className="text-[#b85828]" />
          <span>Amravati City</span>
        </button>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MapDashboard() {
  const { lang, tCategory } = useI18n();

  const catLabel = (key) => tCategory(key);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [upvoting, setUpvoting] = useState({});
  const [upvoteDone, setUpvoteDone] = useState({});
  const [locating, setLocating] = useState(false);
  const [myCoords, setMyCoords] = useState(null);
  const [heatmapMode, setHeatmapMode] = useState(false);

  useEffect(() => { document.title = 'Issue Map — Mazhi Amravati'; }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyCoords([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (catFilter) params.category = catFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/complaints/map', { params });
      setComplaints(res.data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load mapped complaints');
    } finally {
      setLoading(false);
    }
  }, [catFilter, statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Upvote handler
  const handleUpvote = async (c) => {
    if (upvoteDone[c.id] || upvoting[c.id]) return;
    setUpvoting((p) => ({ ...p, [c.id]: true }));
    try {
      const res = await api.post(`/complaints/${c.id}/upvote`);
      const newCount = res.data.upvote_count ?? res.data.upvotes ?? ((c.upvote_count || 0) + 1);
      setComplaints((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, upvote_count: newCount } : item))
      );
      setUpvoteDone((p) => ({ ...p, [c.id]: true }));
    } catch (err) {
      if (err.response?.status === 409) {
        setUpvoteDone((p) => ({ ...p, [c.id]: true }));
        const currentVotes = err.response.data.upvote_count ?? err.response.data.upvotes ?? c.upvote_count;
        if (currentVotes !== undefined) {
          setComplaints((prev) =>
            prev.map((item) => (item.id === c.id ? { ...item, upvote_count: currentVotes } : item))
          );
        }
      }
    } finally {
      setUpvoting((p) => ({ ...p, [c.id]: false }));
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
    const topVoted = [...complaints].sort((a, b) => (b.upvote_count || 0) - (a.upvote_count || 0))[0];
    return { total, resolved, inProgress, topVoted };
  }, [complaints]);

  const activeFiltersCount = (catFilter ? 1 : 0) + (statusFilter ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#faf6ee] flex flex-col font-sans">
      <Navbar />

      {/* Header bar */}
      <div className="bg-[#fdfbf7] border-b border-[#ebdcc9] px-4 py-3 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Title & badge */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#faeedd] text-[#b85828] border border-[#ebdcc9] flex items-center justify-center font-bold">
              🗺️
            </div>
            <div>
              <h1 className="font-extrabold text-stone-900 text-sm sm:text-base leading-tight">
                {lang === 'mr' ? 'अमरावती नागरी समस्या थेट नकाशा' : lang === 'hi' ? 'अमरावती नागरिक समस्या लाइव मैप' : 'Amravati City Civic Issue Map'}
              </h1>
              <div className="text-[11px] text-stone-500 font-medium">
                {lang === 'mr' ? 'क्लस्टर व्ह्यू: परिसरातील समस्या एकत्र दिसतील, झूम केल्यावर स्वतंत्र होतील' : 'Cluster view: Zoom in to expand neighborhood complaint clusters'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Locate me */}
            <button
              onClick={locateMe}
              disabled={locating}
              className="inline-flex items-center gap-1.5 text-xs bg-white border border-[#d6c4aa] hover:border-[#b85828] text-stone-700 font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all hover:bg-[#faeedd]"
            >
              <LocateFixed size={13} className={locating ? 'animate-spin text-[#b85828]' : 'text-[#b85828]'} />
              {locating ? (lang === 'mr' ? 'शोधत आहे…' : 'Locating…') : (lang === 'mr' ? 'माझे स्थान' : 'My Location')}
            </button>

            {/* Heatmap toggle */}
            <button
              onClick={() => setHeatmapMode((m) => !m)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                heatmapMode
                  ? 'bg-[#1a4b77] text-white border-[#1a4b77] shadow-xs'
                  : 'bg-white text-stone-700 border-[#d6c4aa] hover:bg-[#faeedd]'
              }`}
            >
              <span>🔥</span> {lang === 'mr' ? 'हॉटस्पॉट' : 'Hotspots'}
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                activeFiltersCount > 0
                  ? 'bg-[#b85828] text-white border-[#b85828]'
                  : 'bg-white text-stone-700 border-[#d6c4aa] hover:bg-[#faeedd]'
              }`}
            >
              <Filter size={13} />
              {lang === 'mr' ? 'फिल्टर' : 'Filter'}
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-[#b85828] text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchComplaints}
              disabled={loading}
              className="p-2 bg-white border border-[#d6c4aa] text-stone-600 rounded-xl hover:bg-[#faeedd] transition-all"
              title="Refresh complaints"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-[#b85828]' : ''} />
            </button>

            {/* Report New */}
            <Link
              to="/complaint"
              className="inline-flex items-center gap-1.5 text-xs bg-[#b85828] hover:bg-[#9c451a] text-white font-extrabold px-3.5 py-1.5 rounded-xl shadow-xs transition-all"
            >
              + {lang === 'mr' ? 'तक्रार करा' : 'Report Issue'}
            </Link>
          </div>

        </div>
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-b border-red-200 text-center font-medium">
          {error}
        </div>
      )}

      {/* Filter panel */}
      {filterOpen && (
        <div className="bg-[#fbf8f2] border-b border-[#ebdcc9] px-4 py-3 animate-in slide-in-from-top-2">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between text-xs">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Category */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {lang === 'mr' ? 'श्रेणी' : 'Category'}
                </label>
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  className="bg-white border border-[#d6c4aa] rounded-xl px-2.5 py-1 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#b85828]"
                >
                  <option value="">{lang === 'mr' ? 'सर्व श्रेणी' : 'All Categories'}</option>
                  {Object.keys(CAT).map((k) => (
                    <option key={k} value={k}>{catLabel(k)}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  {lang === 'mr' ? 'स्थिती' : 'Status'}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-[#d6c4aa] rounded-xl px-2.5 py-1 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#b85828]"
                >
                  <option value="">{lang === 'mr' ? 'सर्व स्थिती' : 'All Statuses'}</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            {/* Clear filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => { setCatFilter(''); setStatusFilter(''); }}
                className="text-[11px] font-bold text-[#b85828] hover:underline flex items-center gap-1"
              >
                <X size={12} /> {lang === 'mr' ? 'फिल्टर हटवा' : 'Clear Filters'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Legend & Stats Banner */}
      <div className="bg-white border-b border-[#ebdcc9] px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between text-xs">
          
          {/* Category legend */}
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              {lang === 'mr' ? 'रंगसूची:' : 'Legend:'}
            </span>
            {Object.entries(CAT).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1 text-[11px] text-stone-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cfg.color }} />
                {catLabel(key)}
              </div>
            ))}
            <div className="flex items-center gap-1 text-[11px] text-stone-700 font-bold ml-2">
              <span className="w-3 h-3 rounded-full inline-block bg-[#b85828] ring-2 ring-[#b85828]/30" />
              <span>{lang === 'mr' ? 'क्लस्टर (एकत्र समस्या)' : 'Cluster Dot'}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-stone-600">
            <span>Total: <strong className="text-stone-900">{stats.total}</strong></span>
            <span>Resolved: <strong className="text-emerald-700">{stats.resolved}</strong></span>
            <span>In Progress: <strong className="text-amber-700">{stats.inProgress}</strong></span>
          </div>

        </div>
      </div>

      {/* Map Body */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 z-[500] flex items-center justify-center">
            <div className="flex items-center gap-2 text-[#b85828] font-bold text-sm bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-[#ebdcc9]">
              <Loader2 size={16} className="animate-spin" /> Loading Amravati complaints map…
            </div>
          </div>
        )}

        <MapContainer
          center={AMRAVATI_CENTER}
          zoom={13}
          minZoom={11}
          maxZoom={18}
          maxBounds={AMRAVATI_BOUNDS}
          maxBoundsViscosity={0.8}
          scrollWheelZoom
          preferCanvas={true}
          style={{ height: 'calc(100vh - 240px)', minHeight: '480px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Reset to Amravati Center Button */}
          <AmravatiCenterButton />

          {myCoords && <FlyTo coords={myCoords} />}

          {/* Heatmap Glowing Hotspot Layer */}
          {heatmapMode && complaints.map((c) => (
            <Circle
              key={`heat-${c.id}`}
              center={[c.latitude, c.longitude]}
              radius={220 + Math.min((c.upvote_count || 0) * 50, 500)}
              pathOptions={{
                color: c.status === 'resolved' ? '#16a34a' : '#ea580c',
                fillColor: c.status === 'resolved' ? '#22c55e' : '#f97316',
                fillOpacity: 0.35,
                weight: 1.5,
              }}
            />
          ))}

          {/* Clustered Markers (Supercluster Engine) */}
          <ClusteredMarkers
            complaints={complaints}
            onUpvote={handleUpvote}
            upvoting={upvoting}
            upvoteDone={upvoteDone}
            tCategory={tCategory}
            lang={lang}
          />
        </MapContainer>

        {/* No results overlay */}
        {!loading && complaints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-3xl border border-[#ebdcc9] shadow-xl px-8 py-6 text-center pointer-events-auto max-w-sm">
              <MapIcon size={32} className="text-[#b85828] mx-auto mb-3" />
              <div className="font-extrabold text-stone-900 mb-1 text-sm">
                {lang === 'mr' ? 'अमरावती शहरात समस्या सापडल्या नाहीत' : 'No issues found in this filter'}
              </div>
              <p className="text-xs text-stone-500 mb-4">
                {lang === 'mr' ? 'आपल्या परिसरातील पहिली नागरी समस्या नोंदवा.' : 'Be the first to report a civic issue in Amravati.'}
              </p>
              <Link to="/complaint" className="text-xs font-extrabold bg-[#b85828] text-white px-4 py-2 rounded-xl shadow-xs hover:bg-[#9c451a]">
                + {lang === 'mr' ? 'तक्रार नोंदवा' : 'Report an Issue'}
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ── Popup Card ───────────────────────────────────────────────────────────────
function ComplaintPopup({ c, onUpvote, upvoting, upvoteDone, tCategory, lang }) {
  const cfg = CAT[c.category] || CAT.other;
  const photos = Array.isArray(c.photos) ? c.photos : [];
  
  const statusLabel =
    c.status === 'submitted'   ? (lang === 'mr' ? 'सादर केले'    : lang === 'hi' ? 'जमा किया'   : 'Submitted')   :
    c.status === 'assigned'    ? (lang === 'mr' ? 'नियुक्त'       : lang === 'hi' ? 'सौंपा गया'  : 'Assigned')    :
    c.status === 'in_progress' ? (lang === 'mr' ? 'प्रगतीपथावर' : lang === 'hi' ? 'प्रगति पर'  : 'In Progress') :
    c.status === 'resolved'    ? (lang === 'mr' ? 'निराकरण झाले' : lang === 'hi' ? 'हल हो गया'  : 'Resolved')    :
    c.status === 'rejected'    ? (lang === 'mr' ? 'नाकारले'       : lang === 'hi' ? 'अस्वीकृत'  : 'Rejected')    :
    c.status;

  const locale = lang === 'mr' ? 'mr-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
  const formattedDate = new Date(c.created_at).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="text-xs font-sans p-1">
      {/* Category header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
          {cfg.icon} {tCategory(c.category)}
        </span>
        <span className={`ml-auto text-[10px] font-extrabold px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] || STATUS_BADGE.submitted}`}>
          {statusLabel}
        </span>
      </div>

      {/* ID & Date */}
      <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono mb-1.5">
        <span className="font-bold text-stone-700">{c.public_id}</span>
        <span>{formattedDate}</span>
      </div>

      {/* Description */}
      <p className="text-stone-800 text-xs leading-relaxed mb-2 line-clamp-3 font-medium">
        {c.summary || c.description}
      </p>

      {/* Before & After / Photos Proof */}
      {c.status === 'resolved' && (photos.length > 0 || c.resolution_photo) ? (
        <div className="mb-2 p-2 bg-emerald-50/90 border border-emerald-200 rounded-2xl">
          <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>{lang === 'mr' ? '✓ निराकरण पुरावा' : '✓ Verified Resolution Proof'}</span>
            <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm font-mono">100% SLA</span>
          </div>
          {photos[0] && c.resolution_photo ? (
            <BeforeAfterSlider
              beforeSrc={photos[0]}
              afterSrc={c.resolution_photo}
              beforeLabel={lang === 'mr' ? 'आधी' : 'Before'}
              afterLabel={lang === 'mr' ? 'नंतर' : 'After'}
              height="h-36"
            />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {photos[0] ? (
                <div>
                  <div className="text-[9px] font-bold text-stone-600 mb-0.5">{lang === 'mr' ? 'आधी' : 'Before'}</div>
                  <a href={fileUrl(photos[0])} target="_blank" rel="noreferrer">
                    <img src={fileUrl(photos[0])} alt="Before" className="w-full h-16 rounded-xl object-cover border border-stone-200" />
                  </a>
                </div>
              ) : null}
              {c.resolution_photo ? (
                <div>
                  <div className="text-[9px] font-bold text-emerald-700 mb-0.5">{lang === 'mr' ? 'नंतर' : 'After'}</div>
                  <a href={fileUrl(c.resolution_photo)} target="_blank" rel="noreferrer">
                    <img src={fileUrl(c.resolution_photo)} alt="After" className="w-full h-16 rounded-xl object-cover border border-emerald-300 ring-1 ring-emerald-400" />
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : photos.length > 0 ? (
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {photos.slice(0, 3).map((p) => (
            <a key={p} href={fileUrl(p)} target="_blank" rel="noreferrer">
              <img
                src={fileUrl(p)}
                alt="evidence"
                className="w-16 h-16 rounded-xl object-cover border border-stone-200 hover:opacity-90 transition-opacity"
              />
            </a>
          ))}
        </div>
      ) : null}

      {/* Location */}
      {c.location_text && (
        <div className="flex items-start gap-1.5 text-[11px] text-stone-600 mb-2">
          <MapPin size={12} className="mt-0.5 shrink-0 text-[#b85828]" />
          <span className="line-clamp-2">{cleanAddress(c.location_text)}</span>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2">
        <button
          onClick={onUpvote}
          disabled={upvoting || upvoteDone}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
            upvoteDone
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-[#faeedd] hover:bg-[#b85828] text-[#8c5a31] hover:text-white border border-[#ebdcc9]'
          }`}
        >
          <ThumbsUp size={12} />
          <span>{c.upvote_count || 0}</span>
          <span className="text-[10px]">{upvoteDone ? 'Voted' : 'Upvote'}</span>
        </button>

        <a
          href={buildWhatsAppLink(c)}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
        >
          <Share2 size={11} /> Share
        </a>

        <Link
          to={`/track?id=${c.public_id}`}
          className="text-[11px] font-bold text-[#b85828] hover:underline flex items-center gap-0.5"
        >
          Track <ExternalLink size={10} />
        </Link>
      </div>
    </div>
  );
}
