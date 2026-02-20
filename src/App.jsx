import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, MapPin, ArrowRight, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, Zap, Coffee, ArrowLeft, Download, 
  TrendingUp, Heart, Settings, LogOut, Mail, Lock, UserPlus, Globe, Trophy, 
  Smartphone, Moon, Check, Flame, CupSoda, Info, BookOpen, Quote, Layers, 
  Map as MapIcon, List, X, Maximize2, Music, ThermometerSnowflake, Leaf, Calendar
} from 'lucide-react';

/**
 * ============================================================
 * 📝 PESSSAGE CONTENT MANAGEMENT (데이터 관리 구역)
 * 수정이 필요할 때 여기 데이터만 바꾸시면 됩니다.
 * (ReferenceError 방지를 위해 철자를 PESSSAGE로 통일했습니다.)
 * ============================================================
 */
const PESSSAGE_CONTENT = {
  // 1. 저널 데이터
  articles: [
    { 
      id: 1, 
      title: "Finding Clarity in the Grey", 
      subtitle: "Season 01: The Mist", 
      category: "ESSAY", 
      date: "2026.02.20", 
      content: "새벽 5시, 세상이 아직 짙은 회색빛 장막 뒤에 숨어 있을 때 우리는 길을 나섭니다. 시야는 불과 5미터 앞을 내다보기 힘들지만, 아이러니하게도 우리는 그 어느 때보다 '선명함'을 느낍니다. 안개는 외부의 소음을 차단하는 천연 소음기입니다. 이 정적 속에서 달리기는 단순한 운동을 넘어 하나의 움직이는 명상이 됩니다.",
      excerpt: "안개는 시야를 가리지만, 대신 발끝의 감각을 선명하게 만듭니다." 
    }
  ],

  // 2. 루트 데이터 (지도 및 리스트)
  routes: [
    { id: 'orig-1', type: 'ORIGINAL', region: 'SEOUL', name: "Espresso Run", location: "Hannam, Seoul", distance: "5.0km", lat: 37.534, lng: 127.002, description: "새벽의 정적을 뚫고 한남동을 달립니다. 코스의 끝에는 에스프레소 바가 기다립니다.", icon: Coffee },
    { id: 'orig-2', type: 'ORIGINAL', region: 'SEOUL', name: "Sauna Run", location: "Inwangsan, Seoul", distance: "8.5km", lat: 37.581, lng: 126.956, description: "트레일 완주 후 사우나로 직행하여 근육의 긴장을 해소합니다.", icon: Flame },
    { id: 'orig-3', type: 'ORIGINAL', region: 'SEOUL', name: "Tea Ritual Run", location: "Bukchon, Seoul", distance: "6.2km", lat: 37.582, lng: 126.984, description: "고궁의 담벼락을 따라 달리며 마음을 정돈하고 따뜻한 차를 마십니다.", icon: Leaf },
    { id: 'orig-4', type: 'ORIGINAL', region: 'SEOUL', name: "Vinyl Recovery Run", location: "Seongsu, Seoul", distance: "7.0km", lat: 37.544, lng: 127.056, description: "성수동 거리를 달린 후 바이닐 바에서 감각적인 음악과 함께 회복합니다.", icon: Music },
    { id: 'trail-1', type: 'TRAIL', region: 'SEOUL', name: "Misty Hidden Wall", location: "Bukhansan, Seoul", distance: "12.4km", lat: 37.649, lng: 126.979, description: "북한산의 거친 암릉 코스." },
    { id: 'trail-2', type: 'TRAIL', region: 'JEJU', name: "Volcanic Coast Trail", location: "Olle 7, Jeju", distance: "17.6km", lat: 33.242, lng: 126.541, description: "현무암 바다를 끼고 달리는 제주 트레일." },
    { id: 'road-1', type: 'ROAD', region: 'SEOUL', name: "City Pulse Line", location: "Banpo, Seoul", distance: "8.2km", lat: 37.511, lng: 126.996, description: "한강의 밤바람을 느끼는 시티런." },
    { id: 'road-2', type: 'ROAD', region: 'GYEONGGI', name: "Central Park Loop", location: "Songdo, Incheon", distance: "6.5km", lat: 37.392, lng: 126.639, description: "미래지향적 건축물 사이의 로드 코스." }
  ],

  // 3. 기어 데이터
  gearItems: [
    { id: 1, name: "Portal Shield Shell", brand: "PORTAL", category: "TRAIL", note: "안개가 자욱한 능선에서도 체온을 유지해준 유일한 장비.", imageLabel: "[트레일 재킷]" },
    { id: 2, name: "Carbon Pulse v2", brand: "PESSAGE", category: "ROAD", note: "도심을 가를 때 필요한 정교함.", imageLabel: "[로드 슈즈]" },
    { id: 3, name: "Recovery Electrolyte", brand: "PESSAGE", category: "NUTRITION", note: "달린 후의 회복은 무엇을 먹느냐에서 시작됩니다.", imageLabel: "[뉴트리션]" },
    { id: 4, name: "Peak Hydration Gel", brand: "MAUTEN", category: "NUTRITION", note: "한계에 다다랐을 때 필요한 에너지의 순도.", imageLabel: "[에너지 젤]" }
  ],

  // 4. 세션(대회) 데이터
  races: [
    { id: 'r-1', name: 'Trans Jeju 100K', date: '2026-10-12', type: 'TRAIL', description: '한국 최대의 울트라 트레일 대제전.' },
    { id: 'r-2', name: 'UTMB Mont-Blanc', date: '2026-08-28', type: 'TRAIL', description: '트레일 러너들의 성지, 알프스 몽블랑 일주.' },
    { id: 'r-3', name: 'Seoul Marathon', date: '2026-03-15', type: 'ROAD', description: '서울의 심장을 관통하는 역사적인 레이스.' }
  ]
};

