import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Send, Image as ImageIcon, X, MapPin, CheckCircle2, Loader2,
  RefreshCcw, ThumbsUp, Map as MapIcon, AlertCircle, Users,
  Mic, MicOff, LocateFixed,
} from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { fileUrl } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import LocationPicker, { fetchDetailedAddress } from '../components/LocationPicker.jsx';
import ComplaintReceipt from '../components/ComplaintReceipt.jsx';

const CAT_LABEL = {
  water_supply: 'Water Supply', roads_potholes: 'Roads / Potholes',
  street_light: 'Street Light', garbage_waste: 'Garbage Collection',
  drainage_sewer: 'Drainage / Sewer', other: 'Other Issue',
};

// ── Similar issue modal ──────────────────────────────────────────────────────
function SimilarIssueModal({ issues, onUpvote, onProceed, onClose, upvoting, upvoteDone }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-saffron-500 text-white px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <AlertCircle size={18} />
          </div>
          <div>
            <div className="font-extrabold text-sm">Similar Issue Already Reported!</div>
            <div className="text-xs text-saffron-100 mt-0.5">A similar complaint exists nearby</div>
          </div>
          <button onClick={onClose} className="ml-auto p-1 hover:bg-white/15 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
          {issues.map((c) => (
            <div key={c.id} className="border border-[#ebdcc9] rounded-xl p-4 bg-[#fbf8f2]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono text-[#b85828] font-bold">{c.public_id}</span>
                <span className="text-[10px] bg-[#faeedd] border border-[#ebdcc9] text-[#b85828] font-bold px-2 py-0.5 rounded-full capitalize">
                  {c.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-stone-700 leading-relaxed line-clamp-2 mb-2">
                {c.summary || c.description}
              </p>
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="flex items-center gap-1"><Users size={11} /> {c.upvote_count || 0} people affected</span>
                <span>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
              <button
                onClick={() => onUpvote(c)}
                disabled={upvoting[c.id] || upvoteDone[c.id]}
                className={`mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl transition-all ${
                  upvoteDone[c.id]
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-[#faeedd] text-[#b85828] border border-[#d6c4aa] hover:bg-[#f5e3cc]'
                }`}
              >
                {upvoting[c.id] ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />}
                {upvoteDone[c.id] ? '✓ Voice Added!' : 'Add My Voice to This Report'}
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onProceed}
            className="flex-1 text-xs font-bold py-2.5 rounded-xl border border-[#d6c4aa] text-stone-700 hover:bg-stone-50 transition-all"
          >
            File New Complaint Anyway
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-xs font-extrabold py-2.5 rounded-xl bg-[#b85828] text-white hover:bg-[#9c451a] shadow-xs transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ChatComplaint() {
  const { t, lang, tCategory } = useI18n();
  const { user } = useAuth();

  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [sending, setSending]         = useState(false);
  const [extracted, setExtracted]     = useState({
    category: null, description: null, location_text: null,
    latitude: null, longitude: null,
    duration_or_details: null, summary: null, ready_to_submit: false,
  });
  const [photos, setPhotos]           = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [locationData, setLocationData] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [guestName, setGuestName]     = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(null);
  const [error, setError]             = useState('');

  // Voice input state
  const [listening, setListening]         = useState(false);
  const [voiceError, setVoiceError]       = useState('');
  const recognitionRef                    = useRef(null);

  // Location state
  const [locatingCurrent, setLocatingCurrent]         = useState(false);
  const [showInlineLocationPicker, setShowInlineLocationPicker] = useState(false);

  // Similar issue check state
  const [checkingNearby, setCheckingNearby]     = useState(false);
  const [nearbyIssues, setNearbyIssues]         = useState([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [upvoting, setUpvoting]                 = useState({});
  const [upvoteDone, setUpvoteDone]             = useState({});
  const [bypassSimilar, setBypassSimilar]       = useState(false);

  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typewriterRef = useRef(null);

  // Voice recognition setup
  const SpeechRecognitionCtor = useRef(
    typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
      : null
  );
  const hasSpeechAPI = !!SpeechRecognitionCtor.current;

  // AI Vision state
  const [analyzingImage, setAnalyzingImage] = useState(false);

  const analyzeUploadedImage = async (imagePath) => {
    setAnalyzingImage(true);
    setError('');
    try {
      const { data } = await api.post('/chatbot/analyze-image', {
        imagePath,
        language: lang,
      });

      if (data.is_civic_issue) {
        setExtracted((prev) => ({
          ...prev,
          category: prev.category || data.category,
          description: prev.description || data.description,
        }));

        if (data.suggested_message && !input.trim()) {
          setInput(data.suggested_message);
        }

        const visionNote = lang === 'mr'
          ? `📸 AI फोटो विश्लेषण: "${data.issue_title || data.category}" आढळले (तीव्रता: ${data.severity}). मी तुमचा तक्रार मसुदा तयार केला आहे.`
          : lang === 'hi'
          ? `📸 AI फोटो विश्लेषण: "${data.issue_title || data.category}" पाया गया (तीव्रता: ${data.severity}). मैंने आपका शिकायत संदेश तैयार कर दिया है.`
          : `📸 AI Photo Analysis: Detected "${data.issue_title || data.category}" (Severity: ${data.severity}). I have prepared a draft message for you below.`;

        setMessages((m) => [...m, { role: 'assistant', text: visionNote }]);
      }
    } catch (err) {
      console.warn('Vision analysis error:', err);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const toggleListening = useCallback(() => {
    const SR = SpeechRecognitionCtor.current;
    if (!SR) {
      setVoiceError('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    // If already listening, stop
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    setVoiceError('');
    const rec = new SR();
    
    // Dynamic speech recognition language matching selected UI language
    const speechLangMap = {
      mr: 'mr-IN',
      hi: 'hi-IN',
      en: 'en-IN',
    };
    rec.lang = speechLangMap[lang] || 'en-IN';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    let finalTranscript = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += t;
        else interim += t;
      }
      // Use zero-width space as a boundary: everything after it is interim/in-progress
      setInput((prev) => {
        const base = prev.replace(/\u200B.*$/, '');
        return base + '\u200B' + (finalTranscript || interim);
      });
    };
    rec.onerror = (e) => {
      if (e.error === 'audio-capture') {
        setVoiceError('Microphone not found or permission denied. Please allow mic access and ensure you are on HTTPS.');
      } else if (e.error === 'not-allowed') {
        setVoiceError('Microphone permission denied. Please allow access in your browser settings.');
      } else if (e.error !== 'no-speech') {
        setVoiceError('Voice error: ' + e.error);
      }
      recognitionRef.current = null;
      setListening(false);
    };
    rec.onend = () => {
      // Commit final — strip the zero-width space separator
      setInput((prev) => prev.replace('\u200B', ''));
      recognitionRef.current = null;
      setListening(false);
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [lang]);

  // ── Send current location as chat message ────────────────────────────────
  const sendCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    setLocatingCurrent(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const addr = await fetchDetailedAddress(lat, lng);
          setLocationData({ lat, lng, address: addr });
          setExtracted((prev) => ({
            ...prev,
            location_text: addr,
            latitude: lat,
            longitude: lng,
          }));
          sendMessage(`${addr} (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } catch {
          const fallbackAddr = 'Amravati, Maharashtra';
          setLocationData({ lat, lng, address: fallbackAddr });
          setExtracted((prev) => ({
            ...prev,
            location_text: fallbackAddr,
            latitude: lat,
            longitude: lng,
          }));
          sendMessage(`${fallbackAddr} (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        } finally {
          setLocatingCurrent(false);
        }
      },
      (err) => {
        setLocatingCurrent(false);
        console.warn('Geolocation error:', err);
        setError(lang === 'mr' ? 'GPS स्थान मिळवता आले नाही. कृपया लोकेशन परवानगी तपासा.' : 'Could not get location. Please allow location access.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMessages([{ role: 'assistant', text: t('chatWelcome') }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Only scroll the internal messages container, never the outer window
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, sending]);

  const streamAssistantReply = (fullText, onDone) => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    let index = 0;
    // Append placeholder assistant message
    setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

    typewriterRef.current = setInterval(() => {
      index += 3; // Stream 3 chars per 12ms for smooth fast typing
      if (index <= fullText.length) {
        const partial = fullText.slice(0, index);
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = { role: 'assistant', text: partial };
          }
          return next;
        });
      } else {
        setMessages((prev) => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = { role: 'assistant', text: fullText };
          }
          return next;
        });
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
        if (onDone) onDone();
      }
    }, 12);
  };

  const sendMessage = async (text) => {
    const outgoing = text ?? input;
    if (!outgoing.trim() || sending) return;
    setError('');
    const priorMessages = messages;
    setMessages((m) => [...m, { role: 'user', text: outgoing }]);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post('/chatbot/message', {
        message: outgoing,
        history: priorMessages.map((m) => ({ role: m.role, text: m.text })),
        language: lang,
      });
      setSending(false);
      streamAssistantReply(data.reply);
      setExtracted((prev) => ({
        category:            data.category            ?? prev.category,
        description:         data.description         ?? prev.description,
        location_text:       data.location_text       ?? prev.location_text,
        latitude:            data.latitude            ?? prev.latitude,
        longitude:           data.longitude           ?? prev.longitude,
        duration_or_details: data.duration_or_details ?? prev.duration_or_details,
        summary:             data.summary             ?? prev.summary,
        ready_to_submit:     !!data.ready_to_submit,
      }));
    } catch (err) {
      setSending(false);
      setError(err.response?.data?.error || 'The AI assistant is unavailable right now.');
    }
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    try {
      const { data } = await api.post('/complaints/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newFiles = data.files || [];
      setPhotos((p) => [...p, ...newFiles]);
      if (newFiles.length > 0) {
        analyzeUploadedImage(newFiles[0]);
      }
    } catch {
      setError('Photo upload failed. Try a smaller image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const QUICK_TOPICS = {
    en: [
      { label: '💡 Street Light', text: 'Streetlight is not working' },
      { label: '🕳️ Roads / Potholes', text: 'There is a pothole on the road' },
      { label: '🗑️ Garbage Waste', text: 'Garbage has not been collected' },
      { label: '🚰 Water Supply', text: 'Water supply pipeline problem' },
      { label: '🌊 Drainage / Sewer', text: 'Drainage is overflowing' },
      { label: '⚠️ Other Problem', text: 'I want to report a civic issue' },
    ],
    mr: [
      { label: '💡 स्ट्रीट लाईट', text: 'रस्त्यावरील स्ट्रीट लाईट बंद आहे' },
      { label: '🕳️ रस्त्यावर खड्डा', text: 'रस्त्यावर खड्डा पडला आहे' },
      { label: '🗑️ कचरा साचला आहे', text: 'कचरा उचलला नाही' },
      { label: '🚰 पाणीपुरवठा', text: 'पाणीपुरवठ्यात अडचण आहे' },
      { label: '🌊 गटार ओव्हरफ्लो', text: 'गटाराचे घाण पाणी वाहत आहे' },
      { label: '⚠️ इतर समस्या', text: 'मला नागरी समस्येची तक्रार करायची आहे' },
    ],
    hi: [
      { label: '💡 स्ट्रीट लाइट', text: 'सड़क की स्ट्रीट लाइट बंद है' },
      { label: '🕳️ सड़क पर गड्ढा', text: 'सड़क पर गड्ढा है' },
      { label: '🗑️ कचरे का ढेर', text: 'कचरा नहीं उठाया गया है' },
      { label: '🚰 पानी सप्लाई', text: 'पानी की सप्लाई में समस्या है' },
      { label: '🌊 नाली ओवरफ्लो', text: 'नाली का गंदा पानी बह रहा है' },
      { label: '⚠️ अन्य समस्या', text: 'मुझे नागरिक समस्या की शिकायत करनी है' },
    ],
  };

  const removePhoto = (p) => setPhotos((ph) => ph.filter((x) => x !== p));

  const startNewChat = () => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }
    recognitionRef.current?.stop();
    setListening(false);
    setVoiceError('');
    setShowInlineLocationPicker(false);
    setMessages([{ role: 'assistant', text: t('chatWelcome') }]);
    setExtracted({ category: null, description: null, location_text: null, latitude: null, longitude: null, duration_or_details: null, summary: null, ready_to_submit: false });
    setPhotos([]);
    setLocationData(null);
    setSubmitted(null);
    setError('');
    setNearbyIssues([]);
    setBypassSimilar(false);
    setUpvoteDone({});
  };

  // ── Similar issue check → then submit ──────────────────────────────────────
  const checkAndSubmit = async () => {
    if (bypassSimilar) { submitComplaint(); return; }

    const lat  = locationData?.lat  ?? extracted.latitude;
    const lng  = locationData?.lng  ?? extracted.longitude;
    const cat  = extracted.category;

    // If no coords, skip proximity check and go straight to submit
    if (!lat || !lng) { submitComplaint(); return; }

    setCheckingNearby(true);
    try {
      const params = { lat, lng, radius: 100 };
      if (cat) params.category = cat;
      const { data } = await api.get('/complaints/nearby', { params });
      if (data.nearby?.length > 0) {
        setNearbyIssues(data.nearby);
        setShowSimilarModal(true);
        setCheckingNearby(false);
        return;
      }
    } catch { /* non-critical, proceed anyway */ }
    setCheckingNearby(false);
    submitComplaint();
  };

  const handleUpvoteNearby = async (c) => {
    if (upvoteDone[c.id]) return;
    setUpvoting((u) => ({ ...u, [c.id]: true }));
    try {
      const { data } = await api.post(`/complaints/${c.id}/upvote`);
      setNearbyIssues((prev) => prev.map((x) => x.id === c.id ? { ...x, upvote_count: data.upvote_count } : x));
      setUpvoteDone((d) => ({ ...d, [c.id]: true }));
    } catch (err) {
      if (err.response?.status === 409) setUpvoteDone((d) => ({ ...d, [c.id]: true }));
    } finally {
      setUpvoting((u) => ({ ...u, [c.id]: false }));
    }
  };

  const submitComplaint = async () => {
    setShowSimilarModal(false);
    setBypassSimilar(true);
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/complaints', {
        category:    extracted.category,
        description: [extracted.description, extracted.duration_or_details].filter(Boolean).join('. '),
        summary:     extracted.summary,
        language:    lang,
        location_text: locationData?.address || extracted.location_text,
        latitude:    locationData?.lat  ?? extracted.latitude,
        longitude:   locationData?.lng  ?? extracted.longitude,
        photos,
        chat_transcript: messages,
        guest_name:    user ? undefined : guestName  || 'Guest',
        guest_contact: user ? undefined : guestContact || undefined,
      });
      setSubmitted(data.complaint);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit complaint. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#faf6ee] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg space-y-4">
            {/* Downloadable Official Receipt */}
            <ComplaintReceipt complaint={submitted} guestName={guestName} />

            {/* Bottom Quick Action Navigation */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <a
                href={`/track?id=${submitted.public_id}`}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#b85828] text-white hover:bg-[#9c451a] transition-all text-center text-xs font-bold shadow-md shadow-[#b85828]/20"
              >
                <CheckCircle2 size={16} /> Track Status
              </a>
              <Link
                to="/map"
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-[#d6c4aa] text-stone-800 hover:bg-[#faeedd] transition-all text-center text-xs font-bold shadow-xs"
              >
                <MapIcon size={16} className="text-[#b85828]" /> View Map
              </Link>
              <button
                onClick={startNewChat}
                className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white border border-[#d6c4aa] text-stone-800 hover:bg-stone-50 transition-all text-center text-xs font-bold shadow-xs"
              >
                <RefreshCcw size={16} /> New Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#faf6ee] flex flex-col font-sans">
      <Navbar />

      {showSimilarModal && (
        <SimilarIssueModal
          issues={nearbyIssues}
          onUpvote={handleUpvoteNearby}
          onProceed={submitComplaint}
          onClose={() => setShowSimilarModal(false)}
          upvoting={upvoting}
          upvoteDone={upvoteDone}
        />
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 grid lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Chat panel ─────────────────────────────────────── */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#ebdcc9] shadow-xl flex flex-col h-[75vh] overflow-hidden">
          {/* Subtle top hairline */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-[#c8682e]" />

          {/* Header (Soft, eye-friendly, comfortable) */}
          <div className="bg-[#fdfbf8] border-b border-[#ebdcc9] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#faeedd] border border-[#d6c4aa] flex items-center justify-center text-[#b85828] shadow-2xs">
                <Bot size={20} />
              </div>
              <div>
                <div className="text-sm font-extrabold text-stone-900 tracking-tight">तक्रार सहाय्यक (Takrar Sahayak)</div>
                <div className="text-[11px] flex items-center gap-1.5 text-stone-500 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online — AI Grievance Assistant
                </div>
              </div>
            </div>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-[#faeedd] text-stone-700 hover:text-[#b85828] border border-[#d6c4aa] px-3.5 py-1.5 rounded-xl transition-all font-bold shadow-2xs"
            >
              <RefreshCcw size={12} /> {t('newChat')}
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#fcfaf6]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-2xl bg-[#faeedd] border border-[#ebdcc9] text-[#b85828] flex items-center justify-center shrink-0 mr-2.5 mt-0.5 shadow-2xs">
                    <Bot size={16} />
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-[#d97736] to-[#c8682e] text-white rounded-tr-xs shadow-sm font-medium'
                    : 'bg-white text-stone-800 rounded-tl-xs border border-[#ebdcc9] shadow-xs'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-2xl bg-[#faeedd] border border-[#ebdcc9] text-[#b85828] flex items-center justify-center shrink-0 mr-2.5 mt-0.5 shadow-2xs">
                  <Bot size={16} />
                </div>
                <div className="bg-white border border-[#ebdcc9] rounded-2xl rounded-tl-xs px-4 py-2.5 flex items-center gap-2 shadow-xs text-xs text-stone-500 font-medium">
                  <Loader2 size={13} className="animate-spin text-[#c8682e]" />
                  <span>{lang === 'mr' ? 'उत्तर तयार करत आहे...' : lang === 'hi' ? 'उत्तर तैयार कर रहा हूँ...' : 'Takrar Sahayak is typing…'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="px-5 pb-2 flex gap-2 flex-wrap">
              {photos.map((p) => (
                <div key={p} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={fileUrl(p)} alt="upload" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(p)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-5 mb-2 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-[#ebdcc9] px-4 pt-2.5 pb-2 bg-white">
            {/* Quick problem selection chips — normal, clean, and never change into "select location or details" */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-1.5 scrollbar-none">
              <span className="text-[10px] text-[#b85828] bg-[#faeedd] px-2.5 py-0.5 rounded-full uppercase font-extrabold tracking-wider shrink-0 mr-1 border border-[#ebdcc9] flex items-center gap-1">
                {lang === 'mr' ? 'समस्या निवडा:' : lang === 'hi' ? 'समस्या चुनें:' : 'Quick Select:'}
              </span>
              {(QUICK_TOPICS[lang] || QUICK_TOPICS.en).map((topic, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => sendMessage(topic.text)}
                  disabled={sending}
                  className="shrink-0 text-xs px-3 py-1 rounded-full border border-[#ebdcc9] bg-[#fbf8f2] hover:border-[#b85828] hover:bg-[#faeedd] text-stone-700 hover:text-[#b85828] shadow-2xs font-medium transition-all"
                >
                  {topic.label}
                </button>
              ))}
            </div>

            {/* AI Vision Status indicator */}
            {analyzingImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 animate-pulse font-medium">
                <Loader2 size={12} className="animate-spin text-amber-700" />
                <span>🤖 AI Vision is analyzing your uploaded photo (detecting category & details)...</span>
              </div>
            )}

            {/* Gemini-Style Voice Waveform Listening Active Indicator */}
            {listening && (
              <div className="flex items-center justify-between px-4 py-2 mb-2 rounded-xl bg-gradient-to-r from-red-50 via-amber-50 to-red-50 border border-red-200 text-xs text-red-800 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-3.5 bg-red-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-5 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:300ms]" />
                    <span className="w-1 h-4 bg-saffron-500 rounded-full animate-bounce [animation-delay:200ms]" />
                  </div>
                  <span className="font-bold">
                    {lang === 'mr' ? '🎙️ मराठीत ऐकत आहे... बोला' : lang === 'hi' ? '🎙️ हिंदी में सुन रहा हूँ... बोलिए' : '🎙️ Listening in English... speak now'}
                  </span>
                </div>
                <button type="button" onClick={toggleListening} className="text-[11px] font-bold text-red-700 bg-white px-2 py-0.5 rounded-md border border-red-300 hover:bg-red-50 shadow-xs">
                  Done / Stop
                </button>
              </div>
            )}

            {/* Quick-action row */}
            <div className="flex items-center gap-2 mb-2">
              {/* Current location quick button */}
              <button
                type="button"
                onClick={sendCurrentLocation}
                disabled={locatingCurrent || sending}
                title="Send my current location"
                className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                {locatingCurrent
                  ? <Loader2 size={11} className="animate-spin" />
                  : <LocateFixed size={11} />}
                {locatingCurrent ? 'Locating…' : 'Current Location'}
              </button>
              {/* Open map picker */}
              <button
                type="button"
                onClick={() => setShowInlineLocationPicker((v) => !v)}
                title="Pick location on map"
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                  showInlineLocationPicker
                    ? 'border-[#b85828] bg-[#faeedd] text-[#b85828]'
                    : 'border-[#d6c4aa] bg-[#fbf8f2] text-stone-700 hover:bg-[#faeedd]'
                }`}
              >
                <MapPin size={11} /> {showInlineLocationPicker ? 'Close Map' : 'Pick on Map'}
              </button>
            </div>

            {/* Main input row */}
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Attach photo"
                className="w-10 h-10 rounded-full border border-[#d6c4aa] bg-[#fbf8f2] flex items-center justify-center text-stone-600 hover:bg-[#faeedd] hover:border-[#b85828] hover:text-[#b85828] shrink-0 transition-colors"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={15} />}
              </button>
              <input
                value={input.replace('\u200B', '')}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={listening ? '🎤 Listening…' : t('typeMessage')}
                className={`flex-1 bg-[#fbf8f2] border rounded-full px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition-all ${
                  listening ? 'border-red-400 ring-2 ring-red-200' : 'border-[#d6c4aa] focus:border-[#b85828] focus:ring-2 focus:ring-[#b85828]/15'
                }`}
              />
              {/* Mic button — shown always; shows error if API unavailable */}
              <button
                type="button"
                onClick={toggleListening}
                title={listening ? 'Stop voice input' : 'Voice input (mic)'}
                className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  listening
                    ? 'bg-red-500 border-red-500 text-white animate-pulse'
                    : hasSpeechAPI
                      ? 'border-[#d6c4aa] bg-[#fbf8f2] text-stone-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                      : 'border-stone-200 text-stone-300 cursor-not-allowed'
                }`}
              >
                {listening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={sending || !input.replace('\u200B', '').trim()}
                className="w-10 h-10 rounded-full bg-[#b85828] hover:bg-[#9c451a] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-[#b85828]/25 transition-all"
              >
                <Send size={15} />
              </button>
            </div>
            {/* Voice error */}
            {voiceError && (
              <p className="text-[10px] text-red-500 mt-1 pl-1">{voiceError}</p>
            )}

            {/* Inline location picker panel */}
            {showInlineLocationPicker && (
              <div className="mt-2 border border-[#d6c4aa] rounded-2xl p-3.5 bg-[#fbf8f2]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#b85828] flex items-center gap-1"><MapPin size={12} /> Set Location</span>
                  <button
                    type="button"
                    onClick={() => setShowInlineLocationPicker(false)}
                    className="text-stone-400 hover:text-stone-700"
                  ><X size={13} /></button>
                </div>
                <LocationPicker
                  value={locationData}
                  onChange={(loc) => {
                    setLocationData(loc);
                    setExtracted((prev) => ({
                      ...prev,
                      location_text: loc.address,
                      latitude: loc.lat,
                      longitude: loc.lng,
                    }));
                    setShowInlineLocationPicker(false);
                    sendMessage(`${loc.address} (GPS: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)})`);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Summary sidebar ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#ebdcc9] shadow-xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#b85828]" /> {t('complaintSummary')}
              </h3>
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#faeedd] border border-[#ebdcc9] text-[#b85828]">
                {[Boolean(extracted.category), Boolean(locationData?.address || extracted.location_text), Boolean(extracted.description), photos.length > 0].filter(Boolean).length}/4 Complete
              </span>
            </div>
            <div className="space-y-2.5 text-sm">
              <SummaryRow
                label={t('problemType')}
                value={extracted.category ? (CAT_LABEL[extracted.category] || tCategory(extracted.category)) : '—'}
                completed={Boolean(extracted.category)}
              />
              <SummaryRow
                label={t('location')}
                value={locationData?.address || extracted.location_text || '—'}
                completed={Boolean(locationData?.address || extracted.location_text)}
              />
              <SummaryRow
                label={t('details')}
                value={[extracted.description, extracted.duration_or_details].filter(Boolean).join(' · ') || '—'}
                completed={Boolean(extracted.description)}
              />
              <SummaryRow
                label={t('photos')}
                value={photos.length ? `${photos.length} uploaded` : '—'}
                completed={photos.length > 0}
              />
            </div>

            {/* Location picker */}
            <button
              onClick={() => setShowLocationPicker((v) => !v)}
              className="mt-4 w-full flex items-center justify-center gap-2 text-xs border border-[#d6c4aa] text-[#b85828] bg-[#faeedd] hover:bg-[#f5e3cc] py-2.5 rounded-xl transition-all font-bold shadow-xs"
            >
              <MapPin size={13} /> {t('useMyLocation')}
            </button>
            {showLocationPicker && (
              <div className="mt-3">
                <LocationPicker
                  value={locationData}
                  onChange={(loc) => {
                    setLocationData(loc);
                    setExtracted((prev) => ({
                      ...prev,
                      location_text: loc.address,
                      latitude: loc.lat,
                      longitude: loc.lng,
                    }));
                    setShowLocationPicker(false);
                    sendMessage(`${loc.address} (GPS: ${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)})`);
                  }}
                />
              </div>
            )}

            {/* Guest fields */}
            {!user && (
              <div className="mt-4 space-y-2 border-t border-[#ebdcc9] pt-4">
                <p className="text-xs text-stone-500 font-medium">Guest details (optional — helps us follow up)</p>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={t('name')}
                  className="w-full text-sm border border-[#d6c4aa] rounded-xl px-3 py-2 bg-[#fbf8f2] text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#b85828] focus:outline-none transition-all"
                />
                <input
                  value={guestContact}
                  onChange={(e) => setGuestContact(e.target.value)}
                  placeholder={t('phone')}
                  className="w-full text-sm border border-[#d6c4aa] rounded-xl px-3 py-2 bg-[#fbf8f2] text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#b85828] focus:outline-none transition-all"
                />
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={checkAndSubmit}
              disabled={!extracted.ready_to_submit || submitting || checkingNearby}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-[#b85828] hover:bg-[#9c451a] disabled:opacity-40 text-white font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-[#b85828]/25 text-sm"
            >
              {(submitting || checkingNearby)
                ? <Loader2 size={16} className="animate-spin" />
                : <CheckCircle2 size={16} />
              }
              {checkingNearby ? 'Checking nearby…' : submitting ? 'Submitting…' : t('submitComplaint')}
            </button>
            {!extracted.ready_to_submit && (
              <p className="text-[11px] text-stone-500 mt-2.5 text-center leading-relaxed font-medium">
                Keep chatting — the submit button unlocks once we have enough details.
              </p>
            )}
          </div>

          {/* Map link */}
          <Link
            to="/map"
            className="flex items-center gap-3 bg-white/95 backdrop-blur-md rounded-2xl border border-[#ebdcc9] shadow-md p-4 hover:border-[#b85828] hover:shadow-lg transition-all group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#faeedd] flex items-center justify-center group-hover:scale-105 transition-transform border border-[#ebdcc9]">
              <MapIcon size={18} className="text-[#b85828]" />
            </div>
            <div>
              <div className="text-sm font-black text-stone-900">View Issue Map</div>
              <div className="text-xs text-stone-500">See all reported issues in your area</div>
            </div>
          </Link>

          {/* Info box */}
          <div className="bg-[#faeedd]/70 border border-[#ebdcc9] rounded-2xl p-4 text-xs text-stone-700 space-y-1.5 shadow-2xs">
            <p className="font-black text-[#8c3d15] mb-2 flex items-center gap-1.5">
              <span>🏛️</span> How it works:
            </p>
            <p>• Your complaint is automatically routed to the right AMC department.</p>
            <p>• You'll receive a unique Complaint ID to track progress in real time.</p>
            <p>• Before submitting, we check if a similar issue was reported nearby — you can upvote it instead.</p>
            <p>• A human municipal officer reviews and resolves every complaint with photo proof.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, completed }) {
  return (
    <div className={`p-2.5 rounded-xl transition-all ${completed ? 'bg-emerald-50/70 border border-emerald-200/80' : 'bg-slate-50 border border-slate-100'}`}>
      <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider mb-0.5">
        <span className={completed ? 'text-emerald-800' : 'text-slate-400'}>{label}</span>
        {completed && <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-1.5 py-0.2 rounded">✓ Captured</span>}
      </div>
      <div className={`text-xs font-semibold break-words ${completed ? 'text-slate-900' : 'text-slate-400'}`}>
        {value}
      </div>
    </div>
  );
}
