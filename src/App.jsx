import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, ArrowLeft, 
  Map as MapIcon, List, Calendar, Smartphone as WatchIcon, Quote
} from 'lucide-react';

/**
 * ============================================================
 * ☁️ SANITY CONFIGURATION
 * ============================================================
 */
const SANITY_CONFIG = {
  projectId: "1pnkcp2x", 
  dataset: "production",
  apiVersion: "2024-02-20",
  useCdn: false,
};

const getSafeApiKey = () => {
  try { return import.meta.env.VITE_GEMINI_API_KEY || ""; } catch (e) { return ""; }
};
const apiKey = getSafeApiKey();

// --- Sanity & Local 이미지 URL 변환 헬퍼 ---
const urlFor = (source) => {
  if (!source) return null;
  if (source.isLocal) return source.url; 
  if (!source.asset || !source.asset._ref) return null;
  const ref = source.asset._ref;
  const [_file, id, dimensions, extension] = ref.split('-');
  return `https://cdn.sanity.io/images/${SANITY_CONFIG.projectId}/${SANITY_CONFIG.dataset}/${id}-${dimensions}.${extension}`;
};

// --- 🌟 PESSAGE x PORTAL Fallback Data ---
const FALLBACK_DATA = {
  articles: [
    {
      _id: 'portal-feature-1',
      title: 'Shadows on the Trail',
      subtitle: 'Brand Focus: Portal',
      coverImage: { isLocal: true, url: '1769489952971.jpg' },
      content: [
        { _type: 'block', style: 'h2', children: [{ text: '빛과 그림자, 러닝의 이면' }] },
        { _type: 'block', style: 'normal', children: [{ text: '거친 호흡이 지나간 자리, 러닝은 단순한 스포츠가 아닌 하나의 의식(Ritual)이 됩니다. 패트릭 스탱바이(Patrick Stangbye)가 디렉팅하는 포탈(Portal)은 이러한 러너의 고독한 여정을 완벽하게 담아냅니다.' }] },
        { _type: 'image', isLocal: true, url: '_portal_1769489970754.jpeg', caption: '어반과 트레일을 넘나드는 고요한 모노톤의 조화.' },
        { _type: 'block', style: 'normal', children: [{ text: 'PESSAGE가 주목하는 것은 바로 이 지점입니다. 땀에 젖은 채 기록에만 몰두하는 것을 넘어, 나를 감싸는 장비(Gear)의 질감, 발밑에서 부서지는 나뭇잎의 소리, 그리고 러닝 후 사우나에서 씻어내는 피로감까지. 모든 찰나가 에디토리얼이 됩니다.' }] },
        { _type: 'quote', text: '가장 거친 자연 속에서 가장 정제된 나를 발견한다. 그것이 우리가 트레일로 들어서는 이유다.', author: 'Patrick Stangbye' },
        { _type: 'image', isLocal: true, url: '1769489976034.jpeg', caption: '갈라진 대지와 하나된 러너의 맥박, 그리고 정밀한 시간의 기록.' },
        { _type: 'block', style: 'h2', children: [{ text: 'Earthy Tones & Technical Perfection' }] },
        { _type: 'block', style: 'normal', children: [{ text: '기능성을 위해 심미성을 포기할 필요는 없습니다. Portal의 컬렉션은 나무껍질, 마른 흙, 짙은 이끼의 색을 차용하여 아웃도어 환경에 이질감 없이 녹아듭니다.' }] },
        { _type: 'image', isLocal: true, url: '1769489959201.jpeg', caption: '빛을 흡수하는 텍스처와 완벽한 피팅감.' },
      ]
    },
    {
      _id: 'portal-feature-2',
      title: 'Autumn Cadence',
      subtitle: 'City to Trail',
      coverImage: { isLocal: true, url: 'Matt_DESK.jpg' },
      content: [
        { _type: 'block', style: 'h2', children: [{ text: '경계를 허무는 발걸음' }] },
        { _type: 'block', style: 'normal', children: [{ text: '가을의 끝자락, 도심의 건축물과 붉게 물든 단풍 사이를 가로지르는 러닝은 완벽한 시각적 카타르시스를 제공합니다. 일상과 탈일상의 경계는 오직 두 발의 케이던스에 의해 지워집니다.' }] },
        { _type: 'image', isLocal: true, url: 'images.jpeg', caption: '울창한 숲속, 무거운 흙을 박차고 나가는 가벼운 스텝.' }
      ]
    },
    {
      _id: 'portal-feature-3',
      title: 'The Silent Pace',
      subtitle: 'Editor\'s Note',
      coverImage: { isLocal: true, url: '1769489976034.jpeg' },
      content: [
        { _type: 'block', style: 'h2', children: [{ text: '침묵 속의 전진' }] },
        { _type: 'block', style: 'normal', children: [{ text: '어떠한 음악도 없이 오직 숨소리와 발자국 소리만으로 채워진 러닝은 명상과 다름없습니다. 거친 호흡만이 메트로놈이 되어 러너를 가장 깊은 내면으로 안내합니다.' }] }
      ]
    }
  ],
  gearItems: [
    { _id: 'g1', category: 'PACK', brand: 'PORTAL', name: 'Trail Running Belt', note: '가장 필요한 것만 남긴 미니멀리즘. 허리선을 완벽히 감싸는 안정감.', image: { isLocal: true, url: '포탈-러닝벨트.jpg' } },
    { _id: 'g2', category: 'APPAREL', brand: 'PORTAL', name: 'Womens Running Kit', note: '비에 젖은 숲속에서도 고요하게 빛나는 어시(Earthy) 그린의 우아함.', image: { isLocal: true, url: 'Portal-Running-Kit-Womens.webp' } },
    { _id: 'g3', category: 'EYEWEAR', brand: 'DISTRICT VISION', name: 'Keiichi Standard', note: '빛을 통제하는 자가 트레일을 지배한다. 디렉터의 필수품.', image: { isLocal: true, url: '포탈-디렉터-패트릭-스탱바이.jpg' } },
    { _id: 'g4', category: 'ACCESSORY', brand: 'PORTAL', name: 'Signature Cap', note: '햇빛과 비, 그리고 거친 바람을 견뎌내는 러너의 가장 견고한 방패.', image: { isLocal: true, url: 'images (1).jpeg' } }
  ],
  routes: [
    { _id: 'r1', name: 'Seoul Forest to Namsan', type: 'ROAD', region: 'SEOUL', distance: '12.5 km', lat: 37.5443, lng: 127.0374, description: [{_type:'block', style:'normal', children:[{text:'단풍과 고층 빌딩이 교차하는 마법 같은 코스.'}]}] },
    { _id: 'r2', name: 'Hallasan Yeongsil Trail', type: 'TRAIL', region: 'JEJU', distance: '18.2 km', lat: 33.3614, lng: 126.5292, description: [{_type:'block', style:'normal', children:[{text:'원시림의 숨결을 그대로 느낄 수 있는 궁극의 트레일.'}]}] }
  ],
  races: [
    { _id: 'race1', name: 'Trans Jeju 100K', date: '2026-10-12', type: 'TRAIL', description: '화산섬의 척박한 땅을 달리는 국내 최대의 울트라 트레일 대제전.' },
    { _id: 'race2', name: 'UTMB Mont-Blanc', date: '2026-08-28', type: 'TRAIL', description: '알프스의 심장부를 관통하는 트레일 러너들의 궁극적인 성지.' },
    { _id: 'race3', name: 'Seoul Marathon', date: '2026-03-15', type: 'ROAD', description: '광화문에서 잠실까지, 서울의 랜드마크를 가로지르는 역사적인 레이스.' }
  ]
};