// --- 글로벌 테마 및 컬러 ---
const colors = {
  bg: 'bg-[#121212]',
  card: 'bg-[#1c1c1c]',
  border: 'border-[#262626]',
  trail: { accent: 'text-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/30', pin: '#fb923c' },
  road: { accent: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/30', pin: '#60a5fa' },
  original: { accent: 'text-white', bg: 'bg-white/5', border: 'border-white/30', pin: '#ffffff' }
};

const getApiKey = () => {
  try { return import.meta.env.VITE_GEMINI_API_KEY || ""; } catch (e) { return ""; }
};
const apiKey = getApiKey();

export default function App() {
  // --- UI & User States ---
  const [activeTab, setActiveTab] = useState('journal');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userStats] = useState({ score: 84, mileage: "32.4k", level: "Intermediate" });
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // --- Filters & Map States ---
  const [routeViewMode, setRouteViewMode] = useState('LIST'); 
  const [routeTypeFilter, setRouteTypeFilter] = useState('ALL');
  const [routeRegionFilter, setRouteRegionFilter] = useState('ALL');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapPopup, setMapPopup] = useState(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerGroupRef = useRef(null);
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [gearFilter, setGearFilter] = useState('ALL');

  // --- Interaction States ---
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeAiTarget, setActiveAiTarget] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // --- Helpers ---
  const getTypeColor = (type) => {
    switch(type) {
      case 'TRAIL': return colors.trail.accent;
      case 'ROAD': return colors.road.accent;
      case 'ORIGINAL': return colors.original.accent;
      default: return 'text-white';
    }
  };

  const getTypeBorder = (type) => {
    switch(type) {
      case 'TRAIL': return colors.trail.border;
      case 'ROAD': return colors.road.border;
      case 'ORIGINAL': return colors.original.border;
      default: return 'border-white/30';
    }
  };

  const groupedRaces = () => {
    const filtered = PESSSAGE_CONTENT.races.filter(r => raceTypeFilter === 'ALL' || r.type === raceTypeFilter);
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = {};
    sorted.forEach(race => {
      const month = new Date(race.date).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[month]) groups[month] = [];
      groups[month].push(race);
    });
    return groups;
  };

  // --- Effects ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js'; script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setIsMapLoaded(true);
      document.head.appendChild(script);
    } else { setIsMapLoaded(true); }
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeTab === 'routes' && routeViewMode === 'MAP' && isMapLoaded && mapRef.current) {
      const L = window.L;
      if (!leafletMap.current) {
        const map = L.map(mapRef.current, { center: [36.5, 127.8], zoom: 7, zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        leafletMap.current = map;
        markerGroupRef.current = L.layerGroup().addTo(map);
      }
      updateMapMarkers();
    } else if (leafletMap.current && (activeTab !== 'routes' || routeViewMode !== 'MAP')) {
      leafletMap.current.remove(); leafletMap.current = null; markerGroupRef.current = null;
    }
  }, [activeTab, routeViewMode, isMapLoaded, routeTypeFilter, routeRegionFilter]);

  const updateMapMarkers = () => {
    if (!leafletMap.current || !markerGroupRef.current) return;
    const L = window.L;
    markerGroupRef.current.clearLayers();
    const filtered = PESSSAGE_CONTENT.routes.filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && (routeRegionFilter === 'ALL' || r.region === routeRegionFilter));
    if (filtered.length > 0) {
      const bounds = L.latLngBounds();
      filtered.forEach(route => {
        const pinColor = route.type === 'TRAIL' ? colors.trail.pin : route.type === 'ROAD' ? colors.road.pin : colors.original.pin;
        const customIcon = L.divIcon({ className: 'custom-pin', html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #121212;"></div>` });
        const marker = L.marker([route.lat, route.lng], { icon: customIcon }).addTo(markerGroupRef.current);
        marker.on('click', () => setMapPopup(route));
        bounds.extend([route.lat, route.lng]);
      });
      if (routeRegionFilter !== 'ALL') leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // --- Handlers ---
  const handleLogout = () => { setIsLoggedIn(false); setIsProfileOpen(false); setActiveTab('journal'); setAuthMode(null); setIsWatchConnected(false); };
  const handleAuthSubmit = (e) => { e.preventDefault(); setIsAiLoading(true); setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); }, 1000); };
  const handleSyncToWatch = (id) => { if(!isLoggedIn) { setAuthMode('login'); return; } setIsSyncing(true); setTimeout(() => { setIsSyncing(false); setSyncSuccess(true); setIsWatchConnected(true); setTimeout(() => setSyncSuccess(false), 3000); }, 1500); };

  const generateRaceStrategy = async (raceName) => {
    if (!isLoggedIn) { setAuthMode('login'); return; }
    if (!apiKey) { setAiResponse("API 키 설정이 필요합니다."); return; }
    setActiveAiTarget(raceName); setIsAiLoading(true);
    const prompt = `사용자 리커버리 ${userStats.score}, 마일리지 ${userStats.mileage}. 대회 '${raceName}'의 최적 전략을 조언해줘.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: "당신은 PESSAGE 매거진의 수석 에디터입니다." }] } })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "분석 실패");
    } catch (e) { setAiResponse("AI 연결 실패"); } finally { setIsAiLoading(false); }
  };

  const generateRecoveryPlan = async () => {
    if (!apiKey) { setAiResponse("API 키 설정이 필요합니다."); return; }
    setIsAiLoading(true);
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `현재 점수 ${userStats.score}. 오늘 러닝 후 회복 리추얼 제안.` }] }] })
      });
      const data = await resp.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "분석 실패");
    } catch (e) { setAiResponse("AI 오류"); } finally { setIsAiLoading(false); }
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setSelectedArticle(null); setSelectedRoute(null); setIsProfileOpen(false); setAiResponse(null); setAuthMode(null); setMapPopup(null); }} 
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === id && !isProfileOpen && !authMode ? 'text-white' : 'text-[#525252] hover:text-white'}`}
    >
      <Icon size={20} strokeWidth={activeTab === id && !isProfileOpen && !authMode ? 2.5 : 1.5} />
      <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
    </button>
  );

  return (
    <div className={`min-h-screen ${colors.bg} text-white font-sans selection:bg-white selection:text-black`}>
      <style>{`.leaflet-container { background: #121212 !important; } .custom-pin { display: flex; align-items: center; justify-content: center; }`}</style>
      
      <header className={`fixed top-0 w-full z-[1000] transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.2em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setIsProfileOpen(false); setAuthMode(null);}}>PESSAGE</h1>
        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <>
              <div className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border ${isWatchConnected ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-[#525252]'}`}>{isWatchConnected ? 'SYNCED' : 'DISCONNECTED'}</div>
              <button onClick={() => {setIsProfileOpen(!isProfileOpen); setAuthMode(null);}} className={`p-1 transition-all ${isProfileOpen ? 'text-white scale-110' : 'text-[#a3a3a3]'}`}><User size={22} /></button>
            </>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[11px] uppercase bg-white text-black px-5 py-2 rounded-full font-bold shadow-lg transition-transform active:scale-95">JOIN</button>
          )}
        </div>
      </header>

      <main className="pb-32">
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto animate-in fade-in text-center">
             <h2 className="text-3xl font-light italic mb-10 text-white">Membership</h2>
             <form onSubmit={handleAuthSubmit} className="space-y-4 mb-10">
                <input type="email" placeholder="EMAIL" className="w-full bg-[#1c1c1c] border border-[#262626] py-4 px-4 text-[10px] tracking-widest outline-none focus:border-white/30 transition-colors" required />
                <input type="password" placeholder="PASSWORD" className="w-full bg-[#1c1c1c] border border-[#262626] py-4 px-4 text-[10px] tracking-widest outline-none focus:border-white/30 transition-colors" required />
                <button type="submit" className="w-full bg-white text-black py-4 font-bold text-[12px] uppercase tracking-widest active:scale-95 transition-transform">Login</button>
             </form>
             <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#444] mb-6">Or continue with</p>
                <div className="grid grid-cols-1 gap-3">
                   <button onClick={handleAuthSubmit} className="w-full py-3 bg-[#FEE500] text-black text-[10px] font-bold tracking-widest rounded-sm shadow-lg">KAKAO</button>
                   <button onClick={handleAuthSubmit} className="w-full py-3 bg-[#03C75A] text-white text-[10px] font-bold tracking-widest rounded-sm shadow-lg">NAVER</button>
                   <button onClick={handleAuthSubmit} className="w-full py-3 bg-white text-black text-[10px] font-bold tracking-widest border border-white/10 rounded-sm shadow-lg">GOOGLE</button>
                </div>
             </div>
             <button onClick={() => setAuthMode(null)} className="mt-12 text-[10px] uppercase text-[#444] hover:text-white transition-colors underline underline-offset-4">Cancel</button>
          </section>
        ) : isProfileOpen && isLoggedIn ? (
          <section className="pt-28 px-6 max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-light italic mb-8">Patrick Park</h2>
             <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-[#1c1c1c] p-6 border border-white/5"><p className="text-[10px] text-[#525252] uppercase mb-1">Score</p><span className="text-3xl font-light">{userStats.score}</span></div>
                <div className="bg-[#1c1c1c] p-6 border border-white/5"><p className="text-[10px] text-[#525252] uppercase mb-1">Weekly Mileage</p><span className="text-3xl font-light">{userStats.mileage}</span></div>
             </div>
             <button onClick={handleLogout} className="w-full py-4 border border-[#262626] text-[#c2410c] text-[10px] uppercase tracking-widest hover:bg-[#c2410c]/5 transition-colors">LOGOUT SESSION</button>
          </section>
        ) : (
          <>
            {activeTab === 'journal' && (
              <section className="animate-in fade-in">
                {selectedArticle ? (
                  <div className="pt-28 px-6 max-w-2xl mx-auto">
                    <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#737373] text-[10px] uppercase tracking-widest mb-10 hover:text-white"><ArrowLeft size={14} /> Back</button>
                    <h2 className="text-4xl font-light italic mb-8 leading-tight">{selectedArticle.title}</h2>
                    <p className="text-lg leading-relaxed text-[#d4d4d4] font-light whitespace-pre-line mb-20">{selectedArticle.content}</p>
                  </div>
                ) : (
                  <div className="relative h-[85vh] w-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-[12px] tracking-[0.4em] uppercase mb-4 text-[#a3a3a3]">Season 01: The Mist</p>
                      <h2 className="text-5xl md:text-7xl font-light italic tracking-tight leading-tight mb-12">Finding Clarity <br/> in the Grey.</h2>
                      <button onClick={() => setSelectedArticle(PESSSAGE_CONTENT.articles[0])} className="text-[11px] uppercase tracking-[0.3em] border-b border-white/30 pb-1 hover:border-white transition-colors">Read Journal</button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'routes' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                {selectedRoute ? (
                  <div className="animate-in fade-in max-w-2xl mx-auto">
                    <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[#737373] text-xs uppercase mb-10 hover:text-white transition-colors"><ArrowLeft size={14} /> Back</button>
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <span className={`text-[10px] px-3 py-1 rounded-full border mb-3 inline-block uppercase font-bold tracking-widest ${getTypeBorder(selectedRoute.type)} ${getTypeColor(selectedRoute.type)}`}>{selectedRoute.type}</span>
                        <h2 className="text-4xl font-light italic leading-tight">{selectedRoute.name}</h2>
                        <p className="text-[#737373] text-sm mt-1">{selectedRoute.location}</p>
                      </div>
                      <p className="text-2xl font-light tracking-tighter">{selectedRoute.distance}</p>
                    </div>
                    <p className="text-lg leading-relaxed text-[#d4d4d4] font-light mb-16">{selectedRoute.description}</p>
                    <button onClick={() => handleSyncToWatch(selectedRoute.id)} className={`w-full py-4 rounded-full text-[12px] uppercase font-bold transition-all ${syncSuccess ? 'bg-green-600' : 'bg-white text-black'}`}>
                      {isSyncing ? 'SYNCING...' : syncSuccess ? 'Synced' : 'Sync to Device'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
                      <div><h2 className="text-3xl font-light italic mb-2">Narrative Explorer</h2><p className="text-[#737373] text-sm italic">지도로 탐색하는 러너의 여정.</p></div>
                      <div className="flex bg-[#1c1c1c] p-1 rounded-full border border-white/5">
                        <button onClick={() => setRouteViewMode('LIST')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${routeViewMode === 'LIST' ? 'bg-white text-black' : 'text-[#525252]'}`}>List</button>
                        <button onClick={() => setRouteViewMode('MAP')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${routeViewMode === 'MAP' ? 'bg-white text-black' : 'text-[#525252]'}`}>Map</button>
                      </div>
                    </div>
                    <div className="flex gap-6 border-b border-white/5 pb-4 mb-6 overflow-x-auto whitespace-nowrap">
                      {['ALL', 'SEOUL', 'JEJU', 'GYEONGGI'].map(r => (
                        <button key={r} onClick={() => setRouteRegionFilter(r)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${routeRegionFilter === r ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{r}</button>
                      ))}
                    </div>
                    {routeViewMode === 'MAP' ? (
                      <div ref={mapRef} className="w-full aspect-[4/5] md:aspect-[16/9] bg-[#121212] rounded-sm overflow-hidden shadow-2xl relative border border-white/5">
                        {mapPopup && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-black border border-white/20 p-5 rounded-sm shadow-2xl z-[2000] text-center animate-in zoom-in-95">
                              <p className={`text-[8px] uppercase tracking-widest mb-1 font-bold ${getTypeColor(mapPopup.type)}`}>{mapPopup.type}</p>
                              <h4 className="text-xl font-light italic mb-6 leading-tight">{mapPopup.name}</h4>
                              <button onClick={() => setSelectedRoute(mapPopup)} className="w-full py-3 bg-white text-black text-[9px] uppercase font-bold tracking-widest">Explore</button>
                              <button onClick={() => setMapPopup(null)} className="mt-4 text-[10px] text-[#444] uppercase hover:text-white transition-colors">Close</button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {PESSSAGE_CONTENT.routes.filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && (routeRegionFilter === 'ALL' || r.region === routeRegionFilter)).map(route => (
                          <div key={route.id} onClick={() => setSelectedRoute(route)} className="p-6 bg-[#1c1c1c] border border-white/5 rounded-sm flex justify-between items-center cursor-pointer hover:border-white/20 transition-all group">
                             <div>
                                <p className={`text-[9px] uppercase font-bold mb-1 tracking-widest ${getTypeColor(route.type)}`}>{route.type} / {route.location}</p>
                                <h4 className="text-xl font-light italic group-hover:text-white transition-colors">{route.name}</h4>
                             </div>
                             <span className="text-2xl font-light tracking-tighter group-hover:text-white transition-colors">{route.distance}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {activeTab === 'sessions' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                <div className="mb-12">
                  <h2 className="text-3xl font-light italic mb-6">Race & Narrative</h2>
                  <div className="flex gap-6 border-b border-white/5 pb-4 mb-10 overflow-x-auto">
                    {['ALL', 'TRAIL', 'ROAD'].map(type => (
                      <button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${raceTypeFilter === type ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040] hover:text-white'}`}>{type}</button>
                    ))}
                  </div>
                </div>
                {Object.entries(groupedRaces()).map(([month, monthRaces]) => (
                  <div key={month} className="mb-20">
                    <div className="flex items-center gap-4 mb-8">
                      <Calendar size={14} className="text-[#404040]" />
                      <h3 className="text-[11px] uppercase tracking-[0.4em] font-bold text-[#525252]">{month}</h3>
                      <div className="h-[1px] bg-white/5 flex-1"></div>
                    </div>
                    <div className="space-y-12">
                      {monthRaces.map(race => (
                        <div key={race.id} className="group border-l border-white/5 pl-8 relative">
                          <div className={`absolute left-[-4px] top-0 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                          <h4 className="text-3xl font-light italic mb-4">{race.name}</h4>
                          <p className="text-sm text-[#a3a3a3] font-light max-w-xl mb-6">{race.description}</p>
                          <button onClick={() => generateRaceStrategy(race.name)} className="flex items-center gap-2 bg-white/10 px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                            {isAiLoading && activeAiTarget === race.name ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12}/>} AI Strategy
                          </button>
                          {activeAiTarget === race.name && aiResponse && !isAiLoading && <div className="mt-6 p-6 bg-white/5 border border-white/10 italic text-sm text-[#d4d4d4] animate-in fade-in leading-relaxed">"{aiResponse}"</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {activeTab === 'gear' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                <div className="mb-12">
                  <h2 className="text-3xl font-light italic mb-6">Essential Tools</h2>
                  <div className="flex gap-6 border-b border-white/5 pb-4 mb-12 overflow-x-auto">
                    {['ALL', 'TRAIL', 'ROAD', 'NUTRITION'].map(cat => (
                      <button key={cat} onClick={() => setGearFilter(cat)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${gearFilter === cat ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040] hover:text-white'}`}>{cat}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-16">
                  {PESSSAGE_CONTENT.gearItems.filter(item => gearFilter === 'ALL' || item.category === gearFilter).map(item => (
                      <div key={item.id} className="group flex flex-col animate-in fade-in">
                        <div className="aspect-[4/5] bg-[#1c1c1c] border border-white/5 rounded-sm flex items-center justify-center mb-5 overflow-hidden group-hover:border-white/20 transition-all cursor-pointer">
                          <span className="text-[8px] text-[#333] uppercase tracking-widest italic font-serif">{item.imageLabel || "Product Visual"}</span>
                        </div>
                        <div className="flex flex-col">
                           <p className={`text-[8px] uppercase font-bold tracking-widest mb-1 ${item.category === 'TRAIL' ? 'text-orange-400' : item.category === 'ROAD' ? 'text-blue-400' : 'text-green-500'}`}>{item.category} / {item.brand}</p>
                           <h3 className="text-sm font-medium italic mb-2 group-hover:text-white transition-colors">{item.name}</h3>
                           <p className="text-[10px] text-[#737373] leading-relaxed line-clamp-3 italic">"{item.note}"</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {activeTab === 'recovery' && (
              <section className="px-6 pt-28 max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-light italic mb-10 text-center">Recovery Ritual</h2>
                {isLoggedIn && isWatchConnected ? (
                  <div className="animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                       <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center rounded-sm shadow-xl"><p className="text-[10px] uppercase mb-4 text-[#737373] tracking-widest font-bold">Recovery Score</p><div className="text-6xl font-light mb-2">{userStats.score}</div><p className="text-[9px] text-green-400 uppercase font-bold tracking-widest">Optimal</p></div>
                       <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center rounded-sm shadow-xl"><p className="text-[10px] uppercase mb-4 text-[#737373] tracking-widest font-bold">Sleep Quality</p><div className="text-5xl font-light">{userStats.score + 4}%</div></div>
                       <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center rounded-sm shadow-xl"><p className="text-[10px] uppercase mb-4 text-[#737373] tracking-widest font-bold">Fatigue</p><div className="text-4xl font-light italic">Low</div></div>
                    </div>
                    <button onClick={generateRecoveryPlan} className="w-full py-4 bg-white text-black font-bold uppercase text-[12px] tracking-[0.2em] active:scale-[0.98] transition-transform">
                      {isAiLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Get AI Ritual'}
                    </button>
                    {aiResponse && <div className="mt-8 text-sm italic text-[#d4d4d4] border-t border-white/5 pt-6 animate-in slide-in-from-bottom-2 leading-relaxed">"{aiResponse}"</div>}
                  </div>
                ) : (
                  <div className="text-center py-24 border border-dashed border-white/10 rounded-sm">
                    <Zap size={40} className="mx-auto mb-6 text-[#333]"/>
                    <p className="text-sm text-[#737373] mb-8 leading-relaxed">{!isLoggedIn ? '개인화된 회복 리추얼을 확인하려면\n로그인이 필요합니다.' : '워치 데이터를 동기화하여\n오늘의 컨디션을 분석하세요.'}</p>
                    <button onClick={() => !isLoggedIn ? setAuthMode('login') : setIsWatchConnected(true)} className="px-12 py-3 bg-white text-black font-bold text-[11px] uppercase tracking-widest rounded-full active:scale-95 transition-transform shadow-xl">{!isLoggedIn ? 'Login to Access' : 'Connect COROS'}</button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 w-full z-[1001] px-10 py-6 bg-black/95 backdrop-blur-xl border-t border-[#262626] flex justify-between items-center shadow-2xl transition-transform duration-500">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
