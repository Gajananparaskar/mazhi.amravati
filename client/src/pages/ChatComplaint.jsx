import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Send, Image as ImageIcon, X, MapPin, CheckCircle2, Loader2,
  RefreshCcw, ThumbsUp, Map as MapIcon, AlertCircle, Users,
  Mic, MicOff, LocateFixed, User, Phone,
} from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { fileUrl } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
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
  const [guestName, setGuestName]     = useState(user?.name || '');
  const [guestContact, setGuestContact] = useState(user?.phone || '');

  useEffect(() => {
    if (user) {
      setGuestName((prev) => prev || user.name || '');
      setGuestContact((prev) => prev || user.phone || '');
    }
  }, [user]);

  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(null);
  const [error, setError]             = useState('');

  // Voice input state
  const [listening, setListening]         = useState(false);
  const [voiceError, setVoiceError]       = useState('');
  const recognitionRef                    = useRef(null);

  // Inline map & GPS location state
  const [locatingCurrent, setLocatingCurrent]                   = useState(false);
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
      setVoiceError('Voice input requires Google Chrome or Microsoft Edge.');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    setVoiceError('');

    try {
      const rec = new SR();
      const speechLangMap = { mr: 'mr-IN', hi: 'hi-IN', en: 'en-IN' };
      rec.lang = speechLangMap[lang] || 'en-IN';
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.continuous = true;

      rec.onresult = (e) => {
        let transcript = '';
        for (let i = 0; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        setInput(transcript);
      };

      rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          setVoiceError('Microphone permission blocked. Please allow mic in browser settings.');
        }
        recognitionRef.current = null;
        setListening(false);
      };

      rec.onend = () => {
        recognitionRef.current = null;
        setListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch (err) {
      console.warn('Speech error:', err);
      setListening(false);
    }
  }, [lang]);

  // ── Send current location as chat message ────────────────────────────────
  const sendCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(lang === 'mr' ? 'आपल्या ब्राउझरमध्ये लोकेशन सपोर्ट नाही.' : 'Geolocation is not supported in this browser.');
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

  const streamAssistantReply = (text, onDone) => {
    const fullText = (text && typeof text === 'string' && text.trim())
      ? text
      : (lang === 'mr' ? 'नमस्कार! कृपया आपली समस्या सविस्तर सांगा.' : 'Hello! How can I help with your civic complaint today?');
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
        guest_name:    guestName.trim() || user?.name || 'Citizen',
        guest_contact: guestContact.trim() || user?.phone || undefined,
      });
      setSubmitted(data.complaint);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit complaint. Please check the details and try again.');
    } finally {
      setSubmitting(false);
    }
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

  const isReadyToSubmit = Boolean(
    extracted.ready_to_submit ||
    (extracted.category && (extracted.location_text || locationData?.address) && extracted.description)
  );

  const sendMessage = async (text) => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
      setListening(false);
    }
    const outgoing = text ?? input;
    if (!outgoing.trim() || sending) return;
    setError('');

    const lower = outgoing.trim().toLowerCase();
    const isFileIntent = /^(file|submit|done|ok|yes|sagal dil|sagal dil ahe|sagal dila|all given|dil ahe|daakhal|nondva|तक्रार|दाखल|नोंदवा|सगळं दिलं|सगळ दिल|पूर्ण)/i.test(lower);
    const hasCore = Boolean(
      extracted.category &&
      (extracted.location_text || locationData?.address) &&
      extracted.description
    );

    // If citizen says "file" / "sagal dil ahe" and info is ready, directly proceed to submission!
    if (isFileIntent && (hasCore || isReadyToSubmit)) {
      setMessages((m) => [
        ...m,
        { role: 'user', text: outgoing },
        {
          role: 'assistant',
          text: lang === 'mr'
            ? 'आपल्या तक्रारीचे सर्व तपशील प्राप्त झाले आहेत. मी आपली तक्रार दाखल करत आहे...'
            : lang === 'hi'
            ? 'आपकी शिकायत के सभी विवरण प्राप्त हो गए हैं। शिकायत दर्ज की जा रही है...'
            : 'All grievance details captured. Submitting your complaint now...'
        }
      ]);
      setInput('');
      setExtracted((prev) => ({ ...prev, ready_to_submit: true }));
      setTimeout(() => {
        checkAndSubmit();
      }, 300);
      return;
    }

    const priorMessages = messages;
    setMessages((m) => [...m, { role: 'user', text: outgoing }]);
    setInput('');
    setSending(true);

    try {
      const currentLoc = locationData?.address || extracted.location_text;
      const { data } = await api.post('/chatbot/message', {
        message: outgoing,
        history: priorMessages.map((m) => ({ role: m.role, text: m.text })),
        language: lang,
        currentExtracted: {
          ...extracted,
          location_text: currentLoc,
        },
      });
      setSending(false);
      const replyText = data?.reply || (lang === 'mr' ? 'माहिती दिल्याबद्दल धन्यवाद. कृपया पुढे सांगा.' : 'Thank you for the message. How can I help further?');
      streamAssistantReply(replyText);
      setExtracted((prev) => {
        const nextCat = data.category ?? prev.category;
        const nextDesc = data.description ?? prev.description;
        const nextLoc = data.location_text ?? prev.location_text ?? locationData?.address;
        const coreReady = Boolean(nextCat && nextLoc && nextDesc);
        return {
          category:            nextCat,
          description:         nextDesc,
          location_text:       nextLoc,
          latitude:            data.latitude            ?? prev.latitude,
          longitude:           data.longitude           ?? prev.longitude,
          duration_or_details: data.duration_or_details ?? prev.duration_or_details,
          summary:             data.summary             ?? prev.summary,
          ready_to_submit:     coreReady || !!data.ready_to_submit || prev.ready_to_submit,
        };
      });
    } catch (err) {
      setSending(false);
      console.error('Chat error:', err);
      const errMsg = err.response?.data?.error || err.message || 'The AI assistant is unavailable right now.';
      setError(errMsg);
      streamAssistantReply(lang === 'mr' ? 'क्षमस्व, सर्व्हरशी संपर्क होऊ शकला नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.' : 'Sorry, could not reach the server. Please try again.');
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

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20 sm:pb-28 grid lg:grid-cols-[1fr_340px] gap-6">

        {/* ── Chat panel (Fluid h-[75vh] like before) ── */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#ebdcc9] shadow-xl flex flex-col h-[75vh] min-h-[560px] overflow-hidden">
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
                  <span>{lang === 'mr' ? 'उत्तर तयार करत आहे...' : lang === 'hi' ? 'उत्तर तैयार कर रहा हूँ...' : 'Assistant is typing…'}</span>
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
          <div className="border-t border-[#ebdcc9] px-4 pt-3 pb-2 bg-white">
            {/* AI Vision Status indicator */}
            {analyzingImage && (
              <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 animate-pulse font-medium">
                <Loader2 size={12} className="animate-spin text-amber-700" />
                <span>🤖 AI Vision is analyzing your uploaded photo (detecting category & details)...</span>
              </div>
            )}

            {/* Quick-action row: Choose Current Location along with Pick on Map */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {/* Choose Current Location */}
              <button
                type="button"
                onClick={sendCurrentLocation}
                disabled={locatingCurrent || sending}
                title="Use my current GPS location"
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                {locatingCurrent
                  ? <Loader2 size={11} className="animate-spin text-emerald-600" />
                  : <LocateFixed size={11} className="text-emerald-700" />}
                <span>{locatingCurrent ? (lang === 'mr' ? 'स्थान शोधत आहे…' : 'Locating…') : (lang === 'mr' ? 'चालू स्थान निवडा' : lang === 'hi' ? 'वर्तमान स्थान चुनें' : 'Choose Current Location')}</span>
              </button>

              {/* Open map picker */}
              <button
                type="button"
                onClick={() => setShowInlineLocationPicker((v) => !v)}
                title="Pick location on map"
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border transition-colors shadow-2xs cursor-pointer ${
                  showInlineLocationPicker
                    ? 'border-[#b85828] bg-[#faeedd] text-[#b85828]'
                    : 'border-[#d6c4aa] bg-[#fbf8f2] text-stone-700 hover:bg-[#faeedd]'
                }`}
              >
                <MapPin size={11} />
                <span>{showInlineLocationPicker ? (lang === 'mr' ? 'नकाशा बंद करा' : 'Close Map') : (lang === 'mr' ? 'नकाशावर निवडा' : lang === 'hi' ? 'मानचित्र पर चुनें' : 'Pick on Map')}</span>
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
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={listening ? (lang === 'mr' ? 'माईक चालू आहे... बोला' : lang === 'hi' ? 'माइक चालू है... बोलिए' : 'Listening... speak now') : t('typeMessage')}
                className={`flex-1 bg-[#fbf8f2] border rounded-full px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-none transition-all ${
                  listening ? 'border-red-400 bg-white' : 'border-[#d6c4aa] focus:border-[#b85828]'
                }`}
              />
              {/* Mic button without animations */}
              <button
                type="button"
                onClick={toggleListening}
                title={listening ? 'Stop microphone' : 'Voice input (Microphone)'}
                className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  listening
                    ? 'bg-red-600 border-red-600 text-white'
                    : hasSpeechAPI
                      ? 'border-[#d6c4aa] bg-[#fbf8f2] text-stone-700 hover:bg-[#faeedd] hover:border-[#b85828] hover:text-[#b85828]'
                      : 'border-stone-200 text-stone-300 cursor-not-allowed'
                }`}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={sending || !input.trim()}
                className="w-10 h-10 rounded-full bg-[#b85828] hover:bg-[#9c451a] disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors"
              >
                <Send size={15} />
              </button>
            </div>

            {/* Voice error text */}
            {voiceError && (
              <p className="text-[11px] text-red-600 mt-1 pl-2 flex items-center justify-between">
                <span>{voiceError}</span>
                <button
                  type="button"
                  onClick={() => setVoiceError('')}
                  className="text-stone-400 hover:text-stone-700 font-bold ml-2 text-xs"
                >
                  ✕
                </button>
              </p>
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

        {/* ── Summary sidebar ── */}
        <div className="space-y-4">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#ebdcc9] shadow-xl p-5 sm:p-6 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#ebdcc9]">
              <h3 className="font-black text-stone-900 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#b85828]" /> {t('complaintSummary')}
              </h3>
              <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-[#faeedd] border border-[#ebdcc9] text-[#b85828]">
                {[Boolean(extracted.category), Boolean(locationData?.address || extracted.location_text), Boolean(extracted.description), Boolean(guestName || user?.name), Boolean(guestContact || user?.phone)].filter(Boolean).length}/5 Complete
              </span>
            </div>

            {/* Rows */}
            <div className="space-y-2 text-sm">
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
              {/* Photo placed directly after Details as requested */}
              <SummaryRow
                label={t('photos')}
                value={photos.length ? `${photos.length} uploaded` : '—'}
                completed={photos.length > 0}
              />
              <SummaryRow
                label={lang === 'mr' ? 'नागरिक' : lang === 'hi' ? 'नागरिक' : 'Citizen Info'}
                value={[guestName || user?.name, guestContact || user?.phone].filter(Boolean).join(' · ') || '—'}
                completed={Boolean((guestName || user?.name) && (guestContact || user?.phone))}
              />
            </div>

            {/* Citizen Details (Name & Contact Number) */}
            <div className="border-t border-[#ebdcc9] pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <User size={13} className="text-[#b85828]" />
                  <span>{lang === 'mr' ? 'आपले नाव व संपर्क' : lang === 'hi' ? 'आपका नाम व संपर्क' : 'Your Name & Contact'}</span>
                </label>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {lang === 'mr' ? 'अधिकारी संपर्कासाठी' : 'For officer follow-up'}
                </span>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <User size={13} />
                  </div>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={lang === 'mr' ? 'आपले पूर्ण नाव (उदा. राहुल देशमुख)' : lang === 'hi' ? 'आपका पूरा नाम (उदा. राहुल देशमुख)' : 'Your Full Name (e.g. Rahul Deshmukh)'}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-[#d6c4aa] rounded-xl bg-[#fbf8f2] text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#b85828] focus:ring-1 focus:ring-[#b85828] focus:outline-none transition-all font-medium"
                  />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Phone size={13} />
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={guestContact}
                    onChange={(e) => setGuestContact(e.target.value.replace(/\D/g, ''))}
                    placeholder={lang === 'mr' ? '१०-अंकी मोबाईल नंबर (उदा. ९८XXXXXXXX)' : lang === 'hi' ? '१०-अंकीय मोबाइल नंबर (उदा. ९८XXXXXXXX)' : '10-Digit Mobile / WhatsApp Number'}
                    className="w-full text-xs pl-8 pr-3 py-2 border border-[#d6c4aa] rounded-xl bg-[#fbf8f2] text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#b85828] focus:ring-1 focus:ring-[#b85828] focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                onClick={checkAndSubmit}
                disabled={!isReadyToSubmit || submitting || checkingNearby}
                className={`w-full flex items-center justify-center gap-2 font-black py-3.5 rounded-2xl transition-all shadow-lg text-sm ${
                  isReadyToSubmit
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 cursor-pointer'
                    : 'bg-[#b85828] hover:bg-[#9c451a] disabled:opacity-40 text-white shadow-[#b85828]/25'
                }`}
              >
                {(submitting || checkingNearby)
                  ? <Loader2 size={16} className="animate-spin" />
                  : <CheckCircle2 size={16} />
                }
                {checkingNearby
                  ? 'Checking nearby…'
                  : submitting
                  ? 'Submitting…'
                  : isReadyToSubmit
                  ? (lang === 'mr' ? 'तक्रार दाखल करा (Submit) ✓' : lang === 'hi' ? 'शिकायत दर्ज करें (Submit) ✓' : 'Submit Complaint ✓')
                  : t('submitComplaint')}
              </button>
              {isReadyToSubmit ? (
                <p className="text-[11px] text-emerald-700 font-bold mt-2 text-center leading-tight">
                  ✓ {lang === 'mr' ? 'सर्व तपशील पूर्ण झाले आहेत. दाखल करण्यासाठी वरील बटण दाबा.' : 'All details ready. Click above to submit.'}
                </p>
              ) : (
                <p className="text-[11px] text-stone-500 mt-2 text-center leading-tight font-medium">
                  {lang === 'mr' ? 'तपशील पूर्ण झाल्यावर हे बटण सक्रिय होईल.' : 'Unlocks once details are completed.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
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
