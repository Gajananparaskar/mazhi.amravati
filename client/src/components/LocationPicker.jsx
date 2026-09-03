import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { LocateFixed, MapPin, Search } from 'lucide-react';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const AMRAVATI_CENTER = [20.9320, 77.7523];

export async function fetchDetailedAddress(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { 'Accept-Language': 'en,mr,hi' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const a = data.address;
        const parts = [
          a.amenity || a.building || a.shop || a.leisure || a.tourism,
          a.road || a.street || a.pedestrian,
          a.neighbourhood || a.suburb || a.residential,
          a.city_district || a.ward || a.village,
          a.city || a.town || 'Amravati',
          a.postcode ? `PIN: ${a.postcode}` : '',
        ].filter(Boolean);

        if (parts.length > 0) return parts.join(', ');
      }
      if (data.display_name) return data.display_name;
    }
  } catch (_) {}
  return `Amravati GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnPick({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 16), { animate: true });
  }, [position, map]);
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const [position, setPosition] = useState(value?.lat ? [value.lat, value.lng] : null);
  const [address, setAddress] = useState(value?.address || '');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [locating, setLocating] = useState(false);

  const pick = async (lat, lng) => {
    setPosition([lat, lng]);
    const addr = await fetchDetailedAddress(lat, lng);
    setAddress(addr);
    if (onChange) onChange({ lat, lng, address: addr });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      return alert('Geolocation is not supported in this browser');
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await pick(lat, lng);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        alert('Could not fetch exact GPS. Please check location permissions or tap on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const searchPlace = async () => {
    if (!query.trim()) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query + ', Amravati, Maharashtra')}&limit=5`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (_) {}
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchPlace())}
            placeholder="Search Amravati area, landmark, ward..."
            className="w-full bg-[#fbf8f2] border border-[#d6c4aa] rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#b85828]/20 focus:border-[#b85828] focus:outline-none transition-all"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-stone-400" />
          {suggestions.length > 0 && (
            <div className="absolute z-[1000] mt-1 w-full bg-white border border-[#ebdcc9] rounded-2xl shadow-xl max-h-48 overflow-auto py-1">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onClick={() => {
                    pick(parseFloat(s.lat), parseFloat(s.lon));
                    setSuggestions([]);
                    setQuery('');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs hover:bg-[#faeedd] border-b border-stone-50 last:border-0 font-medium text-stone-800"
                >
                  {s.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-[#d6c4aa] text-[#8c5a31] bg-[#faeedd] hover:bg-[#b85828] hover:text-white transition-all whitespace-nowrap shadow-xs"
        >
          <LocateFixed size={14} className={locating ? 'animate-spin' : ''} />
          {locating ? 'Acquiring GPS…' : 'Current GPS'}
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[#ebdcc9] shadow-xs">
        <MapContainer
          center={position || AMRAVATI_CENTER}
          zoom={position ? 16 : 13}
          scrollWheelZoom
          preferCanvas={true}
          style={{ height: '220px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <ClickHandler onPick={pick} />
          <RecenterOnPick position={position} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>

      {address && (
        <div className="flex flex-col gap-1 text-xs bg-white border border-[#ebdcc9] text-stone-800 rounded-xl p-2.5 shadow-xs">
          <div className="flex items-start gap-1.5 font-bold text-stone-900">
            <MapPin size={14} className="mt-0.5 shrink-0 text-[#b85828]" />
            <span>{address}</span>
          </div>
          {position && (
            <div className="text-[10px] font-mono text-stone-500 pl-5 flex items-center gap-2">
              <span>📍 Lat: {position[0].toFixed(5)}</span>
              <span>Lng: {position[1].toFixed(5)}</span>
            </div>
          )}
        </div>
      )}
      <p className="text-[11px] text-stone-400">Tap anywhere on the map, use search, or click "Current GPS" to pin your exact location.</p>
    </div>
  );
}