/**
 * 🖋️ Editorial Content Renderer
 */
const EditorialRenderer = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="space-y-10">
      {blocks.map((block, index) => {
        if (block._type === 'block') {
          const text = block.children?.map(child => child.text).join('') || '';
          if (!text) return <div key={index} className="h-4" />;
          if (block.style === 'h2') return <h2 key={index} className="text-3xl font-light italic text-[#EAE5D9] mt-16 mb-6 tracking-wide">{text}</h2>;
          if (block.style === 'h3') return <h3 key={index} className="text-xl font-bold text-[#EAE5D9] mt-8 mb-4">{text}</h3>;
          return <p key={index} className="text-[17px] leading-[1.8] text-[#A8A29E] font-light">{text}</p>;
        }
        
        if (block._type === 'image') {
          const imageUrl = urlFor(block);
          if (!imageUrl) return null;
          return (
            <figure key={index} className="my-20 animate-in fade-in duration-1000">
              <div className="aspect-[4/3] md:aspect-video w-full bg-[#1A1918] overflow-hidden rounded-sm border border-[#EAE5D9]/5">
                <img src={imageUrl} alt={block.caption || ''} className="w-full h-full object-cover transition-transform duration-[20s] hover:scale-105" />
              </div>
              {block.caption && <figcaption className="mt-6 text-[10px] uppercase tracking-widest text-[#78716C] text-center italic">— {block.caption}</figcaption>}
            </figure>
          );
        }

        if (block._type === 'quote') {
          return (
            <div key={index} className="py-16 border-y border-[#EAE5D9]/10 my-20 text-center animate-in slide-in-from-bottom-2 bg-gradient-to-b from-transparent via-[#EAE5D9]/5 to-transparent">
              <Quote size={24} className="mx-auto mb-8 text-[#EAE5D9]/30" />
              <p className="text-2xl md:text-3xl font-light italic leading-relaxed text-[#EAE5D9] mb-6 px-4">"{block.text}"</p>
              {block.author && <cite className="text-[10px] uppercase tracking-[0.3em] text-[#78716C] font-bold">— {block.author}</cite>}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default function App() {
  const [siteContent, setSiteContent] = useState({ articles: [], routes: [], gearItems: [], races: [] });
  const [activeTab, setActiveTab] = useState('journal');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null); 
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  const [routeViewMode, setRouteViewMode] = useState('LIST'); 
  const [routeTypeFilter, setRouteTypeFilter] = useState('ALL');
  const [routeRegionFilter, setRouteRegionFilter] = useState('ALL');
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [gearFilter, setGearFilter] = useState('ALL');

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeAiTarget, setActiveAiTarget] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapPopup, setMapPopup] = useState(null);

  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerGroupRef = useRef(null);

  // --- 1. CMS 데이터 페칭 ---
  useEffect(() => {
    const fetchCmsData = async () => {
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "route"] { ..., "gpxUrl": gpxFile.asset->url, "gallery": images[].asset->url },
        "gearItems": *[_type == "gear"],
        "races": *[_type == "race"] | order(date asc) 
      }`);
      
      const endpoint = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${query}`;

      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Fetch Error`);
        const result = await response.json();
        
        const data = result.result;
        setSiteContent({
          articles: data.articles?.length > 0 ? data.articles : FALLBACK_DATA.articles,
          routes: data.routes?.length > 0 ? data.routes : FALLBACK_DATA.routes,
          gearItems: data.gearItems?.length > 0 ? data.gearItems : FALLBACK_DATA.gearItems,
          races: data.races?.length > 0 ? data.races : FALLBACK_DATA.races
        });
      } catch (e) {
        setSiteContent(FALLBACK_DATA); 
      }
    };
    fetchCmsData();
  }, []);

  // --- 2. 라이브러리 스크립트 주입 ---
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
      script.async = true; 
      script.onload = () => setIsMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsMapLoaded(true);
    }
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- 3. 맵 마커 렌더링 ---
  const updateMapMarkers = useCallback(() => {
    if (!leafletMap.current || !markerGroupRef.current) return;
    const L = window.L;
    markerGroupRef.current.clearLayers();
    
    const filtered = siteContent.routes.filter(r => 
      (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && 
      (routeRegionFilter === 'ALL' || r.region === routeRegionFilter)
    );
    
    if (filtered.length > 0) {
      const bounds = L.latLngBounds();
      filtered.forEach(route => {
        if (!route.lat || !route.lng) return;
        const pinColor = route.type === 'TRAIL' ? '#C2410C' : route.type === 'ROAD' ? '#78716C' : '#ffffff';
        const customIcon = L.divIcon({ 
          className: 'custom-pin', 
          html: `<div style="background-color: ${pinColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #1A1918; box-shadow: 0 0 15px ${pinColor}88;"></div>`, 
          iconSize: [12, 12] 
        });
        const marker = L.marker([route.lat, route.lng], { icon: customIcon });
        marker.on('click', () => setMapPopup(route));
        markerGroupRef.current.addLayer(marker);
        bounds.extend([route.lat, route.lng]);
      });
      if (routeRegionFilter !== 'ALL' || routeTypeFilter !== 'ALL') {
        leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    }
  }, [siteContent.routes, routeTypeFilter, routeRegionFilter]);

  // --- 4. 맵 초기화 ---
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
      const t1 = setTimeout(() => { if (leafletMap.current) leafletMap.current.invalidateSize(); }, 100);
      return () => clearTimeout(t1);
    } else if (leafletMap.current && (activeTab !== 'routes' || routeViewMode !== 'MAP')) {
      leafletMap.current.remove();
      leafletMap.current = null;
      markerGroupRef.current = null;
    }
  }, [activeTab, routeViewMode, isMapLoaded, updateMapMarkers]);

  // --- 5. 액션 핸들러 ---
  const handleSocialLogin = () => {
    setIsAiLoading(true);
    setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); }, 1500);
  };

  const handleSyncGPX = (targetId) => {
    if (!isLoggedIn) { setAuthMode('login'); return; }
    if (!connectedDevice) { setIsWatchModalOpen(true); return; }
    setActiveAiTarget(targetId); setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); setSyncSuccess(true); setTimeout(() => { setSyncSuccess(false); setActiveAiTarget(null); }, 3000); }, 2000);
  };

  const handleDeviceConnectClick = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
    } else {
      setIsWatchModalOpen(true);
    }
  };

  const generateAiContent = async (target, prompt) => {
    if (!apiKey) return;
    setIsAiLoading(true); setActiveAiTarget(target);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "에디터의 펜이 길을 잃었습니다. 다시 시도해주세요.");
    } catch (e) { setAiResponse("AI 연결 오류"); } finally { setIsAiLoading(false); }
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setSelectedArticle(null); setSelectedRoute(null); setAiResponse(null); setActiveAiTarget(null); setAuthMode(null); setIsProfileOpen(false); }} 
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === id && !authMode ? 'text-[#EAE5D9]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}
    >
      <Icon size={20} strokeWidth={activeTab === id && !authMode ? 2 : 1.5} />
      <span className="text-[9px] uppercase tracking-widest font-medium">{label}</span>
    </button>
  );

  const groupedRaces = () => {
    const filtered = siteContent.races.filter(r => raceTypeFilter === 'ALL' || r.type === raceTypeFilter);
    const groups = {};
    filtered.forEach(race => {
      const dateObj = new Date(race.date);
      const month = isNaN(dateObj.getTime()) ? "UPCOMING" : dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!groups[month]) groups[month] = [];
      groups[month].push(race);
    });
    return groups;
  };

  return (
    <div className="min-h-screen bg-[#151413] text-[#EAE5D9] font-sans selection:bg-[#EAE5D9] selection:text-[#151413]">
      <style>{`
        .leaflet-container { background: #151413 !important; border: none; } 
        .custom-pin { display: flex; align-items: center; justify-content: center; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
      
      {isWatchModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-sm w-full bg-[#1A1918] border border-[#EAE5D9]/10 p-10 rounded-sm shadow-2xl">
            <h3 className="text-2xl font-light italic mb-10 text-center text-[#EAE5D9]">Sync Your Gear</h3>
            <div className="space-y-4">
              {['Garmin', 'COROS', 'Apple Watch'].map(brand => (
                <button key={brand} onClick={() => {setConnectedDevice(brand); setIsWatchModalOpen(false);}} className="w-full flex justify-between items-center p-6 bg-[#EAE5D9]/5 border border-[#EAE5D9]/5 hover:border-[#EAE5D9]/30 transition-all group rounded-sm">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#EAE5D9]">{brand}</span>
                  <ChevronRight size={16} className="text-[#78716C] group-hover:text-[#EAE5D9] transition-colors" />
                </button>
              ))}
            </div>
            <button onClick={() => setIsWatchModalOpen(false)} className="w-full mt-12 text-[10px] uppercase tracking-[0.3em] text-[#78716C] hover:text-[#EAE5D9] transition-colors">Close</button>
          </div>
        </div>
      )}

      {(isAiLoading || isSyncing) && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 size={36} className="animate-spin text-[#EAE5D9] mb-8" />
          <p className="text-[11px] uppercase tracking-[0.5em] font-bold text-[#EAE5D9]">CALIBRATING...</p>
        </div>
      )}

      <header className={`fixed top-0 w-full z-[1000] transition-all duration-700 px-6 py-5 flex justify-between items-center ${scrolled ? 'bg-[#151413]/90 backdrop-blur-lg border-b border-[#EAE5D9]/5' : 'bg-gradient-to-b from-[#151413]/80 to-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.3em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setSelectedArticle(null); setAuthMode(null);}}>PESSAGE</h1>
        <div className="flex gap-5 items-center">
          {isLoggedIn ? (
            <>
              <div className={`text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full border transition-all ${connectedDevice ? 'border-[#C2410C]/40 text-[#C2410C] bg-[#C2410C]/10 font-bold' : 'border-[#EAE5D9]/20 text-[#78716C]'}`}>
                {connectedDevice ? connectedDevice.toUpperCase() : 'NO DEVICE'}
              </div>
              <button onClick={() => {setIsProfileOpen(!isProfileOpen); setAuthMode(null);}} className={`p-1.5 transition-all ${isProfileOpen ? 'text-[#EAE5D9]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><User size={20} /></button>
            </>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[10px] uppercase tracking-widest bg-[#EAE5D9] text-[#151413] px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-white active:scale-95 transition-all">SIGN IN</button>
          )}
        </div>
      </header>

      <main className="pb-40 pt-10">
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto animate-in slide-in-from-bottom-8 text-center">
             <h2 className="text-4xl font-light italic mb-12 text-[#EAE5D9]">Join the Pack</h2>
             <div className="space-y-4 mb-12">
                <button onClick={handleSocialLogin} className="w-full py-5 bg-transparent text-[#EAE5D9] text-[11px] font-bold tracking-[0.2em] border border-[#EAE5D9]/20 hover:border-[#EAE5D9]/60 transition-colors rounded-sm">GOOGLE CONNECT</button>
                <button onClick={handleSocialLogin} className="w-full py-5 bg-[#FEE500] text-black text-[11px] font-bold tracking-[0.2em] rounded-sm">KAKAO CONNECT</button>
                <button onClick={handleSocialLogin} className="w-full py-5 bg-[#03C75A] text-white text-[11px] font-bold tracking-[0.2em] rounded-sm">NAVER CONNECT</button>
             </div>
             <button onClick={() => setAuthMode(null)} className="text-[10px] uppercase tracking-widest text-[#78716C] hover:text-[#EAE5D9] border-b border-[#78716C] pb-1 transition-colors">Return</button>
          </section>
        ) : isProfileOpen && isLoggedIn ? (
          <section className="pt-32 px-6 max-w-2xl mx-auto animate-in slide-in-from-bottom-8">
             <div className="flex items-center gap-6 mb-12">
                <div className="w-20 h-20 rounded-full bg-[#292524] flex items-center justify-center border border-[#EAE5D9]/10">
                  <User size={32} className="text-[#A8A29E]" />
                </div>
                <div>
                  <h2 className="text-3xl font-light italic text-[#EAE5D9] mb-1">Patrick Jemin</h2>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#78716C]">Creative Director</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4 mb-16">
                <div className="bg-[#1A1918] p-8 border border-[#EAE5D9]/5 rounded-sm"><p className="text-[10px] text-[#78716C] uppercase tracking-widest mb-3">Ritual Score</p><span className="text-4xl font-light">92</span></div>
                <div className="bg-[#1A1918] p-8 border border-[#EAE5D9]/5 rounded-sm"><p className="text-[10px] text-[#78716C] uppercase tracking-widest mb-3">Total Mileage</p><span className="text-4xl font-light">128.4<span className="text-lg text-[#78716C] ml-1">km</span></span></div>
             </div>
             <button onClick={() => {setIsLoggedIn(false); setIsProfileOpen(false);}} className="w-full py-5 bg-[#C2410C]/10 text-[#C2410C] text-[10px] uppercase font-bold tracking-[0.3em] rounded-sm hover:bg-[#C2410C]/20 transition-colors">TERMINATE SESSION</button>
          </section>
        ) : (
          <>
            {activeTab === 'journal' && (
              <section className="px-4 md:px-6 animate-in fade-in duration-700">
                {selectedArticle ? (
                  <div className="pt-24 max-w-3xl mx-auto">
                    <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#78716C] text-[11px] uppercase tracking-widest mb-12 hover:text-[#EAE5D9] transition-colors"><ArrowLeft size={16} /> Back to Directory</button>
                    {selectedArticle.coverImage && (
                      <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden mb-16 rounded-sm border border-[#EAE5D9]/5 relative group">
                        <img src={urlFor(selectedArticle.coverImage)} alt="" className="w-full h-full object-cover transition-transform duration-[30s] group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#151413] via-transparent to-transparent opacity-80"></div>
                      </div>
                    )}
                    <h2 className="text-5xl md:text-6xl font-light italic mb-16 leading-[1.1] text-[#EAE5D9]">{selectedArticle.title}</h2>
                    <EditorialRenderer blocks={selectedArticle.content} />
                    <div className="h-40" />
                  </div>
                ) : (
                  <div className="pt-24 max-w-6xl mx-auto">
                    {siteContent.articles.length > 0 ? (
                      <>
                        {(() => {
                          const heroArticle = siteContent.articles[0];
                          return (
                            <div 
                              onClick={() => setSelectedArticle(heroArticle)} 
                              className="group cursor-pointer relative mb-24 md:mb-32 block overflow-hidden rounded-sm border border-[#EAE5D9]/10"
                            >
                              <div className="w-full aspect-square md:aspect-[21/9] bg-[#1A1918] relative">
                                {heroArticle.coverImage && (
                                  <img 
                                    src={urlFor(heroArticle.coverImage)} 
                                    className="w-full h-full object-cover transition-transform duration-[30s] group-hover:scale-105" 
                                    alt={heroArticle.title}
                                  />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#151413] via-[#151413]/40 to-transparent"></div>
                              </div>
                              <div className="absolute bottom-10 left-8 md:bottom-16 md:left-16 z-10 w-[90%] md:w-2/3">
                                <p className="text-[10px] tracking-[0.4em] uppercase mb-4 text-[#A8A29E] font-bold">{heroArticle.subtitle || 'Latest Feature'}</p>
                                <h2 className="text-4xl md:text-7xl font-light italic leading-[1.1] text-[#EAE5D9] group-hover:text-white transition-colors duration-500 mb-8">{heroArticle.title}</h2>
                                <button className="text-[11px] uppercase tracking-[0.3em] font-bold border-b border-[#EAE5D9]/30 pb-1.5 group-hover:border-[#EAE5D9] transition-colors">Read the Story</button>
                              </div>
                            </div>
                          );
                        })()}

                        {siteContent.articles.length > 1 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16 pb-20">
                            {siteContent.articles.slice(1).map(article => (
                              <div key={article._id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer flex flex-col">
                                <div className="w-full aspect-[4/3] bg-[#1A1918] overflow-hidden rounded-sm mb-6 border border-[#EAE5D9]/5 relative">
                                  {article.coverImage && (
                                    <img 
                                      src={urlFor(article.coverImage)} 
                                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                                      alt={article.title}
                                    />
                                  )}
                                  <div className="absolute inset-0 bg-[#151413]/10 group-hover:bg-transparent transition-colors duration-700"></div>
                                </div>
                                <p className="text-[9px] tracking-[0.4em] uppercase mb-3 text-[#78716C] font-bold">{article.subtitle || 'Volume'}</p>
                                <h3 className="text-3xl md:text-4xl font-light italic leading-tight text-[#EAE5D9]/90 group-hover:text-[#EAE5D9] transition-colors duration-300">{article.title}</h3>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-[60vh] flex flex-col items-center justify-center text-[#78716C] italic gap-6">
                        <Loader2 size={40} className="animate-spin text-[#EAE5D9]/30" />
                        <p className="tracking-widest uppercase text-[10px] font-bold">Curating Editorial...</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'routes' && (
              <section className="pt-28 px-6 max-w-5xl mx-auto animate-in slide-in-from-bottom-8">
                {selectedRoute ? (
                  <div className="max-w-2xl mx-auto">
                    <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[#78716C] text-[11px] uppercase tracking-widest mb-12 hover:text-[#EAE5D9] transition-colors"><ArrowLeft size={16} /> Directory</button>
                    <div className="flex justify-between items-end mb-16 border-b border-[#EAE5D9]/10 pb-12">
                      <div>
                        <span className={`text-[10px] px-4 py-1.5 rounded-full border mb-6 inline-block font-bold tracking-[0.2em] ${selectedRoute.type === 'TRAIL' ? 'text-[#C2410C] border-[#C2410C]/30 bg-[#C2410C]/5' : 'text-[#A8A29E] border-[#A8A29E]/30 bg-[#A8A29E]/5'}`}>{selectedRoute.type}</span>
                        <h2 className="text-5xl font-light italic text-[#EAE5D9] leading-tight">{selectedRoute.name}</h2>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[#78716C] uppercase tracking-widest mb-2 font-bold">Distance</p>
                        <p className="text-3xl font-light text-[#EAE5D9]">{selectedRoute.distance}</p>
                      </div>
                    </div>

                    <div className="mb-24"><EditorialRenderer blocks={selectedRoute.description} /></div>

                    <div className="bg-[#1A1918] p-8 border border-[#EAE5D9]/5 rounded-sm text-center mb-20">
                      <Compass size={32} className="mx-auto text-[#78716C] mb-6" />
                      <h3 className="text-xl font-light italic mb-8 text-[#EAE5D9]">Sync Route to Device</h3>
                      <button 
                        onClick={() => handleSyncGPX(selectedRoute._id)}
                        className={`w-full py-5 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${activeAiTarget === selectedRoute._id && syncSuccess ? 'bg-[#166534] text-[#EAE5D9]' : 'bg-[#EAE5D9] text-[#151413] hover:bg-white'}`}
                      >
                        {activeAiTarget === selectedRoute._id && syncSuccess ? <CheckCircle2 size={18} /> : <Watch size={18} />}
                        {activeAiTarget === selectedRoute._id && syncSuccess ? 'GPX Synced' : 'Send to Watch'}
                      </button>
                    </div>
                    <div className="h-20" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div>
                          <h2 className="text-4xl font-light italic mb-3 text-[#EAE5D9]">Narrative Explorer</h2>
                          <p className="text-[#78716C] text-sm italic">지도로 탐색하는 러너들의 서사.</p>
                        </div>
                        <div className="flex bg-[#1A1918] p-1.5 rounded-sm border border-[#EAE5D9]/5">
                            <button onClick={() => {setRouteViewMode('LIST'); setMapPopup(null);}} className={`px-6 py-2 rounded-sm text-[11px] font-bold tracking-widest transition-all ${routeViewMode === 'LIST' ? 'bg-[#EAE5D9] text-[#151413]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><List size={14} className="inline mr-2 -mt-0.5"/> LIST</button>
                            <button onClick={() => setRouteViewMode('MAP')} className={`px-6 py-2 rounded-sm text-[11px] font-bold tracking-widest transition-all ${routeViewMode === 'MAP' ? 'bg-[#EAE5D9] text-[#151413]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><MapIcon size={14} className="inline mr-2 -mt-0.5"/> MAP</button>
                        </div>
                    </div>
                    
                    <div className="mb-12">
                        <div className="flex gap-8 border-b border-[#EAE5D9]/10 pb-5 mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar">
                            {['ALL', 'ORIGINAL', 'TRAIL', 'ROAD'].map(t => (<button key={t} onClick={() => setRouteTypeFilter(t)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${routeTypeFilter === t ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450] hover:text-[#A8A29E]'}`}>{t}</button>))}
                        </div>
                        <div className="flex gap-8 border-b border-[#EAE5D9]/10 pb-5 overflow-x-auto whitespace-nowrap hide-scrollbar">
                            {['ALL', 'SEOUL', 'GYEONGGI', 'GANGWON', 'CHUNGCHEONG', 'GYEONGSANG', 'JEJU'].map(r => (<button key={r} onClick={() => setRouteRegionFilter(r)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${routeRegionFilter === r ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450] hover:text-[#A8A29E]'}`}>{r}</button>))}
                        </div>
                    </div>

                    {routeViewMode === 'MAP' ? (
                      <div className="relative animate-in fade-in duration-700 min-h-[500px]">
                        <div ref={mapRef} className="w-full aspect-square md:aspect-[21/9] bg-[#1A1918] rounded-sm overflow-hidden border border-[#EAE5D9]/5 shadow-2xl" />
                        {mapPopup && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-[#151413]/95 backdrop-blur-md border border-[#EAE5D9]/10 p-8 rounded-sm shadow-2xl z-[2000] animate-in zoom-in-95 text-center">
                              <p className={`text-[9px] uppercase tracking-[0.3em] mb-3 font-bold ${mapPopup.type === 'TRAIL' ? 'text-[#C2410C]' : 'text-[#A8A29E]'}`}>{mapPopup.type} • {mapPopup.region}</p>
                              <h4 className="text-2xl font-light italic mb-8 leading-tight text-[#EAE5D9]">{mapPopup.name}</h4>
                              <button onClick={() => setSelectedRoute(mapPopup)} className="w-full py-4 bg-[#EAE5D9] text-[#151413] text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm">Explore Course</button>
                              <button onClick={() => setMapPopup(null)} className="mt-5 text-[10px] text-[#78716C] uppercase tracking-widest hover:text-[#EAE5D9] transition-colors">Close</button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {siteContent.routes.length > 0 ? siteContent.routes.filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && (routeRegionFilter === 'ALL' || r.region === routeRegionFilter)).map(route => (
                          <div key={route._id} onClick={() => setSelectedRoute(route)} className="p-8 md:p-10 bg-[#1A1918] border border-[#EAE5D9]/5 flex justify-between items-center cursor-pointer hover:border-[#EAE5D9]/20 transition-all duration-300 group rounded-sm shadow-lg">
                              <div>
                                <p className={`text-[10px] uppercase font-bold tracking-[0.3em] mb-3 ${route.type === 'TRAIL' ? 'text-[#C2410C]' : 'text-[#A8A29E]'}`}>{route.type} / {route.region}</p>
                                <h4 className="text-2xl md:text-3xl font-light italic group-hover:text-[#EAE5D9] text-[#EAE5D9]/90 transition-colors">{route.name}</h4>
                              </div>
                              <span className="text-2xl font-light text-[#78716C] group-hover:text-[#EAE5D9] transition-colors">{route.distance}</span>
                          </div>
                        )) : (
                          <div className="py-32 text-center text-[#78716C] italic text-lg">해당 조건의 서사가 아직 기록되지 않았습니다.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'sessions' && (
              <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
                <div className="mb-16">
                  <h2 className="text-4xl font-light italic mb-8 text-[#EAE5D9]">Race Calendar</h2>
                  <div className="flex gap-8 border-b border-[#EAE5D9]/10 pb-5 mb-12 overflow-x-auto whitespace-nowrap hide-scrollbar">
                    {['ALL', 'TRAIL', 'ROAD'].map(type => (<button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${raceTypeFilter === type ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450] hover:text-[#A8A29E]'}`}>{type}</button>))}
                  </div>
                </div>

                <div className="space-y-24">
                  {Object.entries(groupedRaces()).map(([month, monthRaces]) => (
                    <div key={month} className="animate-in fade-in">
                       <div className="flex items-center gap-4 mb-10">
                          <Calendar size={16} className="text-[#A8A29E]" />
                          <h3 className="text-[12px] uppercase tracking-[0.4em] font-bold text-[#A8A29E]">{month}</h3>
                          <div className="h-[1px] bg-[#EAE5D9]/10 flex-1"></div>
                       </div>
                       <div className="space-y-16">
                          {monthRaces.map(race => (
                            <div key={race._id || race.id} className="group border-l-2 border-[#EAE5D9]/10 pl-8 md:pl-12 relative hover:border-[#EAE5D9]/50 transition-colors duration-500">
                               <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-[#C2410C]' : 'bg-[#A8A29E]'}`}></div>
                               <h3 className="text-3xl md:text-4xl font-light italic mb-5 text-[#EAE5D9]">{race.name}</h3>
                               <p className="text-[15px] text-[#A8A29E] font-light leading-relaxed max-w-2xl mb-10">{race.description}</p>
                               <div className="flex flex-wrap gap-4">
                                  <button onClick={() => generateAiContent(race.name, `${race.name} 대회의 트레일/로드 전략을 어시(Earthy)하고 철학적인 톤앤매너 매거진 스타일로 3문장 이내로 작성해줘.`)} className="flex items-center gap-3 bg-[#EAE5D9]/5 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm hover:bg-[#EAE5D9]/10 transition-all text-[#EAE5D9]"><Sparkles size={14} /> AI Strategy</button>
                                  <button onClick={() => handleSyncGPX(race._id)} className={`flex items-center gap-3 py-4 px-8 text-[10px] uppercase font-bold tracking-[0.2em] border transition-all rounded-sm ${activeAiTarget === race._id && syncSuccess ? 'bg-[#166534] border-[#166534] text-[#EAE5D9]' : 'border-[#EAE5D9]/20 text-[#A8A29E] hover:border-[#EAE5D9] hover:text-[#EAE5D9]'}`}>{activeAiTarget === race._id && syncSuccess ? <CheckCircle2 size={14} /> : <Watch size={14} />} {activeAiTarget === race._id && syncSuccess ? 'Synced' : 'Sync Event'}</button>
                               </div>
                               {activeAiTarget === race.name && aiResponse && (
                                 <div className="mt-8 p-8 bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm italic text-[15px] text-[#EAE5D9]/80 font-light leading-[1.8] animate-in slide-in-from-top-4">
                                   "{aiResponse}"
                                 </div>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'gear' && (
              <section className="pt-28 px-6 max-w-5xl mx-auto animate-in fade-in">
                <div className="mb-16 flex flex-col justify-between items-start gap-8 border-b border-[#EAE5D9]/10 pb-8">
                  <div>
                    <h2 className="text-4xl font-light italic mb-3 text-[#EAE5D9]">Essential Tools</h2>
                    <p className="text-[#A8A29E] text-sm italic tracking-wide">디렉터 제민의 시선으로 큐레이션된, 기능과 미학의 교차점.</p>
                  </div>
                  <div className="flex gap-6 overflow-x-auto whitespace-nowrap hide-scrollbar w-full">
                    {['ALL', 'PACK', 'APPAREL', 'EYEWEAR', 'ACCESSORY'].map(cat => (<button key={cat} onClick={() => setGearFilter(cat)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all px-4 py-2 rounded-full border ${gearFilter === cat ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'text-[#78716C] border-transparent hover:border-[#EAE5D9]/20'}`}>{cat}</button>))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
                  {siteContent.gearItems.filter(item => gearFilter === 'ALL' || item.category === gearFilter).map(item => (
                    <div key={item._id} className="group">
                      <div className="aspect-[4/5] bg-[#1A1918] border border-[#EAE5D9]/5 overflow-hidden rounded-sm mb-8 relative">
                        {item.image && <img src={urlFor(item.image)} className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-105" alt={item.name} />}
                        <div className="absolute inset-0 bg-[#151413]/10 group-hover:bg-transparent transition-colors duration-700"></div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-3 text-[#A8A29E] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#C2410C] rounded-full inline-block"></span>
                          {item.brand}
                        </p>
                        <h3 className="text-3xl font-light italic mb-6 text-[#EAE5D9] group-hover:text-white transition-colors">{item.name}</h3>
                        <p className="text-[15px] leading-[1.8] text-[#78716C] italic font-light">"{item.note}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'recovery' && (
              <section className="px-6 pt-32 max-w-3xl mx-auto text-center animate-in slide-in-from-bottom-8">
                <h2 className="text-4xl font-light italic mb-12 text-[#EAE5D9]">Recovery Ritual</h2>
                
                <div className="py-24 border border-dashed border-[#EAE5D9]/20 rounded-sm relative bg-[#1A1918]/50">
                  {connectedDevice ? (
                    <div className="animate-in fade-in px-8">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                          <div className="bg-[#151413] p-8 border border-[#EAE5D9]/10 rounded-sm shadow-xl">
                             <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-6 font-bold">Body Battery</p>
                             <div className="text-6xl font-light mb-4 text-[#EAE5D9]">42</div>
                             <p className="text-[10px] text-[#C2410C] uppercase font-bold tracking-widest">Needs Recovery</p>
                          </div>
                          <div className="bg-[#151413] p-8 border border-[#EAE5D9]/10 rounded-sm shadow-xl">
                             <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-6 font-bold">Data Source</p>
                             <div className="text-2xl font-light uppercase tracking-widest mt-6 text-[#EAE5D9]">{connectedDevice}</div>
                          </div>
                          <div className="bg-[#151413] p-8 border border-[#EAE5D9]/10 rounded-sm shadow-xl">
                             <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-6 font-bold">Last Run</p>
                             <div className="text-2xl font-light mt-6 text-[#EAE5D9]">18.2<span className="text-sm ml-1 text-[#78716C]">km</span></div>
                          </div>
                       </div>
                       <button onClick={() => generateAiContent('recovery', '오늘 러닝 후 사우나와 관련된 회복(Recovery) 리추얼을 프리미엄 라이프스타일 매거진 톤으로 짧고 감각적이게 추천해줘.')} className="px-12 py-5 bg-[#EAE5D9] text-[#151413] font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-2xl hover:bg-white active:scale-95 transition-all">Curate My Ritual</button>
                       {activeAiTarget === 'recovery' && aiResponse && (
                          <div className="mt-16 p-8 border border-[#EAE5D9]/5 bg-[#151413] text-[15px] italic text-[#EAE5D9]/90 font-light leading-[1.8] max-w-lg mx-auto rounded-sm">
                             "{aiResponse}"
                          </div>
                       )}
                       <button onClick={handleDeviceConnectClick} className="mt-16 text-[10px] uppercase tracking-[0.3em] text-[#78716C] hover:text-[#EAE5D9] block mx-auto border-b border-[#78716C] pb-1 transition-colors">Switch Device</button>
                    </div>
                  ) : (
                    <div className="animate-in fade-in">
                       <WatchIcon size={48} className="mx-auto mb-8 text-[#5A5450] animate-pulse"/>
                       <p className="text-[15px] text-[#A8A29E] mb-12 leading-[1.8] font-light italic max-w-sm mx-auto">
                         거친 트레일의 끝,<br/>당신의 심박수와 피로도를 동기화하여<br/>완벽한 회복의 서사를 완성하세요.
                       </p>
                       <button onClick={handleDeviceConnectClick} className="px-12 py-5 bg-[#EAE5D9] text-[#151413] font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-2xl hover:bg-white active:scale-95 transition-all">Connect Device</button>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <nav className="fixed bottom-0 w-full z-[1001] px-6 md:px-16 py-6 bg-[#151413]/95 backdrop-blur-2xl border-t border-[#EAE5D9]/5 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
