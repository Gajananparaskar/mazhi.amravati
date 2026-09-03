import React, { createContext, useContext, useState, useMemo } from 'react';

export const LANGS = {
  en: { label: 'English', native: 'English' },
  mr: { label: 'Marathi', native: 'मराठी' },
  hi: { label: 'Hindi', native: 'हिंदी' },
};

const dict = {
  appName: { en: 'Mazhi Amravati', mr: 'माझी अमरावती', hi: 'माझी अमरावती' },
  tagline: { en: 'Your City, Your Responsibility', mr: 'आपलं शहर, आपली जबाबदारी', hi: 'आपका शहर, आपकी जिम्मेदारी' },
  home: { en: 'Home', mr: 'मुखपृष्ठ', hi: 'मुखपृष्ठ' },
  fileComplaint: { en: 'File a Grievance', mr: 'गाऱ्हाणे नोंदवा', hi: 'निवारण / शिकायत दर्ज करें' },
  trackComplaint: { en: 'Track Grievance', mr: 'गाऱ्हाणे तपासा', hi: 'शिकायत / निवारण ट्रैक करें' },
  help: { en: 'Help', mr: 'सहाय्य', hi: 'सहायता' },
  language: { en: 'Language', mr: 'भाषा', hi: 'भाषा' },
  login: { en: 'Login', mr: 'लॉगिन', hi: 'लॉगिन' },
  register: { en: 'Register', mr: 'नोंदणी करा', hi: 'रजिस्टर करें' },
  loginRegister: { en: 'Login / Register', mr: 'लॉगिन / नोंदणी', hi: 'लॉगिन / रजिस्टर' },
  heroTitle1: { en: 'Your Grievance.', mr: 'आपले गाऱ्हाणे.', hi: 'आपकी शिकायत.' },
  heroTitle2: { en: 'Our Responsibility.', mr: 'आमची जबाबदारी.', hi: 'हमारी ज़िम्मेदारी.' },
  heroTitle3: { en: 'Resolved.', mr: 'निवारण.', hi: 'समाधान.' },
  heroGrievanceSub: {
    en: 'File your grievance in your own language. Our AI assistant reads it, routes it to the right department, and keeps you updated until it’s resolved.',
    mr: 'आपल्या भाषेत तक्रार नोंदवा. आमचे AI सहाय्यक ती वाचून योग्य विभागाकडे पाठवेल आणि निवारण होईपर्यंत आपल्याला अपडेट ठेवेल.',
    hi: 'अपनी भाषा में शिकायत दर्ज करें। हमारा AI सहायक इसे पढ़कर सही विभाग को भेजेगा और समाधान होने तक आपको सूचित रखेगा।',
  },
  heroSub: {
    en: 'File your grievance in your own language. Our AI assistant reads it, routes it to the right department, and keeps you updated until it’s resolved.',
    mr: 'आपल्या भाषेत तक्रार नोंदवा. आमचे AI सहाय्यक ती वाचून योग्य विभागाकडे पाठवेल आणि निवारण होईपर्यंत आपल्याला अपडेट ठेवेल.',
    hi: 'अपनी भाषा में शिकायत दर्ज करें। हमारा AI सहायक इसे पढ़कर सही विभाग को भेजेगा और समाधान होने तक आपको सूचित रखेगा।',
  },
  fileGrievance: { en: 'File a Grievance', mr: 'तक्रार नोंदवा', hi: 'शिकायत दर्ज करें' },
  trackGrievance: { en: 'Track Grievance', mr: 'तक्रार ट्रॅक करा', hi: 'शिकायत ट्रैक करें' },
  featSupportLang: { en: 'Support in your language', mr: 'आपल्या भाषेत सहाय्य', hi: 'आपकी भाषा में सहायता' },
  featFastFiling: { en: 'Fast filing & resolution', mr: 'जलद नोंदणी व निवारण', hi: 'त्वरित पंजीकरण व समाधान' },
  featAIAssistant: { en: 'AI assistant 24/7', mr: '२४/७ AI सहाय्यक', hi: '२४/७ AI सहायक' },
  featRealtimeUpdates: { en: 'Real-time updates', mr: 'थेट स्थिती अपडेट', hi: 'रीयल-टाइम अपडेट' },
  featTrackMap: { en: 'Track on live map', mr: 'थेट नकाशावर ट्रॅक करा', hi: 'लाइव मैप पर ट्रैक करें' },
  featSecureReliable: { en: 'Secure & reliable', mr: 'सुरक्षित व विश्वसनीय', hi: 'सुरक्षित व विश्वसनीय' },
  chatBotWelcome1: { en: 'Namaskar! 👍 Welcome to our civic service.', mr: 'नमस्कार! 👍 तुमचं अमरावती सेवेत स्वागत आहे.', hi: 'नमस्कार! 👍 अमरावती सेवा में आपका स्वागत है।' },
  chatBotWelcome2: { en: 'Hi! How can I help you with your civic issue today?', mr: 'मी आज आपल्या कोणत्या नागरी समस्येमध्ये मदत करू?', hi: 'आज मैं आपकी किस नागरिक समस्या में मदद कर सकता हूँ?' },
  chatUserMsg1: { en: 'There is no water in my area.', mr: 'माझ्या परिसरात पाणी येत नाही.', hi: 'मेरे इलाके में पानी नहीं आ रहा है।' },
  chatUserMsg2: { en: 'No water supply for 2 days.', mr: 'गेल्या २ दिवसांपासून पाणीपुरवठा बंद आहे.', hi: 'पिछले 2 दिनों से पानी की आपूर्ति बंद है।' },
  chatBotReply: { en: 'Understood. Routing your complaint to Water Supply Department...', mr: 'समजलं. तुमची तक्रार पाणीपुरवठा विभाग कडे पाठवत आहे...', hi: 'समझ गया। आपकी शिकायत जल आपूर्ति विभाग को भेजी जा रही है...' },
  chatBotStatus: { en: 'AI Assistant • For You 24/7', mr: 'AI सहाय्यक • तुमच्यासाठी २४/७', hi: 'AI सहायक • आपके लिए २४/७' },
  startAsGuest: { en: 'New here? You can start as a guest or', mr: 'नवीन आहात? तुम्ही अतिथी म्हणून सुरू ठेवा किंवा', hi: 'नए हैं? आप अतिथि के रूप में शुरू कर सकते हैं या' },
  chooseLanguage: { en: 'Choose Your Language', mr: 'आपली भाषा निवडा', hi: 'अपनी भाषा चुनें' },
  chooseLanguageSub: { en: 'Select your preferred language to continue', mr: 'पुढे जाण्यासाठी आपली पसंतीची भाषा निवडा', hi: 'आगे बढ़ने के लिए अपनी पसंदीदा भाषा चुनें' },
  dataSecure: { en: 'Your information is secure', mr: 'आपली माहिती सुरक्षित आहे', hi: 'आपकी जानकारी सुरक्षित है' },
  transparent: { en: 'Transparent Process', mr: 'पारदर्शक प्रक्रिया', hi: 'पारदर्शी प्रक्रिया' },
  timelyResolution: { en: 'Timely Resolution', mr: 'वेळेत निराकरण', hi: 'समय पर समाधान' },

  name: { en: 'Full Name', mr: 'पूर्ण नाव', hi: 'पूरा नाम' },
  email: { en: 'Email', mr: 'ईमेल', hi: 'ईमेल' },
  phone: { en: 'Phone Number', mr: 'फोन नंबर', hi: 'फ़ोन नंबर' },
  password: { en: 'Password', mr: 'पासवर्ड', hi: 'पासवर्ड' },
  emailOrPhone: { en: 'Email or Phone', mr: 'ईमेल किंवा फोन', hi: 'ईमेल या फ़ोन' },
  createAccount: { en: 'Create Account', mr: 'खाते तयार करा', hi: 'खाता बनाएं' },
  alreadyHaveAccount: { en: 'Already have an account?', mr: 'आधीच खाते आहे?', hi: 'पहले से खाता है?' },
  noAccount: { en: "Don't have an account?", mr: 'खाते नाही?', hi: 'खाता नहीं है?' },
  continueAsGuest: { en: 'Continue as Guest', mr: 'अतिथी म्हणून सुरू ठेवा', hi: 'अतिथि के रूप में जारी रखें' },

  chatWelcome: {
    en: "Hi! 👋 How can I help you today? Tell me about the civic problem you're facing.",
    mr: 'नमस्कार! 👋 मी तुमची कशी मदत करू शकतो? तुम्हाला येणाऱ्या समस्येबद्दल सांगा.',
    hi: 'नमस्ते! 👋 मैं आपकी कैसे मदद कर सकता हूँ? कृपया अपनी समस्या के बारे में बताएं.',
  },
  typeMessage: { en: 'Type your message...', mr: 'तुमचा संदेश लिहा...', hi: 'अपना संदेश लिखें...' },
  send: { en: 'Send', mr: 'पाठवा', hi: 'भेजें' },
  complaintSummary: { en: 'Grievance Summary', mr: 'गाऱ्हाणे सारांश', hi: 'निवारण सारांश' },
  problemType: { en: 'Problem Type', mr: 'समस्येचा प्रकार', hi: 'समस्या का प्रकार' },
  location: { en: 'Location', mr: 'ठिकाण', hi: 'स्थान' },
  details: { en: 'Details', mr: 'तपशील', hi: 'विवरण' },
  photos: { en: 'Photos', mr: 'फोटो', hi: 'फ़ोटो' },
  addPhotos: { en: 'Add Photos', mr: 'फोटो जोडा', hi: 'फ़ोटो जोड़ें' },
  useMyLocation: { en: 'Use My Location', mr: 'माझे स्थान वापरा', hi: 'मेरा स्थान उपयोग करें' },
  submitComplaint: { en: 'Submit Grievance', mr: 'गाऱ्हाणे दाखल करा', hi: 'निवारण दर्ज करें' },
  newChat: { en: 'Start New Chat', mr: 'नवीन सुरुवात करा', hi: 'नई शुरुआत करें' },
  filedAnonymously: { en: 'File anonymously', mr: 'गाऱ्हाणे गुप्तपणे नोंदवा', hi: 'गुमनाम रूप से दर्ज करें' },

  trackTitle: { en: 'Track Your Grievance', mr: 'आपले गाऱ्हाणे तपासा', hi: 'अपनी शिकायत ट्रैक करें' },
  enterTrackingId: { en: 'Enter your Grievance ID (e.g. AMC-2026-000123)', mr: 'तुमचा गाऱ्हाणे ID टाका (उदा. AMC-2026-000123)', hi: 'अपनी शिकायत / निवारण आईडी दर्ज करें (जैसे AMC-2026-000123)' },
  search: { en: 'Search', mr: 'शोधा', hi: 'खोजें' },
  status: { en: 'Status', mr: 'स्थिती', hi: 'स्थिति' },
  department: { en: 'Department', mr: 'विभाग', hi: 'विभाग' },
  timeline: { en: 'Timeline', mr: 'कालरेषा', hi: 'समयरेखा' },

  officerDashboard: { en: 'Officer Dashboard', mr: 'अधिकारी डॅशबोर्ड', hi: 'अधिकारी डैशबोर्ड' },
  adminDashboard: { en: 'Admin Dashboard', mr: 'प्रशासक डॅशबोर्ड', hi: 'प्रशासक डैशबोर्ड' },
  logout: { en: 'Logout', mr: 'लॉगआउट', hi: 'लॉगआउट' },

  // ── Navbar ────────────────────────────────────────────
  issueMap: { en: 'Issue Map', mr: 'समस्या नकाशा', hi: 'समस्या मानचित्र' },

  // ── Landing page ─────────────────────────────────────
  officialPortal: {
    en: 'Amravati Municipal Corporation — Official Portal',
    mr: 'अमरावती महानगरपालिका — अधिकृत पोर्टल',
    hi: 'अमरावती नगर पालिका — आधिकारिक पोर्टल',
  },
  servicesLabel: { en: 'Services', mr: 'सेवा', hi: 'सेवाएं' },
  servicesTitle: { en: 'File a Grievance By Category', mr: 'श्रेणीनुसार गाऱ्हाणे नोंदवा', hi: 'श्रेणी के अनुसार निवारण दर्ज करें' },
  servicesSub: {
    en: 'Select a category and our AI will guide you through the rest.',
    mr: 'एक श्रेणी निवडा आणि आमचा AI तुम्हाला पुढे मार्गदर्शन करेल.',
    hi: 'एक श्रेणी चुनें और हमारा AI आपको बाकी प्रक्रिया में मार्गदर्शन करेगा.',
  },
  fileComplaintLink: { en: 'File grievance', mr: 'गाऱ्हाणे नोंदवा', hi: 'निवारण दर्ज करें' },
  processLabel: { en: 'Process', mr: 'प्रक्रिया', hi: 'प्रक्रिया' },
  howItWorks: { en: 'How It Works', mr: 'हे कसे कार्य करते', hi: 'यह कैसे काम करता है' },

  // Steps
  step1Title: { en: 'Describe Your Issue', mr: 'तुमची समस्या सांगा', hi: 'अपनी समस्या बताएं' },
  step1Sub: {
    en: 'Chat in English, Marathi, or Hindi — our AI understands you naturally and guides you step by step.',
    mr: 'इंग्रजी, मराठी किंवा हिंदीत संवाद साधा — आमचा AI तुम्हाला स्वाभाविकपणे समजून घेऊन मार्गदर्शन करतो.',
    hi: 'अंग्रेज़ी, मराठी या हिंदी में बात करें — हमारा AI आपको स्वाभाविक रूप से समझकर चरण दर चरण मार्गदर्शन करता है.',
  },
  step2Title: { en: 'Auto-Routed to Department', mr: 'विभागाकडे स्वयंचलित पाठवणी', hi: 'विभाग को स्वतः भेजा गया' },
  step2Sub: {
    en: 'AI instantly categorises your grievance and routes it to the right AMC department.',
    mr: 'AI तुमचे गाऱ्हाणे त्वरित वर्गीकृत करून योग्य AMC विभागाकडे पाठवते.',
    hi: 'AI आपके निवारण को तुरंत वर्गीकृत करके सही AMC विभाग को भेजता है.',
  },
  step3Title: { en: 'Track Live Status', mr: 'थेट स्थिती तपासा', hi: 'लाइव स्थिति ट्रैक करें' },
  step3Sub: {
    en: 'Get a unique Grievance ID and follow every update in real time from submission to resolution.',
    mr: 'एक अनन्य गाऱ्हाणे ID मिळवा आणि सादरणीपासून निराकरणापर्यंत प्रत्येक अपडेट रिअल टाइममध्ये फॉलो करा.',
    hi: 'एक अनोखी निवारण ID पाएं और सबमिशन से समाधान तक हर अपडेट को रियल टाइम में फ़ॉलो करें.',
  },

  // Stats
  stat1Label: { en: 'Grievances Resolved', mr: 'गाऱ्हाणी निराकरण', hi: 'निवारण हल' },
  stat2Label: { en: 'Civic Departments', mr: 'नागरी विभाग', hi: 'नागरिक विभाग' },
  stat3Label: { en: 'Languages', mr: 'भाषा', hi: 'भाषाएं' },
  stat4Label: { en: 'AI Assistance', mr: 'AI सहाय्य', hi: 'AI सहायता' },

  // ── Login / Register ──────────────────────────────────
  citizenLoginPortal: { en: 'Citizen Login Portal', mr: 'नागरिक लॉगिन पोर्टल', hi: 'नागरिक लॉगिन पोर्टल' },
  citizenRegistration: { en: 'Citizen Registration', mr: 'नागरिक नोंदणी', hi: 'नागरिक पंजीकरण' },
  welcomeBack: { en: 'Welcome back', mr: 'पुन्हा स्वागत आहे', hi: 'वापस स्वागत है' },
  signInDesc: { en: 'Sign in to manage your complaints.', mr: 'तुमच्या तक्रारी व्यवस्थापित करण्यासाठी साइन इन करा.', hi: 'अपनी शिकायतें प्रबंधित करने के लिए साइन इन करें.' },
  enterEmailOrPhone: { en: 'Enter email or phone number', mr: 'ईमेल किंवा फोन नंबर टाका', hi: 'ईमेल या फ़ोन नंबर दर्ज करें' },
  enterPassword: { en: 'Enter your password', mr: 'तुमचा पासवर्ड टाका', hi: 'अपना पासवर्ड दर्ज करें' },
  pleaseWait: { en: 'Please wait…', mr: 'कृपया थांबा…', hi: 'कृपया प्रतीक्षा करें…' },
  createAccountTitle: { en: 'Create account', mr: 'खाते तयार करा', hi: 'खाता बनाएं' },
  registerDesc: { en: 'Register to file and track complaints.', mr: 'तक्रारी नोंदवण्यासाठी आणि तपासण्यासाठी नोंदणी करा.', hi: 'शिकायतें दर्ज करने और ट्रैक करने के लिए पंजीकरण करें.' },
  yourFullName: { en: 'Your full name', mr: 'तुमचे पूर्ण नाव', hi: 'आपका पूरा नाम' },
  atLeastOne: { en: 'Provide at least one of email or phone.', mr: 'ईमेल किंवा फोन यापैकी किमान एक द्या.', hi: 'ईमेल या फ़ोन में से कम से कम एक दें.' },
  minPassword: { en: 'Min. 6 characters', mr: 'किमान ६ अक्षरे', hi: 'कम से कम 6 अक्षर' },
  securedBy: { en: 'Secured by Mazhi Amravati', mr: 'माझी अमरावतीद्वारे सुरक्षित', hi: 'माझी अमरावती द्वारा सुरक्षित' },

  // ── Track page ────────────────────────────────────────
  complaintId: { en: 'Complaint ID', mr: 'तक्रार ID', hi: 'शिकायत आईडी' },
  assignedOfficer: { en: 'Assigned Officer', mr: 'नियुक्त अधिकारी', hi: 'नियुक्त अधिकारी' },
  pendingAssignment: { en: 'Pending assignment', mr: 'नियुक्ती प्रलंबित', hi: 'नियुक्ति लंबित' },
  filedOn: { en: 'Filed On', mr: 'दाखल तारीख', hi: 'दर्ज की तारीख' },

  // ── Help page ─────────────────────────────────────────
  helpFaqs: { en: 'Help & FAQs', mr: 'सहाय्य आणि प्रश्नोत्तरे', hi: 'सहायता और सामान्य प्रश्न' },
  helpSubtitle: { en: "We're here 24/7 through our AI assistant.", mr: 'आमचा AI सहाय्यक २४/७ उपलब्ध आहे.', hi: 'हमारा AI सहायक 24/7 उपलब्ध है.' },
  chatWithAI: { en: 'Chat with AI Assistant', mr: 'AI सहाय्यकाशी संवाद', hi: 'AI सहायक से बात करें' },
  fileComplaintNow: { en: 'File a complaint now', mr: 'आत्ता तक्रार नोंदवा', hi: 'अभी शिकायत दर्ज करें' },
  callHelpline: { en: 'Call AMC Helpline', mr: 'AMC हेल्पलाइनला कॉल करा', hi: 'AMC हेल्पलाइन पर कॉल करें' },
  emailUs: { en: 'Email Us', mr: 'आम्हाला ईमेल करा', hi: 'हमें ईमेल करें' },
  faqLabel: { en: 'FAQ', mr: 'प्रश्नोत्तरे', hi: 'सामान्य प्रश्न' },

  faq1q: { en: 'How do I file a complaint?', mr: 'मी तक्रार कशी नोंदवू?', hi: 'मैं शिकायत कैसे दर्ज करूं?' },
  faq1a: {
    en: 'Click "File a Complaint" on the home page and chat naturally with our AI assistant in English, Marathi, or Hindi. It will ask a few quick questions and file the complaint for you.',
    mr: 'मुखपृष्ठावर "तक्रार नोंदवा" वर क्लिक करा आणि इंग्रजी, मराठी किंवा हिंदीत आमच्या AI सहाय्यकाशी संवाद साधा. तो काही प्रश्न विचारेल आणि तुमची तक्रार नोंदवेल.',
    hi: 'होम पेज पर "शिकायत दर्ज करें" पर क्लिक करें और अंग्रेज़ी, मराठी या हिंदी में हमारे AI सहायक से स्वाभाविक बात करें। वह कुछ प्रश्न पूछेगा और आपकी शिकायत दर्ज कर देगा.',
  },
  faq2q: { en: 'Do I need to log in to file a complaint?', mr: 'तक्रार नोंदवण्यासाठी लॉगिन आवश्यक आहे का?', hi: 'क्या शिकायत दर्ज करने के लिए लॉगिन ज़रूरी है?' },
  faq2a: {
    en: 'No. You can file as a guest. Logging in just lets you see all your past complaints in one place.',
    mr: 'नाही. तुम्ही अतिथी म्हणून तक्रार नोंदवू शकता. लॉगिन केल्याने तुमच्या सर्व जुन्या तक्रारी एकाच ठिकाणी पाहता येतात.',
    hi: 'नहीं। आप अतिथि के रूप में शिकायत दर्ज कर सकते हैं। लॉगिन करने से आप अपनी सभी पुरानी शिकायतें एक जगह देख सकते हैं.',
  },
  faq3q: { en: 'How do I track my complaint?', mr: 'मी माझी तक्रार कशी तपासू?', hi: 'मैं अपनी शिकायत कैसे ट्रैक करूं?' },
  faq3a: {
    en: 'Use the "Track Complaint" page and enter the Complaint ID you received after filing (e.g. AMC-2026-000123).',
    mr: '"तक्रार तपासा" पृष्ठ वापरा आणि तक्रार नोंदवल्यानंतर मिळालेला Complaint ID टाका (उदा. AMC-2026-000123).',
    hi: '"शिकायत ट्रैक करें" पेज का उपयोग करें और शिकायत दर्ज करने के बाद मिली Complaint ID दर्ज करें (जैसे AMC-2026-000123).',
  },
  faq4q: { en: 'How long does resolution take?', mr: 'निराकरणास किती वेळ लागतो?', hi: 'समाधान में कितना समय लगता है?' },
  faq4a: {
    en: 'Resolution time depends on the department and issue type, but every complaint is reviewed by a human officer and you can track live status updates.',
    mr: 'निराकरणाचा वेळ विभाग आणि समस्येच्या प्रकारावर अवलंबून असतो, परंतु प्रत्येक तक्रारची एका अधिकाऱ्याद्वारे समीक्षा केली जाते आणि तुम्ही थेट स्थिती अपडेट तपासू शकता.',
    hi: 'समाधान का समय विभाग और समस्या के प्रकार पर निर्भर करता है, लेकिन हर शिकायत की समीक्षा एक मानव अधिकारी द्वारा की जाती है और आप लाइव स्टेटस अपडेट ट्रैक कर सकते हैं.',
  },
  faq5q: { en: 'Can I file in my own language?', mr: 'मी माझ्या स्वतःच्या भाषेत तक्रार नोंदवू शकतो का?', hi: 'क्या मैं अपनी भाषा में शिकायत दर्ज कर सकता हूं?' },
  faq5a: {
    en: 'Yes — the AI assistant chats with you fully in English, Marathi, or Hindi. Switch languages anytime from the top navigation bar.',
    mr: 'हो — AI सहाय्यक तुमच्याशी पूर्णपणे इंग्रजी, मराठी किंवा हिंदीत संवाद साधतो. वरच्या नेव्हिगेशन बारमधून कधीही भाषा बदला.',
    hi: 'हां — AI सहायक आपसे पूरी तरह अंग्रेज़ी, मराठी या हिंदी में बात करता है। शीर्ष नेविगेशन बार से कभी भी भाषा बदलें.',
  },
  faq6q: { en: 'What happens after I file a complaint?', mr: 'तक्रार नोंदवल्यानंतर काय होते?', hi: 'शिकायत दर्ज करने के बाद क्या होता है?' },
  faq6a: {
    en: 'Your complaint is assigned a unique ID, automatically routed to the appropriate AMC department, and assigned to an officer for review and action.',
    mr: 'तुमच्या तक्रारला एक अनन्य ID दिला जातो, ती योग्य AMC विभागाकडे स्वयंचलितपणे पाठवली जाते आणि समीक्षा व कारवाईसाठी एका अधिकाऱ्याकडे सोपवली जाते.',
    hi: 'आपकी शिकायत को एक अनोखी ID दी जाती है, वह स्वतः सही AMC विभाग को भेजी जाती है, और समीक्षा व कार्रवाई के लिए एक अधिकारी को सौंपी जाती है.',
  },

  // ── Footer ────────────────────────────────────────────
  footerDesc: {
    en: 'An AI-powered grievance redressal initiative by Amravati Municipal Corporation, Maharashtra, India.',
    mr: 'अमरावती महानगरपालिका, महाराष्ट्र, भारत यांच्या वतीने AI-चालित तक्रार निवारण उपक्रम.',
    hi: 'अमरावती नगर पालिका, महाराष्ट्र, भारत द्वारा AI-संचालित शिकायत निवारण पहल.',
  },
  quickLinks: { en: 'Quick Links', mr: 'जलद लिंक्स', hi: 'त्वरित लिंक' },
  account: { en: 'Account', mr: 'खाते', hi: 'खाता' },
  officerLogin: { en: 'Officer Login', mr: 'अधिकारी लॉगिन', hi: 'अधिकारी लॉगिन' },
  adminLogin: { en: 'Admin Login', mr: 'प्रशासक लॉगिन', hi: 'प्रशासक लॉगिन' },
  amcServices: { en: 'AMC Services', mr: 'AMC सेवा', hi: 'AMC सेवाएं' },
  footerCopyright: { en: 'Amravati Municipal Corporation. All rights reserved.', mr: 'अमरावती महानगरपालिका. सर्व हक्क राखीव.', hi: 'अमरावती नगर पालिका. सर्वाधिकार सुरक्षित.' },
  govtOfMaharashtra: { en: 'Government of Maharashtra', mr: 'महाराष्ट्र सरकार', hi: 'महाराष्ट्र सरकार' },
  india: { en: 'India', mr: 'भारत', hi: 'भारत' },

  // AMC service links
  amcLink1: { en: 'Official Website', mr: 'अधिकृत संकेतस्थळ', hi: 'आधिकारिक वेबसाइट' },
  amcLink2: { en: 'Property Tax Payment', mr: 'मालमत्ता कर भरणा', hi: 'संपत्ति कर भुगतान' },
  amcLink3: { en: 'Water Tax Payment', mr: 'जलकर भरणा', hi: 'जल कर भुगतान' },
  amcLink4: { en: 'Birth / Death Certificate', mr: 'जन्म / मृत्यू प्रमाणपत्र', hi: 'जन्म / मृत्यु प्रमाणपत्र' },
  amcLink5: { en: 'Building Permission (NOC)', mr: 'बांधकाम परवानगी (NOC)', hi: 'भवन अनुमति (NOC)' },
  amcLink6: { en: 'RTI — Right to Information', mr: 'RTI — माहितीचा अधिकार', hi: 'RTI — सूचना का अधिकार' },

  // ── Officer Dashboard ─────────────────────────────────
  welcomeOfficer: { en: "Welcome, {name}. Here are complaints assigned to your department.", mr: "स्वागत आहे, {name}. तुमच्या विभागाकडे नियुक्त तक्रारी येथे आहेत.", hi: "स्वागत है, {name}। आपके विभाग को सौंपी गई शिकायतें यहाँ हैं." },
  allFilter: { en: 'All', mr: 'सर्व', hi: 'सभी' },
  noComplaintsCategory: { en: 'No complaints in this category.', mr: 'या श्रेणीत कोणत्याही तक्रारी नाहीत.', hi: 'इस श्रेणी में कोई शिकायत नहीं है.' },
  citizen: { en: 'Citizen', mr: 'नागरिक', hi: 'नागरिक' },
  guest: { en: 'Guest', mr: 'अतिथी', hi: 'अतिथि' },
  filed: { en: 'Filed', mr: 'दाखल', hi: 'दर्ज' },
  addNote: { en: 'Add a note (optional)', mr: 'नोंद जोडा (ऐच्छिक)', hi: 'एक नोट जोड़ें (वैकल्पिक)' },
  markAs: { en: 'Mark', mr: 'चिन्हांकित करा', hi: 'चिह्नित करें' },

  // ── Admin Dashboard ───────────────────────────────────
  adminDashboardTitle: { en: 'Admin Dashboard', mr: 'प्रशासक डॅशबोर्ड', hi: 'प्रशासक डैशबोर्ड' },
  overview: { en: 'Overview', mr: 'आढावा', hi: 'अवलोकन' },
  departments: { en: 'Departments', mr: 'विभाग', hi: 'विभाग' },
  officers: { en: 'Officers', mr: 'अधिकारी', hi: 'अधिकारी' },
  allComplaints: { en: 'All Grievances', mr: 'सर्व गाऱ्हाणी', hi: 'सभी शिकायतें' },
  totalComplaints: { en: 'Total Grievances', mr: 'एकूण गाऱ्हाणी', hi: 'कुल शिकायतें' },
  totalCitizens: { en: 'Total Citizens', mr: 'एकूण नागरिक', hi: 'कुल नागरिक' },
  totalOfficers: { en: 'Total Officers', mr: 'एकूण अधिकारी', hi: 'कुल अधिकारी' },
  complaintsByDept: { en: 'Grievances by Department', mr: 'विभागनिहाय गाऱ्हाणी', hi: 'विभाग अनुसार शिकायतें' },
  addDepartment: { en: 'Add Department', mr: 'विभाग जोडा', hi: 'विभाग जोड़ें' },
  adding: { en: 'Adding...', mr: 'जोडत आहे...', hi: 'जोड़ रहे हैं...' },
  departmentOfficers: { en: 'Department Officers', mr: 'विभाग अधिकारी', hi: 'विभाग अधिकारी' },
  addOfficer: { en: 'Add Officer', mr: 'अधिकारी जोडा', hi: 'अधिकारी जोड़ें' },
  active: { en: 'Active', mr: 'सक्रिय', hi: 'सक्रिय' },
  disabled: { en: 'Disabled', mr: 'अक्षम', hi: 'अक्षम' },
  noOfficers: { en: 'No officers yet.', mr: 'अजून कोणते अधिकारी नाहीत.', hi: 'अभी तक कोई अधिकारी नहीं है.' },
  selectDepartment: { en: 'Select department', mr: 'विभाग निवडा', hi: 'विभाग चुनें' },
  allStatuses: { en: 'All statuses', mr: 'सर्व स्थिती', hi: 'सभी स्थितियां' },
  noComplaintsFound: { en: 'No grievances found.', mr: 'कोणतीही गाऱ्हाणी आढळली नाहीत.', hi: 'कोई शिकायत नहीं मिली.' },
  tableId: { en: 'ID', mr: 'ID', hi: 'आईडी' },
  tableCategory: { en: 'Category', mr: 'श्रेणी', hi: 'श्रेणी' },
  tableDepartment: { en: 'Department', mr: 'विभाग', hi: 'विभाग' },
  tableOfficer: { en: 'Officer', mr: 'अधिकारी', hi: 'अधिकारी' },
  tableStatus: { en: 'Status', mr: 'स्थिती', hi: 'स्थिति' },
  tableFiled: { en: 'Filed', mr: 'दाखल', hi: 'दर्ज' },
  tempPassword: { en: 'Temporary password', mr: 'तात्पुरता पासवर्ड', hi: 'अस्थायी पासवर्ड' },
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('amc_lang') || 'en');

  const changeLang = (l) => {
    setLang(l);
    localStorage.setItem('amc_lang', l);
  };

  const t = useMemo(
    () => (key) => {
      const entry = dict[key];
      if (!entry) return key;
      return entry[lang] || entry.en || key;
    },
    [lang]
  );

  const tStatus = (key) => dict.statuses[key]?.[lang] || key;
  const tCategory = (key) => dict.categories[key]?.[lang] || key;

  return (
    <I18nContext.Provider value={{ lang, changeLang, t, tStatus, tCategory }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

const statuses = {
  submitted: { en: 'Submitted', mr: 'सादर केले', hi: 'जमा किया गया' },
  assigned: { en: 'Assigned', mr: 'नियुक्त', hi: 'सौंपा गया' },
  in_progress: { en: 'In Progress', mr: 'प्रगतीपथावर', hi: 'प्रगति पर' },
  resolved: { en: 'Resolved', mr: 'निराकरण झाले', hi: 'हल हो गया' },
  rejected: { en: 'Rejected', mr: 'नाकारले', hi: 'अस्वीकृत' },
};

dict.statuses = statuses;

const categories = {
  water_supply: { en: 'Water Supply', mr: 'पाणीपुरवठा समस्या', hi: 'जल आपूर्ति' },
  roads_potholes: { en: 'Roads / Potholes', mr: 'रस्ते / खड्डे', hi: 'सड़क / गड्ढे' },
  street_light: { en: 'Street Light', mr: 'स्ट्रीट लाईट', hi: 'स्ट्रीट लाइट' },
  garbage_waste: { en: 'Garbage Collection', mr: 'कचरा व्यवस्थापन', hi: 'कचरा प्रबंधन' },
  drainage_sewer: { en: 'Drainage / Sewer', mr: 'गटार / निचरा', hi: 'नाली / सीवर' },
  other: { en: 'Other Issue', mr: 'इतर समस्या', hi: 'अन्य समस्या' },
};

dict.categories = categories;
