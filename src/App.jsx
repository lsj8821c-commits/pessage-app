import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, MapPin, ArrowRight, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, Zap, Coffee, ArrowLeft, Download, 
  TrendingUp, Heart, Settings, LogOut, Mail, Lock, UserPlus, Globe, Trophy, 
  Smartphone, Moon, Check, Flame, CupSoda, Info, BookOpen, Quote, Layers, 
  Map as MapIcon, List, X, Maximize2, Music, ThermometerSnowflake, Leaf, Calendar,
  Smartphone as WatchIcon, RefreshCw
} from 'lucide-react';

/**
 * ============================================================
 * ☁️ SANITY CMS CONFIGURATION (Project ID: 1pnkcp2x)
 * ============================================================
 */
const SANITY_CONFIG = {
  projectId: "1pnkcp2x", 
  dataset: "production",
  apiVersion: "2024-02-20",
  useCdn: true,
};

/**
 * 🔑 API Key Secure Access (Vercel 환경 변수 연동)
 */
const getSafeApiKey = () => {
  try {
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getSafeApiKey();

// CMS 데이터 로딩 전 보여줄 기본 데이터 (백업/로딩용)
const INITIAL_CONTENT = {
  articles: [
    { 
      id: 1, 
      title: "Finding Clarity in the Grey", 
      subtitle: "Season 01: The Mist", 
      category: "ESSAY", 
      date: "2026.02.20", 
      content: "데이터를 불러오는 중입니다...",
      excerpt: "안개는 시야를 가리지만, 대신 발끝의 감각을 선명하게 만듭니다." 
    }
  ],
  routes: [
    { id: 'loading', type: 'ORIGINAL', region: 'SEOUL', name: "Loading Routes...", location: "Updating...", distance: "0.0km", lat: 37.5665, lng: 126.9780, description: "Sanity에서 데이터를 가져오고 있습니다.", icon: Coffee }
  ],
  gearItems: [],
  races: [
    { id: 'r-1', name: 'Trans Jeju 100K', date: '2026-10-12', type: 'TRAIL', description: '한국 최대의 울트라 트레일 대제전.' },
    { id: 'r-2', name: 'UTMB Mont-Blanc', date: '2026-08-28', type: 'TRAIL', description: '트레일 러너들의 성지.' },
    { id: 'r-3', name: 'Seoul Marathon', date: '2026-03-15', type: 'ROAD', description: '역사적인 서울 로드 레이스.' }
  ],
  watchBrands: [
    { id: 'garmin', name: 'Garmin', color: '#00a6da' },
    { id: 'coros', name: 'COROS', color: '#f97316' },
    { id: 'apple', name: 'Apple Watch', color: '#ffffff' }
  ]
};

const colors = {
  bg: 'bg-[#121212]',
  card: 'bg-[#1c1c1c]',
  border: 'border-[#262626]',
  trail: { accent: 'text-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/30', pin: '#fb923c' },
  road: { accent: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/30', pin: '#60a5fa' },
  original: { accent: 'text-white', bg: 'bg-white/5', border: 'border-white/30', pin: '#ffffff' }
};

export default function App() {
  // --- States ---
  const [siteContent, setSiteContent] = useState(INITIAL_CONTENT);
  const [activeTab, setActiveTab] = useState('journal');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userStats, setUserStats] = useState({ score: 84, mileage: "32.4k", level: "Intermediate" });
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null); 
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeViewMode, setRouteViewMode] = useState('LIST'); 
  const [routeTypeFilter, setRouteTypeFilter] = useState('ALL');
  const [routeRegionFilter, setRouteRegionFilter] = useState('ALL');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapPopup, setMapPopup] = useState(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerGroupRef = useRef(null);
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [socialTarget, setSocialTarget] = useState("");

  /**
   * 🔄 SANITY REAL-TIME DATA FETCHING
   * Sanity API를 통해 직접 데이터를 요청합니다.
   */
  useEffect(() => {
    const fetchCmsData = async () => {
      // GROQ 쿼리: 저널, 루트, 기어 데이터를 한 번에 요청
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "route"],
        "gearItems": *[_type == "gear"]
      }`);
      
      const url = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${query}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.result) {
          setSiteContent(prev => ({
            ...prev,
            articles: data.result.articles.length > 0 ? data.result.articles : prev.articles,
            routes: data.result.routes.length > 0 ? data.result.routes : prev.routes,
            gearItems: data.result.gearItems.length > 0 ? data.result.gearItems : prev.gearItems,
          }));
          console.log("PESSAGE CMS Sync Complete.");
        }
      } catch (error) {
        console.error("CMS Sync Error: ", error);
      }
    };

    fetchCmsData();
  }, []);

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
    const filtered = siteContent.races.filter(r => raceTypeFilter === 'ALL' || r.type === raceTypeFilter);
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = {};
    sorted.forEach(race => {
      const month = new Date(race.date).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[month]) groups[month] = [];
      groups[month].push(race);
    });
    return groups;
  };

  // --- Effects for UI & Map ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link'); link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(link);
    }
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script'); script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true; script.onload = () => setIsMapLoaded(true);
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
    const filtered = siteContent.routes.filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && (routeRegionFilter === 'ALL' || r.region === routeRegionFilter));
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
  const handleSocialLogin = (platform) => {
    setIsAiLoading(true); setSocialTarget(platform.toUpperCase());
    setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); setSocialTarget(""); if(platform === 'google') setUserStats({ score: 92, mileage: "45.0k", level: "Elite" }); }, 1500);
  };
  const handleLogout = () => { setIsLoggedIn(false); setIsProfileOpen(false); setActiveTab('journal'); setAuthMode(null); setIsWatchConnected(false); setConnectedDevice(null); };
  const handleAuthSubmit = (e) => { e.preventDefault(); setIsAiLoading(true); setSocialTarget("PESSAGE Account"); setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); setSocialTarget(""); }, 1200); };
  const connectDevice = (brand) => { setIsAiLoading(true); setSocialTarget(`${brand.toUpperCase()} Sync`); setTimeout(() => { setConnectedDevice(brand); setIsWatchConnected(true); setIsWatchModalOpen(false); setIsAiLoading(false); setSocialTarget(""); }, 1500); };

  const generateRecoveryPlan = async () => {
    if (!apiKey) { setAiResponse("환경 변수 인식이 필요합니다. Vercel 배포 시 꼭 Redeploy를 해주세요."); return; }
    setIsAiLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `현재 리커버리 점수 ${userStats.score}. 러너를 위한 정밀 리커버리 리추얼 조언해줘.` }] }] })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "분석 실패");
    } catch (e) { setAiResponse("AI 연결 오류"); } finally { setIsAiLoading(false); }
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
      
      {/* Device Connection Modal */}
      {isWatchModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-sm w-full bg-[#1c1c1c] border border-white/10 p-8 rounded-sm shadow-2xl">
            <h3 className="text-xl font-light italic mb-8 text-center text-white">Connect Device</h3>
            <div className="space-y-3">
              {siteContent.watchBrands.map(brand => (
                <button key={brand.id} onClick={() => connectDevice(brand.id)} className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">{brand.name}</span>
                  <ChevronRight size={14} className="text-[#525252]" />
                </button>
              ))}
            </div>
            <button onClick={() => setIsWatchModalOpen(false)} className="w-full mt-10 text-[9px] uppercase tracking-widest text-[#444] hover:text-white">Close</button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isAiLoading && socialTarget && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 size={32} className="animate-spin text-white mb-6" />
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold tracking-widest">{socialTarget} AUTHENTICATING...</p>
        </div>
      )}

      <header className={`fixed top-0 w-full z-[1000] transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.2em] italic cursor-pointer text-white" onClick={() => {setActiveTab('journal'); setIsProfileOpen(false); setAuthMode(null);}}>PESSAGE</h1>
        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <>
              <div className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border ${isWatchConnected ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-[#525252]'}`}>
                {isWatchConnected ? `${connectedDevice?.toUpperCase()}` : 'DISCONNECTED'}
              </div>
              <button onClick={() => {setIsProfileOpen(!isProfileOpen); setAuthMode(null);}} className={`p-1 transition-all ${isProfileOpen ? 'text-white scale-110' : 'text-[#a3a3a3]'}`}><User size={22} /></button>
            </>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[11px] uppercase bg-white text-black px-5 py-2 rounded-full font-bold shadow-lg">JOIN</button>
          )}
        </div>
      </header>

      <main className="pb-32">
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto animate-in fade-in text-center">
             <h2 className="text-3xl font-light italic mb-10 text-white">Membership</h2>
             <form onSubmit={handleAuthSubmit} className="space-y-4 mb-10">
                <input type="email" placeholder="EMAIL" className="w-full bg-[#1c1c1c] border border-[#262626] py-4 px-4 text-[10px] tracking-widest outline-none focus:border-white/30 transition-colors text-white" required />
                <input type="password" placeholder="PASSWORD" className="w-full bg-[#1c1c1c] border border-[#262626] py-4 px-4 text-[10px] tracking-widest outline-none focus:border-white/30 transition-colors text-white" required />
                <button type="submit" className="w-full bg-white text-black py-4 font-bold text-[12px] uppercase tracking-widest active:scale-95 transition-transform">Login</button>
             </form>
             <div className="space-y-3">
                <button onClick={() => handleSocialLogin('kakao')} className="w-full py-3 bg-[#FEE500] text-black text-[10px] font-bold tracking-widest rounded-sm shadow-lg active:scale-95 transition-transform">KAKAO</button>
                <button onClick={() => handleSocialLogin('naver')} className="w-full py-3 bg-[#03C75A] text-white text-[10px] font-bold tracking-widest rounded-sm shadow-lg active:scale-95 transition-transform">NAVER</button>
                <button onClick={() => handleSocialLogin('google')} className="w-full py-3 bg-white text-black text-[10px] font-bold tracking-widest border border-white/10 rounded-sm shadow-lg active:scale-95 transition-transform">GOOGLE</button>
             </div>
             <button onClick={() => setAuthMode(null)} className="mt-12 text-[10px] uppercase text-[#444] hover:text-white transition-colors underline underline-offset-4">Cancel</button>
          </section>
        ) : isProfileOpen && isLoggedIn ? (
          <section className="pt-28 px-6 max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-light italic mb-8 text-white">Patrick Park</h2>
             <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-[#1c1c1c] p-6 border border-white/5"><p className="text-[10px] text-[#525252] uppercase mb-1">Score</p><span className="text-3xl font-light text-white">{userStats.score}</span></div>
                <div className="bg-[#1c1c1c] p-6 border border-white/5"><p className="text-[10px] text-[#525252] uppercase mb-1">Weekly Mileage</p><span className="text-3xl font-light text-white">{userStats.mileage}</span></div>
             </div>
             <button onClick={handleLogout} className="w-full py-4 border border-[#262626] text-[#c2410c] text-[10px] uppercase tracking-widest hover:bg-[#c2410c]/5 transition-colors">LOGOUT SESSION</button>
          </section>
        ) : (
          <>
            {/* JOURNAL TAB */}
            {activeTab === 'journal' && (
              <section className="animate-in fade-in">
                {selectedArticle ? (
                  <div className="pt-28 px-6 max-w-2xl mx-auto">
                    <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#737373] text-[10px] uppercase tracking-widest mb-10 hover:text-white transition-colors"><ArrowLeft size={14} /> Back</button>
                    <h2 className="text-4xl font-light italic mb-8 text-white">{selectedArticle.title}</h2>
                    <p className="text-lg leading-relaxed text-[#d4d4d4] font-light whitespace-pre-line mb-20">{selectedArticle.content}</p>
                  </div>
                ) : (
                  <div className="relative h-[85vh] w-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-[12px] tracking-[0.4em] uppercase mb-4 text-[#a3a3a3]">Season 01: The Mist</p>
                      <h2 className="text-5xl md:text-7xl font-light italic tracking-tight leading-tight mb-12 text-white">Finding Clarity <br/> in the Grey.</h2>
                      <button onClick={() => setSelectedArticle(siteContent.articles[0])} className="text-[11px] uppercase tracking-[0.3em] border-b border-white/30 pb-1 hover:border-white transition-colors text-white">Read Journal</button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ROUTES TAB */}
            {activeTab === 'routes' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                {selectedRoute ? (
                  <div className="animate-in fade-in max-w-2xl mx-auto">
                    <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[#737373] text-xs uppercase mb-10 hover:text-white transition-colors"><ArrowLeft size={14} /> Back</button>
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <span className={`text-[10px] px-3 py-1 rounded-full border mb-3 inline-block uppercase font-bold tracking-widest ${getTypeBorder(selectedRoute.type)} ${getTypeColor(selectedRoute.type)}`}>{selectedRoute.type}</span>
                        <h2 className="text-4xl font-light italic leading-tight text-white">{selectedRoute.name}</h2>
                        <p className="text-[#737373] text-sm mt-1">{selectedRoute.location}</p>
                      </div>
                      <p className="text-2xl font-light tracking-tighter text-white">{selectedRoute.distance}</p>
                    </div>
                    <p className="text-lg leading-relaxed text-[#d4d4d4] font-light mb-16">{selectedRoute.description}</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
                      <div><h2 className="text-3xl font-light italic mb-2 text-white">Narrative Explorer</h2><p className="text-[#737373] text-sm italic">지도로 탐색하는 러너의 서사.</p></div>
                      <div className="flex bg-[#1c1c1c] p-1 rounded-full border border-white/5">
                        <button onClick={() => setRouteViewMode('LIST')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${routeViewMode === 'LIST' ? 'bg-white text-black' : 'text-[#525252] hover:text-white'}`}><List size={12}/> List</button>
                        <button onClick={() => setRouteViewMode('MAP')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${routeViewMode === 'MAP' ? 'bg-white text-black' : 'text-[#525252] hover:text-white'}`}><MapIcon size={12}/> Map</button>
                      </div>
                    </div>

                    <div className="mb-10">
                      <div className="flex gap-6 border-b border-white/5 pb-4 mb-6">
                        {['ALL', 'ORIGINAL', 'TRAIL', 'ROAD'].map(type => (
                          <button key={type} onClick={() => setRouteTypeFilter(type)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${routeTypeFilter === type ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040] hover:text-white'}`}>{type}</button>
                        ))}
                      </div>
                      <div className="flex gap-6 border-b border-white/5 pb-4">
                        {['ALL', 'SEOUL', 'JEJU', 'GYEONGGI'].map(r => (
                          <button key={r} onClick={() => setRouteRegionFilter(r)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${routeRegionFilter === r ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040] hover:text-white'}`}>{r}</button>
                        ))}
                      </div>
                    </div>

                    {routeViewMode === 'MAP' ? (
                      <div ref={mapRef} className="w-full aspect-[4/5] md:aspect-[16/9] bg-[#121212] rounded-sm overflow-hidden shadow-2xl relative border border-white/5">
                        {mapPopup && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-black border border-white/20 p-5 rounded-sm shadow-2xl z-[2000] text-center animate-in zoom-in-95">
                              <p className={`text-[8px] uppercase tracking-widest mb-1 font-bold ${getTypeColor(mapPopup.type)}`}>{mapPopup.type}</p>
                              <h4 className="text-xl font-light italic mb-6 leading-tight text-white">{mapPopup.name}</h4>
                              <button onClick={() => setSelectedRoute(mapPopup)} className="w-full py-3 bg-white text-black text-[9px] uppercase font-bold tracking-widest">Explore</button>
                              <button onClick={() => setMapPopup(null)} className="mt-4 text-[10px] text-[#444] uppercase hover:text-white transition-colors">Close</button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {siteContent.routes
                          .filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter))
                          .filter(r => (routeRegionFilter === 'ALL' || r.region === routeRegionFilter))
                          .map(route => (
                          <div key={route._id || route.id} onClick={() => setSelectedRoute(route)} className="p-6 bg-[#1c1c1c] border border-white/5 rounded-sm flex justify-between items-center cursor-pointer hover:border-white/20 transition-all group">
                             <div>
                                <p className={`text-[9px] uppercase font-bold mb-1 tracking-widest ${getTypeColor(route.type)}`}>{route.type} / {route.location || route.region}</p>
                                <h4 className="text-xl font-light italic group-hover:text-white text-white">{route.name}</h4>
                             </div>
                             <span className="text-2xl font-light tracking-tighter group-hover:text-white text-white">{route.distance}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                <div className="mb-12"><h2 className="text-3xl font-light italic mb-6 text-white">Race & Narrative</h2></div>
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
                          <h4 className="text-3xl font-light italic mb-4 text-white">{race.name}</h4>
                          <p className="text-sm text-[#a3a3a3] font-light max-w-xl mb-6">{race.description}</p>
                          <button onClick={() => generateRecoveryPlan()} className="flex items-center gap-2 bg-white/10 px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white">AI Strategy</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* GEAR TAB */}
            {activeTab === 'gear' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-light italic mb-12 text-center text-white">Essential Tools</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-16">
                  {siteContent.gearItems.map(item => (
                      <div key={item._id || item.id} className="group flex flex-col animate-in fade-in text-left">
                        <div className="aspect-[4/5] bg-[#1c1c1c] border border-white/5 rounded-sm flex items-center justify-center mb-5 overflow-hidden group-hover:border-white/20 transition-all cursor-pointer text-[#333] text-[9px] uppercase tracking-widest italic">{item.imageLabel || "[Image]"}</div>
                        <div className="flex flex-col">
                           <p className={`text-[8px] uppercase font-bold tracking-widest mb-1 ${item.category === 'TRAIL' ? 'text-orange-400' : 'text-blue-400'}`}>{item.category} / {item.brand}</p>
                           <h3 className="text-sm font-medium italic mb-2 text-white">{item.name}</h3>
                           <p className="text-[10px] text-[#737373] leading-relaxed line-clamp-3 italic">"{item.note}"</p>
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* RITUAL TAB */}
            {activeTab === 'recovery' && (
              <section className="px-6 pt-28 max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-light italic mb-10 text-center text-white">Recovery Ritual</h2>
                {isLoggedIn && isWatchConnected ? (
                  <div className="animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                       <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center rounded-sm shadow-xl"><p className="text-[10px] uppercase mb-4 text-[#737373] tracking-widest font-bold">Recovery Score</p><div className="text-6xl font-light mb-2 text-white">{userStats.score}</div><p className="text-[9px] text-green-400 uppercase font-bold tracking-widest">Optimal</p></div>
                       <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center rounded-sm shadow-xl"><p className="text-[10px] uppercase mb-4 text-[#737373] tracking-widest font-bold">Data Source</p><div className="text-2xl font-light uppercase tracking-tighter mt-4 text-white">{connectedDevice?.toUpperCase()}</div></div>
                       <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center rounded-sm shadow-xl"><p className="text-[10px] uppercase mb-4 text-[#737373] tracking-widest font-bold">Last Sync</p><div className="text-2xl font-light italic mt-4 text-white">Just Now</div></div>
                    </div>
                    <button onClick={generateRecoveryPlan} className="w-full py-4 bg-white text-black font-bold uppercase text-[12px] tracking-[0.2em] active:scale-[0.98] transition-transform">Get AI Ritual</button>
                    {aiResponse && <div className="mt-8 text-sm italic text-[#d4d4d4] border-t border-white/5 pt-6 animate-in slide-in-from-bottom-2 leading-relaxed">"{aiResponse}"</div>}
                    <div className="mt-12 p-6 bg-[#1c1c1c] border border-white/5 rounded-sm flex items-center justify-between"><div className="flex items-center gap-4 text-[#525252]"><WatchIcon size={18} /><span className="text-[10px] uppercase tracking-widest font-bold">Connected: {connectedDevice?.toUpperCase()}</span></div><button onClick={() => setIsWatchModalOpen(true)} className="text-[9px] uppercase tracking-widest text-[#c2410c] font-bold">Change</button></div>
                  </div>
                ) : (
                  <div className="text-center py-24 border border-dashed border-white/10 rounded-sm">
                    <Zap size={40} className="mx-auto mb-6 text-[#333]"/>
                    <p className="text-sm text-[#737373] mb-8 leading-relaxed">{!isLoggedIn ? '로그인이 필요합니다.' : '워치 데이터를 동기화해주세요.'}</p>
                    <button onClick={() => !isLoggedIn ? setAuthMode('login') : setIsWatchModalOpen(true)} className="px-12 py-3 bg-white text-black font-bold text-[11px] uppercase tracking-widest rounded-full active:scale-95 transition-transform shadow-xl">{!isLoggedIn ? 'Login to Access' : 'Select Your Watch'}</button>
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
