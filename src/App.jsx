import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, ArrowLeft, 
  Map as MapIcon, List, Calendar, Smartphone as WatchIcon, Quote,
  Bookmark, BookmarkCheck, ExternalLink
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
    { 
      _id: 'r1', name: 'Seoul Forest to Namsan', type: 'ROAD', region: 'SEOUL', distance: '12.5 km', lat: 37.5443, lng: 127.0374, 
      description: [{_type:'block', style:'normal', children:[{text:'단풍과 고층 빌딩이 교차하는 마법 같은 코스. 남산의 고도를 오르며 진정한 심박수를 마주합니다.'}]}],
      mockCoords: [[37.5443, 127.0374], [37.5460, 127.0350], [37.5480, 127.0310], [37.5500, 127.0250], [37.5520, 127.0200], [37.5511, 126.9882]]
    },
    { 
      _id: 'r2', name: 'Hallasan Yeongsil Trail', type: 'TRAIL', region: 'JEJU', distance: '18.2 km', lat: 33.3614, lng: 126.5292, 
      description: [{_type:'block', style:'normal', children:[{text:'원시림의 숨결을 그대로 느낄 수 있는 궁극의 트레일. 거친 현무암 위를 달리는 야생의 감각을 선사합니다.'}]}],
      mockCoords: [[33.3614, 126.5292], [33.3630, 126.5300], [33.3650, 126.5320], [33.3680, 126.5330], [33.3720, 126.5350]]
    }
  ],
  races: [
    { _id: 'race1', name: 'Trans Jeju 100K', date: '2026-10-12', registrationDate: '2026.04 오픈 예정', registrationUrl: 'https://transjeju.com', type: 'TRAIL', description: '화산섬의 척박한 땅을 달리는 국내 최대의 울트라 트레일 대제전.' },
    { _id: 'race2', name: 'UTMB Mont-Blanc', date: '2026-08-28', registrationDate: '추첨 접수 완료', registrationUrl: 'https://utmb.world', type: 'TRAIL', description: '알프스의 심장부를 관통하는 트레일 러너들의 궁극적인 성지.' },
    { _id: 'race3', name: 'Seoul Marathon', date: '2026-03-15', registrationDate: '2025.06 선착순 마감', registrationUrl: 'http://seoul-marathon.com', type: 'ROAD', description: '광화문에서 잠실종합운동장으로 이어지는 역사적인 로드 레이스.' }
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
  
  const [savedItems, setSavedItems] = useState({ articles: [], gear: [] });
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

  // Map Refs
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerGroupRef = useRef(null);
  const gpxLayerRef = useRef(null); 

  const detailMapRef = useRef(null);
  const detailLeafletMap = useRef(null);
  const detailGpxLayerRef = useRef(null);

  // --- 1. CMS 데이터 페칭 & 📍 GPX 자동 좌표 추출 ---
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

        const enrichRoutesWithGpxCoordinates = async (routes) => {
          return Promise.all(routes.map(async (route) => {
            if ((!route.lat || !route.lng) && route.gpxUrl) {
              try {
                const res = await fetch(route.gpxUrl);
                const text = await res.text();
                const xml = new DOMParser().parseFromString(text, "text/xml");
                const firstPoint = xml.getElementsByTagName("trkpt")[0] || xml.getElementsByTagName("wpt")[0];
                if (firstPoint) {
                  return {
                    ...route,
                    lat: parseFloat(firstPoint.getAttribute("lat")),
                    lng: parseFloat(firstPoint.getAttribute("lon"))
                  };
                }
              } catch (e) { console.warn(`GPX Auto-extraction failed`, e); }
            }
            return route;
          }));
        };

        const fetchedRoutes = data.routes?.length > 0 ? data.routes : FALLBACK_DATA.routes;
        const finalEnrichedRoutes = await enrichRoutesWithGpxCoordinates(fetchedRoutes);

        setSiteContent({
          articles: data.articles?.length > 0 ? data.articles : FALLBACK_DATA.articles,
          routes: finalEnrichedRoutes,
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

  // --- 3. 메인 맵 마커 렌더링 ---
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

  // --- 4. 메인 맵 초기화 ---
  useEffect(() => {
    if (activeTab === 'routes' && !selectedRoute && routeViewMode === 'MAP' && isMapLoaded && mapRef.current) {
      const L = window.L;
      if (!leafletMap.current) {
        const map = L.map(mapRef.current, { center: [36.5, 127.8], zoom: 7, zoomControl: false, attributionControl: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        leafletMap.current = map;
        markerGroupRef.current = L.layerGroup().addTo(map);
      }
      const mapInstance = leafletMap.current;
      updateMapMarkers();
      if (gpxLayerRef.current) { gpxLayerRef.current.remove(); gpxLayerRef.current = null; }
      if (mapPopup) {
        const drawPreviewLine = async () => {
          let coords = mapPopup.mockCoords || [];
          if (mapPopup.gpxUrl && coords.length === 0) {
            try {
              const res = await fetch(mapPopup.gpxUrl);
              const text = await res.text();
              const xml = new DOMParser().parseFromString(text, "text/xml");
              const trkpts = xml.getElementsByTagName("trkpt");
              for(let i=0; i<trkpts.length; i++) {
                coords.push([parseFloat(trkpts[i].getAttribute("lat")), parseFloat(trkpts[i].getAttribute("lon"))]);
              }
            } catch(e) {}
          }
          if (coords.length > 0 && leafletMap.current === mapInstance) {
            const lineColor = mapPopup.type === 'TRAIL' ? '#C2410C' : '#A8A29E';
            gpxLayerRef.current = L.polyline(coords, { color: lineColor, weight: 3, opacity: 0.7, dashArray: '5, 8' }).addTo(mapInstance);
          }
        };
        drawPreviewLine();
      }
      const t1 = setTimeout(() => { if (leafletMap.current) leafletMap.current.invalidateSize(); }, 100);
      return () => clearTimeout(t1);
    } else if (leafletMap.current && (activeTab !== 'routes' || routeViewMode !== 'MAP' || selectedRoute)) {
      leafletMap.current.remove(); leafletMap.current = null;
    }
  }, [activeTab, routeViewMode, isMapLoaded, updateMapMarkers, mapPopup, selectedRoute]);

  // --- 5. 상세 페이지 맵 ---
  useEffect(() => {
    if (activeTab === 'routes' && selectedRoute && detailMapRef.current && isMapLoaded) {
      const L = window.L;
      if (!detailLeafletMap.current) {
        const map = L.map(detailMapRef.current, { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);
        detailLeafletMap.current = map;
      }
      const mapInstance = detailLeafletMap.current;
      const drawImmersiveLine = async () => {
        let coords = selectedRoute.mockCoords || [];
        if (selectedRoute.gpxUrl && coords.length === 0) {
          try {
            const res = await fetch(selectedRoute.gpxUrl);
            const text = await res.text();
            const xml = new DOMParser().parseFromString(text, "text/xml");
            const trkpts = xml.getElementsByTagName("trkpt");
            for(let i=0; i<trkpts.length; i++) { coords.push([parseFloat(trkpts[i].getAttribute("lat")), parseFloat(trkpts[i].getAttribute("lon"))]); }
          } catch(e) {}
        }
        if (coords.length > 0 && detailLeafletMap.current === mapInstance) {
          if (detailGpxLayerRef.current) detailGpxLayerRef.current.remove();
          const lineColor = selectedRoute.type === 'TRAIL' ? '#C2410C' : '#EAE5D9';
          detailGpxLayerRef.current = L.polyline(coords, { color: lineColor, weight: 4, opacity: 0.9 }).addTo(mapInstance);
          mapInstance.fitBounds(detailGpxLayerRef.current.getBounds(), { padding: [50, 50] });
        } else if (selectedRoute.lat && selectedRoute.lng) {
          mapInstance.setView([selectedRoute.lat, selectedRoute.lng], 13);
        }
      };
      drawImmersiveLine();
      const t1 = setTimeout(() => { if (detailLeafletMap.current) detailLeafletMap.current.invalidateSize(); }, 150);
      return () => clearTimeout(t1);
    }
  }, [activeTab, selectedRoute, isMapLoaded]);

  // --- 6. 액션 핸들러 ---
  const handleSocialLogin = () => { setIsAiLoading(true); setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); }, 1500); };
  const toggleSave = (e, type, item) => { e.stopPropagation(); if (!isLoggedIn) { setAuthMode('login'); return; } setSavedItems(prev => { const isSaved = prev[type].some(i => i._id === item._id); if (isSaved) return { ...prev, [type]: prev[type].filter(i => i._id !== item._id) }; else return { ...prev, [type]: [...prev[type], item] }; }); };
  const isItemSaved = (type, id) => savedItems[type].some(i => i._id === id);
  const handleDeviceConnectClick = () => { if (!isLoggedIn) setAuthMode('login'); else setIsWatchModalOpen(true); };
  const handleSyncGPX = (targetId) => { if (!isLoggedIn) { setAuthMode('login'); return; } if (!connectedDevice) { setIsWatchModalOpen(true); return; } setActiveAiTarget(targetId); setIsSyncing(true); setTimeout(() => { setIsSyncing(false); setSyncSuccess(true); setTimeout(() => { setSyncSuccess(false); setActiveAiTarget(null); }, 3000); }, 2000); };
  const generateAiContent = async (target, prompt) => { if (!apiKey) return; setIsAiLoading(true); setActiveAiTarget(target); try { const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }); const data = await response.json(); setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "에러"); } catch (e) { setAiResponse("오류"); } finally { setIsAiLoading(false); } };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(id); setSelectedArticle(null); setSelectedRoute(null); setAiResponse(null); setActiveAiTarget(null); setAuthMode(null); setIsProfileOpen(false); }} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === id && !authMode && !isProfileOpen ? 'text-[#EAE5D9]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><Icon size={20} /><span className="text-[9px] uppercase tracking-widest font-medium">{label}</span></button>
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
        .custom-pin { display: flex; align-items: center; justify-content: center; transition: transform 0.3s; cursor: pointer; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>

      {/* 헤더 & 네비게이션은 기존과 동일 */}
      <header className={`fixed top-0 w-full z-[1000] transition-all duration-700 px-6 py-5 flex justify-between items-center ${scrolled ? 'bg-[#151413]/90 backdrop-blur-lg border-b border-[#EAE5D9]/5' : 'bg-gradient-to-b from-[#151413]/80 to-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.3em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setSelectedArticle(null); setAuthMode(null); setIsProfileOpen(false);}}>PESSAGE</h1>
        <div className="flex gap-5 items-center">
          {isLoggedIn ? (
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-1.5 text-[#78716C] hover:text-[#EAE5D9]"><User size={20} /></button>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[10px] uppercase tracking-widest bg-[#EAE5D9] text-[#151413] px-6 py-2.5 rounded-full font-bold">SIGN IN</button>
          )}
        </div>
      </header>

      <main className="pb-40 pt-10">
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto text-center">
             <h2 className="text-4xl font-light italic mb-12">Join the Pack</h2>
             <button onClick={handleSocialLogin} className="w-full py-5 border border-[#EAE5D9]/20 text-[11px] font-bold tracking-[0.2em] mb-4">GOOGLE CONNECT</button>
             <button onClick={() => setAuthMode(null)} className="text-[10px] uppercase text-[#78716C] border-b border-[#78716C]">Return</button>
          </section>
        ) : activeTab === 'sessions' ? (
          /* 🏁 SESSIONS TAB: 신규 필드 적용 */
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
                        <div key={race._id} className="group border-l-2 border-[#EAE5D9]/10 pl-8 md:pl-12 relative hover:border-[#EAE5D9]/50 transition-colors duration-500">
                           <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-[#C2410C]' : 'bg-[#A8A29E]'}`}></div>
                           
                           {/* 날짜 & 타입 배지 */}
                           <div className="flex items-center gap-3 mb-3">
                             <span className="text-[10px] text-[#78716C] font-mono tracking-tighter">{race.date}</span>
                             <span className={`text-[8px] px-2 py-0.5 rounded-sm font-bold tracking-widest border ${race.type === 'TRAIL' ? 'text-[#C2410C] border-[#C2410C]/30' : 'text-[#A8A29E] border-[#A8A29E]/30'}`}>{race.type}</span>
                           </div>

                           <h3 className="text-3xl md:text-4xl font-light italic mb-5 text-[#EAE5D9]">{race.name}</h3>
                           
                           {/* 💡 신규 필드: 접수 기간 */}
                           {race.registrationDate && (
                             <div className="flex items-center gap-2 mb-6">
                               <CheckCircle2 size={12} className="text-[#C2410C]" />
                               <p className="text-[11px] uppercase tracking-widest text-[#C2410C] font-bold">Registration: {race.registrationDate}</p>
                             </div>
                           )}

                           <p className="text-[15px] text-[#A8A29E] font-light leading-relaxed max-w-2xl mb-10">{race.description}</p>
                           
                           <div className="flex flex-wrap gap-4">
                              <button onClick={() => generateAiContent(race.name, `${race.name} 대회의 전략을 매거진 톤으로 작성해줘.`)} className="flex items-center gap-3 bg-[#EAE5D9]/5 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#EAE5D9]"><Sparkles size={14} /> AI Strategy</button>
                              
                              {/* 💡 신규 필드: 접수처 링크 */}
                              {race.registrationUrl && (
                                <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#EAE5D9] px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#151413] hover:bg-white transition-all shadow-lg">
                                  Official Link <ExternalLink size={14} />
                                </a>
                              )}

                              <button onClick={() => handleSyncGPX(race._id)} className={`flex items-center gap-3 py-4 px-8 text-[10px] uppercase font-bold tracking-[0.2em] border transition-all rounded-sm border-[#EAE5D9]/20 text-[#A8A29E] hover:border-[#EAE5D9] hover:text-[#EAE5D9]`}>
                                {activeAiTarget === race._id && syncSuccess ? <CheckCircle2 size={14} /> : <Watch size={14} />} 
                                {activeAiTarget === race._id && syncSuccess ? 'Synced' : 'Sync Event'}
                              </button>
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
        ) : (
          /* Journal, Routes, Gear, Recovery (기존 로직 유지) */
          <section className="px-6 text-center pt-32 text-[#78716C] italic font-light">
             {activeTab.toUpperCase()} Section - 에디토리얼 로딩 중...
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 w-full z-[1001] px-6 py-6 bg-[#151413]/95 backdrop-blur-2xl border-t border-[#EAE5D9]/5 flex justify-between items-center shadow-2xl">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
