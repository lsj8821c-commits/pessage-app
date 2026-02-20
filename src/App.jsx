import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, MapPin, ArrowRight, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, Zap, Coffee, ArrowLeft, Download, 
  TrendingUp, Heart, Settings, LogOut, Mail, Lock, UserPlus, Globe, Trophy, 
  Smartphone, Moon, Check, Flame, CupSoda, Info, BookOpen, Quote, Layers, 
  Map as MapIcon, List, X, Maximize2, Music, ThermometerSnowflake, Leaf, Calendar
} from 'lucide-react';

// --- 전역 테마 및 컬러 설정 (Global Theme) ---
const colors = {
  bg: 'bg-[#121212]',
  card: 'bg-[#1c1c1c]',
  border: 'border-[#262626]',
  trail: { 
    accent: 'text-orange-400', 
    bg: 'bg-orange-400/5', 
    border: 'border-orange-400/30', 
    pin: '#fb923c' 
  },
  road: { 
    accent: 'text-blue-400', 
    bg: 'bg-blue-400/5', 
    border: 'border-blue-400/30', 
    pin: '#60a5fa' 
  }
};

const apiKey = ""; // Gemini API 키 (환경 변수 사용 권장)

export default function App() {
  // --- UI 상태 관리 ---
  const [activeTab, setActiveTab] = useState('journal');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // --- 데이터 상태 관리 ---
  const [isWatchConnected, setIsWatchConnected] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // --- 루트 및 지도 상태 ---
  const [routeViewMode, setRouteViewMode] = useState('LIST'); 
  const [routeTypeFilter, setRouteTypeFilter] = useState('ALL');
  const [routeRegionFilter, setRouteRegionFilter] = useState('ALL');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapPopup, setMapPopup] = useState(null);
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerGroupRef = useRef(null);

  // --- 세션 및 기어 필터 ---
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [gearFilter, setGearFilter] = useState('ALL');

  // --- AI 및 인터랙션 상태 ---
  const [aiResponse, setAiResponse] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeAiTarget, setActiveAiTarget] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // --- 데이터 정의 (Data) ---
  const articles = [
    {
      id: 1,
      title: "Finding Clarity in the Grey",
      subtitle: "Season 01: The Mist",
      category: "ESSAY",
      date: "2026.02.20",
      content: "새벽 5시, 세상이 아직 짙은 회색빛 장막 뒤에 숨어 있을 때 우리는 길을 나섭니다. 시야는 불과 5미터 앞을 내다보기 힘들지만, 아이러니하게도 우리는 그 어느 때보다 '선명함'을 느낍니다. 안개는 외부의 소음을 차단하는 천연 소음기입니다. 이 정적 속에서 달리기는 단순한 운동을 넘어 하나의 움직이는 명상이 됩니다.",
      excerpt: "안개는 시야를 가리지만, 대신 발끝의 감각을 선명하게 만듭니다."
    }
  ];

  const routesData = [
    { id: 'orig-1', type: 'ORIGINAL', region: 'SEOUL', name: "Espresso Run", location: "Hannam, Seoul", distance: "5.0km", lat: 37.534, lng: 127.002, description: "새벽의 정적을 뚫고 한남동을 달립니다. 코스의 끝에는 에스프레소 바가 기다립니다.", icon: Coffee, spot: { name: "Anthracite Hannam", description: "새벽의 카페인 리추얼.", imageLabel: "[앤트러사이트 한남 이미지]" } },
    { id: 'orig-2', type: 'ORIGINAL', region: 'SEOUL', name: "Sauna Run", location: "Inwangsan, Seoul", distance: "8.5km", lat: 37.581, lng: 126.956, description: "트레일 완주 후 사우나로 직행하여 근육의 긴장을 해소합니다.", icon: Flame, spot: { name: "Ancient Forest Bath", description: "증기 속 완벽한 이완.", imageLabel: "[인왕산 사우나 이미지]" } },
    { id: 'orig-3', type: 'ORIGINAL', region: 'SEOUL', name: "Tea Ritual Run", location: "Bukchon, Seoul", distance: "6.2km", lat: 37.582, lng: 126.984, description: "고궁의 담벼락을 따라 달리며 마음을 정돈하고 따뜻한 차를 마십니다.", icon: Leaf, spot: { name: "Osulloc Tea House", description: "정중동의 미학, 차 한 잔의 회복." } },
    { id: 'orig-4', type: 'ORIGINAL', region: 'SEOUL', name: "Vinyl Recovery Run", location: "Seongsu, Seoul", distance: "7.0km", lat: 37.544, lng: 127.056, description: "성수동의 거리를 달린 후 바이닐 바에서 감각적인 음악과 함께 회복합니다.", icon: Music, spot: { name: "Positive Zero Lounge", description: "소리로 전해지는 감각적 회복." } },
    { id: 'trail-1', type: 'TRAIL', region: 'SEOUL', name: "Misty Hidden Wall", location: "Bukhansan, Seoul", distance: "12.4km", lat: 37.649, lng: 126.979, description: "북한산의 거친 암릉 코스." },
    { id: 'trail-2', type: 'TRAIL', region: 'JEJU', name: "Volcanic Coast Trail", location: "Olle 7, Jeju", distance: "17.6km", lat: 33.242, lng: 126.541, description: "현무암 바다를 끼고 달리는 제주 트레일." },
    { id: 'road-1', type: 'ROAD', region: 'SEOUL', name: "City Pulse Line", location: "Banpo, Seoul", distance: "8.2km", lat: 37.511, lng: 126.996, description: "한강의 밤바람을 느끼는 시티런." },
    { id: 'road-2', type: 'ROAD', region: 'GYEONGGI', name: "Central Park Loop", location: "Songdo, Incheon", distance: "6.5km", lat: 37.392, lng: 126.639, description: "미래지향적 건축물 사이의 로드 코스." }
  ];

  const gearItems = [
    { id: 1, name: "Portal Shield Shell", brand: "PORTAL", category: "TRAIL", note: "안개가 자욱한 능선에서도 체온을 유지해준 유일한 장비.", imageLabel: "[트레일 재킷]" },
    { id: 2, name: "Carbon Pulse v2", brand: "PESSAGE", category: "ROAD", note: "도심을 가를 때 필요한 정교함.", imageLabel: "[로드 슈즈]" },
    { id: 3, name: "Recovery Electrolyte", brand: "PESSAGE", category: "NUTRITION", note: "달린 후의 회복은 무엇을 먹느냐에서 시작됩니다.", imageLabel: "[뉴트리션]" }
  ];

  const racesData = [
    { id: 'r-1', name: 'Trans Jeju 100K', date: '2026-10-12', type: 'TRAIL', location: 'Jeju, KR', description: '한국 최대의 울트라 트레일 대제전.' },
    { id: 'r-2', name: 'UTMB Mont-Blanc', date: '2026-08-28', type: 'TRAIL', location: 'Chamonix, FR', description: '트레일 러너들의 성지, 알프스 몽블랑 일주.' },
    { id: 'r-3', name: 'Seoul Marathon', date: '2026-03-15', type: 'ROAD', location: 'Seoul, KR', description: '서울의 심장을 관통하는 역사적인 레이스.' },
    { id: 'r-4', name: 'Boston Marathon', date: '2026-04-20', type: 'ROAD', location: 'Boston, US', description: '전 세계 러너들이 선망하는 역사와 권위의 상징.' }
  ];

  // --- Effects ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    // Leaflet Library CSS/JS 주입
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
    } else {
      setIsMapLoaded(true);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 지도 초기화 및 마커 필터링 로직 ---
  useEffect(() => {
    if (activeTab === 'routes' && routeViewMode === 'MAP' && isMapLoaded && mapRef.current) {
      const L = window.L;
      if (!leafletMap.current) {
        const map = L.map(mapRef.current, { center: [36.5, 127.8], zoom: 7, zoomControl: false, attributionControl: false });
        // 심플한 다크 테마 타일 적용
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        leafletMap.current = map;
        markerGroupRef.current = L.layerGroup().addTo(map);
      }
      updateMapMarkers();
    } else if (leafletMap.current && (activeTab !== 'routes' || routeViewMode !== 'MAP')) {
      leafletMap.current.remove(); 
      leafletMap.current = null;
      markerGroupRef.current = null;
    }
  }, [activeTab, routeViewMode, isMapLoaded, routeTypeFilter, routeRegionFilter]);

  const updateMapMarkers = () => {
    if (!leafletMap.current || !markerGroupRef.current) return;
    const L = window.L;
    markerGroupRef.current.clearLayers();
    
    const filtered = routesData.filter(r => 
      (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && 
      (routeRegionFilter === 'ALL' || r.region === routeRegionFilter)
    );
    
    if (filtered.length > 0) {
      const bounds = L.latLngBounds();
      filtered.forEach(route => {
        const pinColor = route.type === 'TRAIL' ? colors.trail.pin : route.type === 'ROAD' ? colors.road.pin : '#ffffff';
        const customIcon = L.divIcon({ 
          className: 'custom-pin', 
          html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #121212; box-shadow: 0 0 15px ${pinColor}44;"></div>`, 
          iconSize: [14, 14] 
        });
        const marker = L.marker([route.lat, route.lng], { icon: customIcon });
        marker.on('click', () => setMapPopup(route));
        markerGroupRef.current.addLayer(marker);
        bounds.extend([route.lat, route.lng]);
      });
      // 필터링된 지역으로 지도 시점 이동
      if (routeRegionFilter !== 'ALL') {
        leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  };

  // --- 비즈니스 로직 핸들러 ---
  const handleLogout = () => { setIsLoggedIn(false); setIsProfileOpen(false); setActiveTab('journal'); setAuthMode(null); };
  const handleAuthSubmit = (e) => { e.preventDefault(); setIsAiLoading(true); setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); }, 1200); };
  
  const generateRecoveryPlan = async () => {
    setIsAiLoading(true);
    // AI 시뮬레이션: 실제 배포 시 callGemini 연동 가능
    setTimeout(() => {
      setAiResponse("오늘 훈련의 강도와 심박수를 분석한 결과, 15분간의 온수 샤우나 후 따뜻한 보이차로 교감 신경을 완화하는 리추얼을 추천합니다.");
      setIsAiLoading(false);
    }, 1500);
  };

  const generateRaceStrategy = async (raceName) => {
    if (!isLoggedIn) { setAuthMode('login'); return; }
    setActiveAiTarget(raceName);
    setIsAiLoading(true);
    setTimeout(() => {
      setAiResponse(`${raceName} 대회의 코스 고저차를 고려할 때, 초반 5km는 심박수 존 2를 유지하며 에너지를 비축하는 전략이 유효합니다.`);
      setIsAiLoading(false);
    }, 1500);
  };

  const groupedRaces = () => {
    const filtered = racesData.filter(r => raceTypeFilter === 'ALL' || r.type === raceTypeFilter);
    const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = {};
    sorted.forEach(race => {
      const month = new Date(race.date).toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[month]) groups[month] = [];
      groups[month].push(race);
    });
    return groups;
  };

  // --- 공통 내비게이션 아이템 ---
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
      <style>{`
        .leaflet-container { background: #121212 !important; border: none !important; width: 100%; height: 100%; }
        .custom-pin { display: flex; align-items: center; justify-content: center; }
      `}</style>
      
      {/* 고정 헤더 */}
      <header className={`fixed top-0 w-full z-[1000] transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.2em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setIsProfileOpen(false); setAuthMode(null); setSelectedArticle(null);}}>PESSAGE</h1>
        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <>
              <div className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border ${isWatchConnected ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-[#525252]'}`}>{isWatchConnected ? 'SYNCED' : 'DISCONNECTED'}</div>
              <button onClick={() => {setIsProfileOpen(!isProfileOpen); setAuthMode(null);}} className={`p-1 transition-all ${isProfileOpen ? 'text-white scale-110' : 'text-[#a3a3a3]'}`}><User size={22} /></button>
            </>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[11px] uppercase bg-white text-black px-5 py-2 rounded-full font-bold shadow-lg">JOIN</button>
          )}
        </div>
      </header>

      <main className="pb-32">
        {/* 회원가입/로그인 섹션 */}
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto animate-in fade-in text-center">
             <h2 className="text-3xl font-light italic mb-10">Membership</h2>
             <form onSubmit={handleAuthSubmit} className="space-y-4">
                <input type="email" placeholder="EMAIL" className="w-full bg-[#1c1c1c] border border-[#262626] py-4 px-4 text-[10px] tracking-widest outline-none" required />
                <button type="submit" className="w-full bg-white text-black py-4 font-bold text-[12px] uppercase tracking-widest">Login</button>
             </form>
             <div className="mt-10 grid grid-cols-3 gap-3">
                <button className="bg-[#FEE500] text-black py-3 rounded-sm font-bold text-[9px]">KAKAO</button>
                <button className="bg-[#03C75A] text-white py-3 rounded-sm font-bold text-[9px]">NAVER</button>
                <button className="bg-white text-black border border-[#262626] py-3 rounded-sm font-bold text-[9px]">GOOGLE</button>
             </div>
             <button onClick={() => setAuthMode(null)} className="mt-8 text-[10px] uppercase text-[#444] hover:text-white transition-colors">Cancel</button>
          </section>
        ) : isProfileOpen && isLoggedIn ? (
          /* 마이페이지 섹션 */
          <section className="pt-28 px-6 max-w-2xl mx-auto animate-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-light italic mb-8">Patrick Park</h2>
             <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-[#1c1c1c] p-6 border border-white/5"><p className="text-[10px] text-[#525252] uppercase mb-1">Score</p><span className="text-3xl font-light">84</span></div>
                <div className="bg-[#1c1c1c] p-6 border border-white/5"><p className="text-[10px] text-[#525252] uppercase mb-1">Weekly Mileage</p><span className="text-3xl font-light">32.4k</span></div>
             </div>
             <button onClick={handleLogout} className="w-full py-4 border border-[#262626] text-[#c2410c] text-[10px] uppercase tracking-widest">LOGOUT SESSION</button>
          </section>
        ) : (
          <>
            {/* JOURNAL 탭 */}
            {activeTab === 'journal' && (
              <section className="animate-in fade-in">
                {selectedArticle ? (
                  <div className="pt-28 px-6 max-w-2xl mx-auto">
                    <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#737373] text-[10px] uppercase tracking-widest mb-10 hover:text-white"><ArrowLeft size={14} /> Back</button>
                    <h2 className="text-4xl font-light italic mb-8">{selectedArticle.title}</h2>
                    <p className="text-lg leading-relaxed text-[#d4d4d4] font-light whitespace-pre-line mb-20">{selectedArticle.content}</p>
                  </div>
                ) : (
                  <div className="relative h-[85vh] w-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-[12px] tracking-[0.4em] uppercase mb-4 text-[#a3a3a3]">Season 01: The Mist</p>
                      <h2 className="text-5xl md:text-7xl font-light italic tracking-tight leading-tight">Finding Clarity <br/> in the Grey.</h2>
                      <button onClick={() => setSelectedArticle(articles[0])} className="mt-12 text-[11px] uppercase tracking-[0.3em] border-b border-white/30 pb-1">Read Journal</button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ROUTES 탭 - 지도 기반 탐색 */}
            {activeTab === 'routes' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                {selectedRoute ? (
                  /* 코스 상세 */
                  <div className="animate-in fade-in max-w-2xl mx-auto">
                    <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[#737373] text-xs uppercase mb-10"><ArrowLeft size={14} /> Back</button>
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <span className={`text-[10px] px-3 py-1 rounded-full border mb-3 inline-block uppercase font-bold tracking-widest ${selectedRoute.type === 'TRAIL' ? colors.trail.border + ' ' + colors.trail.accent : selectedRoute.type === 'ROAD' ? colors.road.border + ' ' + colors.road.accent : 'border-white/30 text-white'}`}>{selectedRoute.type}</span>
                        <h2 className="text-4xl font-light italic leading-tight">{selectedRoute.name}</h2>
                        <p className="text-[#737373] text-sm mt-1">{selectedRoute.location}</p>
                      </div>
                      <div className="text-right"><p className="text-2xl font-light tracking-tighter">{selectedRoute.distance}</p><p className="text-[10px] uppercase tracking-widest text-[#525252]">Distance</p></div>
                    </div>
                    <p className="text-lg leading-relaxed text-[#d4d4d4] font-light mb-16">{selectedRoute.description}</p>
                    <button onClick={() => handleSyncToWatch(selectedRoute.id)} className={`w-full py-4 rounded-full text-[12px] uppercase font-bold transition-all ${syncSuccess ? 'bg-green-600' : 'bg-white text-black'}`}>
                      {isSyncing ? 'SYNCING...' : syncSuccess ? 'Synced to Watch' : 'Sync to Device'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 루트 목록 헤더 및 필터 */}
                    <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
                      <div><h2 className="text-3xl font-light italic mb-2">Narrative Explorer</h2><p className="text-[#737373] text-sm italic">지도로 탐색하는 러너의 여정.</p></div>
                      <div className="flex bg-[#1c1c1c] p-1 rounded-full border border-white/5">
                        <button onClick={() => {setRouteViewMode('LIST'); setMapPopup(null);}} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${routeViewMode === 'LIST' ? 'bg-white text-black' : 'text-[#525252]'}`}><List size={12}/> List</button>
                        <button onClick={() => setRouteViewMode('MAP')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${routeViewMode === 'MAP' ? 'bg-white text-black' : 'text-[#525252]'}`}><MapIcon size={12}/> Map</button>
                      </div>
                    </div>

                    <div className="mb-10">
                      <div className="flex gap-6 border-b border-white/5 pb-4 mb-6">
                        {['ALL', 'TRAIL', 'ROAD', 'ORIGINAL'].map(t => (
                          <button key={t} onClick={() => setRouteTypeFilter(t)} className={`text-[10px] uppercase tracking-[0.3em] font-bold ${routeTypeFilter === t ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{t}</button>
                        ))}
                      </div>
                      <div className="flex gap-6 border-b border-white/5 pb-4">
                        {['ALL', 'SEOUL', 'JEJU', 'GYEONGGI'].map(r => (
                          <button key={r} onClick={() => setRouteRegionFilter(r)} className={`text-[10px] uppercase tracking-[0.3em] font-bold ${routeRegionFilter === r ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{r}</button>
                        ))}
                      </div>
                    </div>

                    {/* 지도 및 리스트 뷰 */}
                    {routeViewMode === 'MAP' ? (
                      <div ref={mapRef} className="w-full aspect-[4/5] md:aspect-[16/9] bg-[#121212] rounded-sm overflow-hidden shadow-2xl relative">
                        {mapPopup && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-black border border-white/20 p-5 rounded-sm shadow-2xl z-[2000] animate-in slide-in-from-bottom-2 text-center">
                              <p className={`text-[8px] uppercase tracking-widest mb-1 ${mapPopup.type === 'TRAIL' ? 'text-orange-400' : 'text-blue-400'}`}>{mapPopup.type}</p>
                              <h4 className="text-xl font-light italic mb-6 leading-tight">{mapPopup.name}</h4>
                              <button onClick={() => setSelectedRoute(mapPopup)} className="w-full py-3 bg-white text-black text-[9px] uppercase font-bold">Explore</button>
                              <button onClick={() => setMapPopup(null)} className="mt-2 text-[10px] text-[#444]">Close</button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {routesData.filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && (routeRegionFilter === 'ALL' || r.region === routeRegionFilter)).map(route => (
                          <div key={route.id} onClick={() => setSelectedRoute(route)} className="p-6 bg-[#1c1c1c] border border-white/5 rounded-sm flex justify-between items-center cursor-pointer hover:border-white/20 transition-all group">
                             <div className="flex items-center gap-5">
                                <div className={`w-1 h-8 rounded-full ${route.type === 'TRAIL' ? 'bg-orange-400' : route.type === 'ORIGINAL' ? 'bg-white' : 'bg-blue-400'}`}></div>
                                <div>
                                   <p className="text-[9px] uppercase font-bold mb-1 text-[#525252]">{route.type} / {route.location}</p>
                                   <h4 className="text-xl font-light italic group-hover:text-white">{route.name}</h4>
                                </div>
                             </div>
                             <span className="text-2xl font-light tracking-tighter">{route.distance}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* SESSIONS 탭 - 월별 대회 일정 */}
            {activeTab === 'sessions' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                <div className="mb-12">
                  <h2 className="text-3xl font-light italic mb-6">Race & Narrative</h2>
                  <div className="flex gap-6 border-b border-white/5 pb-4 mb-10">
                    {['ALL', 'TRAIL', 'ROAD'].map(type => (
                      <button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${raceTypeFilter === type ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{type}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-20">
                  {Object.entries(groupedRaces()).map(([month, monthRaces]) => (
                    <div key={month}>
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
                            <button onClick={() => generateRaceStrategy(race.name)} className="flex items-center gap-2 bg-white/10 px-6 py-3 text-[10px] uppercase tracking-widest"><Sparkles size={12}/> AI Strategy</button>
                            {activeAiTarget === race.name && aiResponse && !isAiLoading && <div className="mt-6 p-6 bg-white/5 border border-white/10 italic text-sm text-[#d4d4d4]">"{aiResponse}"</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GEAR 탭 - 에디토리얼 사설 */}
            {activeTab === 'gear' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
                 <h2 className="text-3xl font-light italic mb-12 text-center">Essential Tools</h2>
                 <div className="space-y-24 max-w-2xl mx-auto">
                    {gearItems.map(item => (
                      <div key={item.id} className="group text-center">
                         <div className="aspect-[3/4] bg-[#1c1c1c] border border-white/5 rounded-sm flex items-center justify-center italic text-[#333] mb-6 text-sm font-serif">Product Visual Placeholder</div>
                         <p className="text-[10px] uppercase font-bold text-orange-400 mb-2">{item.category} / {item.brand}</p>
                         <h3 className="text-3xl font-light italic mb-4">{item.name}</h3>
                         <p className="text-sm text-[#a3a3a3] italic">"{item.note}"</p>
                      </div>
                    ))}
                 </div>
              </section>
            )}

            {/* RITUAL 탭 - 회복 가이드 */}
            {activeTab === 'recovery' && (
              <section className="px-6 pt-28 max-w-3xl mx-auto animate-in slide-in-from-bottom-4">
                <h2 className="text-3xl font-light italic mb-10 text-center">Recovery Ritual</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                   <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center"><p className="text-[10px] uppercase mb-4 text-[#737373]">Recovery Score</p><div className="text-6xl font-light mb-2">84</div><p className="text-[9px] text-green-400 uppercase font-bold">Optimal</p></div>
                   <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center"><p className="text-[10px] uppercase mb-4 text-[#737373]">Sleep Quality</p><div className="text-5xl font-light">88%</div></div>
                   <div className="bg-[#1c1c1c] p-6 border border-white/5 text-center"><p className="text-[10px] uppercase mb-4 text-[#737373]">Fatigue</p><div className="text-4xl font-light italic">Low</div></div>
                </div>
                <button onClick={generateRecoveryPlan} className="w-full py-4 bg-white text-black font-bold uppercase text-[12px] tracking-[0.2em]">{isAiLoading ? 'Analyzing...' : 'Get AI Ritual'}</button>
                {aiResponse && <div className="mt-8 text-sm italic text-[#d4d4d4] border-t border-white/5 pt-6 animate-in fade-in">"{aiResponse}"</div>}
              </section>
            )}
          </>
        )}
      </main>

      {/* 하단 탭 내비게이션 */}
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
