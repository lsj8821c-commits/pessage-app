import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass, ShoppingBag, Wind, User, ChevronRight, Activity,
  Flag, Watch, CheckCircle2, Sparkles, Loader2, ArrowLeft, ArrowRight,
  Map as MapIcon, List, Calendar, Smartphone as WatchIcon, Quote,
  Bookmark, BookmarkCheck, ExternalLink, Pencil, Download, MapPin
} from 'lucide-react';
import { loginWithGoogle, loginWithKakao, loginWithNaver, loginWithStrava, logout, onAuthChange, updateUserProfile } from './firebase';

const formatPace = (secsPerKm) => {
  if (!secsPerKm) return '—';
  const mins = Math.floor(secsPerKm / 60);
  const secs = secsPerKm % 60;
  return `${mins}'${String(secs).padStart(2, '0')}"`;
};

// Ritual Score 계산 (Strava 데이터 기반, 최대 100점)
const calcRitualScore = (stravaData) => {
  if (!stravaData) return null;
  let score = 0;
  // 이번 주 활동 횟수 (최대 40점)
  const weekCount = stravaData.weeklyStats?.count || 0;
  if (weekCount >= 4) score += 40;
  else if (weekCount === 3) score += 30;
  else if (weekCount === 2) score += 20;
  else if (weekCount >= 1) score += 10;
  // 연속 활동 주 수 (최대 30점)
  const consecutive = stravaData.consecutiveWeeks || 0;
  if (consecutive >= 3) score += 30;
  else if (consecutive === 2) score += 20;
  else if (consecutive >= 1) score += 10;
  // 적정 심박수 유지 140~165 bpm (30점)
  const avgHR = stravaData.lastRun?.average_heartrate;
  if (avgHR && avgHR >= 140 && avgHR <= 165) score += 30;
  return score;
};

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
    { _id: 'g1', category: 'PACK', brand: 'PORTAL', name: 'Trail Running Belt', note: '가장 필요한 것만 남긴 미니멀리즘. 허리선을 완벽히 감싸는 안정감.', image: { isLocal: true, url: '포탈-러닝벨트.jpg' } },
    { _id: 'g2', category: 'APPAREL', brand: 'PORTAL', name: 'Womens Running Kit', note: '비에 젖은 숲속에서도 고요하게 빛나는 어시(Earthy) 그린의 우아함.', image: { isLocal: true, url: 'Portal-Running-Kit-Womens.webp' } },
    { _id: 'g3', category: 'EYEWEAR', brand: 'DISTRICT VISION', name: 'Keiichi Standard', note: '빛을 통제하는 자가 트레일을 지배한다. 디렉터의 필수품.', image: { isLocal: true, url: '포탈-디렉터-패트릭-스탱바이.jpg' } },
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
    { _id: 'race3', name: 'Seoul Marathon', date: '2026-03-15', registrationDate: '2025.06 선착순 마감', registrationUrl: 'http://seoul-marathon.com', type: 'ROAD', description: '광화문에서 잠실까지, 서울의 랜드마크를 가로지르는 역사적인 레이스.' }
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
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  
  const [savedItems, setSavedItems] = useState({ articles: [], gear: [] });
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedGear, setSelectedGear] = useState(null);
  
  const [routeViewMode, setRouteViewMode] = useState('LIST'); 
  const [routeTypeFilter, setRouteTypeFilter] = useState('ALL');
  const [routeRegionFilter, setRouteRegionFilter] = useState('ALL');
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [gearFilter, setGearFilter] = useState('ALL');
  const [journalCategoryFilter, setJournalCategoryFilter] = useState('ALL');

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeAiTarget, setActiveAiTarget] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapPopup, setMapPopup] = useState(null);
  const [stravaData, setStravaData] = useState(() => {
    try { const s = sessionStorage.getItem('strava_data'); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

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
        "articles": *[_type == "journal"] { ..., category, subtitle } | order(publishedAt desc),
        "routes": *[_type == "route"] { ..., "gpxUrl": gpxFile.asset->url, "gallery": images[].asset->url, elevationGain, difficulty, body, "spots": spots[]{ name, type, address, body, "images": images[].asset->url } },
        "gearItems": *[_type == "gear"] { ..., slug, body } | order(publishedAt desc),
        "races": *[_type == "session"] { ..., location } | order(date asc)
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
              } catch (e) {
                console.warn(`GPX Auto-extraction failed for route: ${route.name}`, e);
              }
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

  // --- gear 뒤로가기 popstate 처리 ---
  useEffect(() => {
    const handlePopState = () => {
      if (!window.location.pathname.startsWith('/gear/')) {
        setSelectedGear(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // --- ✅ Firebase 로그인 상태 감지 ---
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        setAuthMode(null);
      } else {
        const kakaoUser = sessionStorage.getItem('kakao_user');
        const naverUser = sessionStorage.getItem('naver_user');
        if (kakaoUser) {
          const parsed = JSON.parse(kakaoUser);
          setCurrentUser({ displayName: parsed.name, email: parsed.email, photoURL: parsed.photo });
          setIsLoggedIn(true);
        } else if (naverUser) {
          const parsed = JSON.parse(naverUser);
          setCurrentUser({ displayName: parsed.name, email: parsed.email, photoURL: parsed.photo });
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Kakao OAuth 콜백 처리 ---
  useEffect(() => {
    if (window.location.pathname !== '/auth/kakao/callback') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/kakao/callback`;
        const res = await fetch('/api/kakao/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        });
        const user = await res.json();
        if (user.id) {
          sessionStorage.setItem('kakao_user', JSON.stringify(user));
          setCurrentUser({ displayName: user.name, email: user.email, photoURL: user.photo });
          setIsLoggedIn(true);
          setAuthMode(null);
        }
      } catch (e) {
        console.error('Kakao callback error:', e);
      } finally {
        window.history.replaceState({}, '', '/');
      }
    };
    exchangeCode();
  }, []);

  // --- Naver OAuth 콜백 처리 ---
  useEffect(() => {
    if (window.location.pathname !== '/auth/naver/callback') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) return;

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/naver/callback`;
        const res = await fetch('/api/naver/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
        });
        const user = await res.json();
        if (user.id) {
          sessionStorage.setItem('naver_user', JSON.stringify(user));
          setCurrentUser({ displayName: user.name, email: user.email, photoURL: user.photo });
          setIsLoggedIn(true);
          setAuthMode(null);
        }
      } catch (e) {
        console.error('Naver callback error:', e);
      } finally {
        window.history.replaceState({}, '', '/');
      }
    };
    exchangeCode();
  }, []);

  // --- Strava OAuth 콜백 처리 (디바이스 연동 — 로그인 수단 아님) ---
  useEffect(() => {
    if (window.location.pathname !== '/auth/strava/callback') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    const exchangeCode = async () => {
      try {
        const res = await fetch('/api/strava/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.id) {
          sessionStorage.setItem('strava_data', JSON.stringify(data));
          setStravaData(data);
          setActiveTab('recovery');
        }
      } catch (e) {
        console.error('Strava callback error:', e);
      } finally {
        window.history.replaceState({}, '', '/');
      }
    };
    exchangeCode();
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

  // --- 4. 메인 맵 초기화 및 GPX 궤적 렌더링 ---
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

      if (gpxLayerRef.current) {
        gpxLayerRef.current.remove();
        gpxLayerRef.current = null;
      }

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
            } catch(e) { console.error("GPX Parsing Error", e); }
          }
          
          if (coords.length > 0 && leafletMap.current === mapInstance) {
            const lineColor = mapPopup.type === 'TRAIL' ? '#C2410C' : '#A8A29E';
            gpxLayerRef.current = L.polyline(coords, {
              color: lineColor, weight: 3, opacity: 0.7, dashArray: '5, 8', lineCap: 'round'
            }).addTo(mapInstance);
          }
        };
        drawPreviewLine();
      }

      const t1 = setTimeout(() => { if (leafletMap.current) leafletMap.current.invalidateSize(); }, 100);
      return () => clearTimeout(t1);
    } else if (leafletMap.current && (activeTab !== 'routes' || routeViewMode !== 'MAP' || selectedRoute)) {
      leafletMap.current.remove();
      leafletMap.current = null;
      markerGroupRef.current = null;
      gpxLayerRef.current = null;
    }
  }, [activeTab, routeViewMode, isMapLoaded, updateMapMarkers, mapPopup, selectedRoute]);

  // --- 5. 상세 페이지 시네마틱 맵 렌더링 ---
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
            for(let i=0; i<trkpts.length; i++) {
              coords.push([parseFloat(trkpts[i].getAttribute("lat")), parseFloat(trkpts[i].getAttribute("lon"))]);
            }
          } catch(e) {}
        }

        if (coords.length > 0 && detailLeafletMap.current === mapInstance) {
          if (detailGpxLayerRef.current) detailGpxLayerRef.current.remove();
          const lineColor = selectedRoute.type === 'TRAIL' ? '#C2410C' : '#EAE5D9';
          const polyline = L.polyline(coords, {
            color: lineColor, weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round'
          }).addTo(mapInstance);
          
          detailGpxLayerRef.current = polyline;
          mapInstance.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        } else if (selectedRoute.lat && selectedRoute.lng) {
          mapInstance.setView([selectedRoute.lat, selectedRoute.lng], 13);
        }
      };
      drawImmersiveLine();

      const t1 = setTimeout(() => { if (detailLeafletMap.current) detailLeafletMap.current.invalidateSize(); }, 150);
      return () => clearTimeout(t1);
    } else {
      if (detailLeafletMap.current) {
        detailLeafletMap.current.remove();
        detailLeafletMap.current = null;
        detailGpxLayerRef.current = null;
      }
    }
  }, [activeTab, selectedRoute, isMapLoaded]);

  // --- 6. 액션 핸들러 ---

  // ✅ Google 로그인
  const handleGoogleLogin = async () => {
    try {
      setIsAiLoading(true);
      await loginWithGoogle();
      setAuthMode(null);
    } catch (e) {
      console.error('Google 로그인 실패:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ✅ 카카오 로그인
  const handleKakaoLogin = () => loginWithKakao();

  // ✅ 네이버 로그인
  const handleNaverLogin = () => loginWithNaver();

  const handleSaveName = async () => {
    const trimmed = editNameValue.trim();
    if (!trimmed) return;
    try { await updateUserProfile(trimmed); } catch (e) {}
    ['kakao_user', 'naver_user'].forEach(key => {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.name = trimmed;
        sessionStorage.setItem(key, JSON.stringify(parsed));
      }
    });
    setCurrentUser(prev => ({ ...prev, displayName: trimmed }));
    setIsEditingName(false);
  };

  const handleDeviceConnectClick = () => {
    if (!isLoggedIn) {
      setAuthMode('login');
    } else {
      setIsWatchModalOpen(true);
    }
  };

  const toggleSave = (e, type, item) => {
    e.stopPropagation(); 
    if (!isLoggedIn) { setAuthMode('login'); return; }
    setSavedItems(prev => {
      const isSaved = prev[type].some(i => i._id === item._id);
      if (isSaved) return { ...prev, [type]: prev[type].filter(i => i._id !== item._id) };
      else return { ...prev, [type]: [...prev[type], item] };
    });
  };

  const isItemSaved = (type, id) => savedItems[type].some(i => i._id === id);

  const handleSyncGPX = (targetId) => {
    if (!isLoggedIn) { setAuthMode('login'); return; }
    if (!connectedDevice) { setIsWatchModalOpen(true); return; }
    setActiveAiTarget(targetId); setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); setSyncSuccess(true); setTimeout(() => { setSyncSuccess(false); setActiveAiTarget(null); }, 3000); }, 2000);
  };

  const generateAiContent = async (target, prompt) => {
    if (!apiKey) return;
    setIsAiLoading(true); setActiveAiTarget(target);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
      className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === id && !authMode && !isProfileOpen ? 'text-[#EAE5D9]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}
    >
      <Icon size={20} strokeWidth={activeTab === id && !authMode && !isProfileOpen ? 2 : 1.5} />
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

  const ritualScore = calcRitualScore(stravaData);

  return (
    <div className="min-h-screen bg-[#151413] text-[#EAE5D9] font-sans selection:bg-[#EAE5D9] selection:text-[#151413]">
      <style>{`
        .leaflet-container { background: #151413 !important; border: none; } 
        .custom-pin { display: flex; align-items: center; justify-content: center; transition: transform 0.3s; cursor: pointer; }
        .custom-pin:hover { transform: scale(1.5); }
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
        <h1 className="text-2xl font-bold tracking-[0.3em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setSelectedArticle(null); setAuthMode(null); setIsProfileOpen(false);}}>PESSAGE</h1>
        <div className="flex gap-5 items-center">
          {isLoggedIn ? (
            <>
              <div className={`text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full border transition-all ${stravaData ? 'border-[#FC4C02]/50 text-[#FC4C02] bg-[#FC4C02]/10 font-bold' : connectedDevice ? 'border-[#C2410C]/40 text-[#C2410C] bg-[#C2410C]/10 font-bold' : 'border-[#EAE5D9]/20 text-[#78716C]'}`}>
                {stravaData ? 'STRAVA' : connectedDevice ? connectedDevice.toUpperCase() : 'NO DEVICE'}
              </div>
              <button onClick={() => {setIsProfileOpen(!isProfileOpen); setAuthMode(null);}} className={`p-1.5 transition-all ${isProfileOpen ? 'text-[#EAE5D9] bg-[#EAE5D9]/10 rounded-full' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><User size={20} /></button>
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
             <div className="space-y-4 mb-3">
                {/* ✅ 실제 로그인 함수 연결 */}
                <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center py-5 bg-transparent text-[#EAE5D9] text-[11px] font-bold tracking-[0.2em] border border-[#EAE5D9]/20 hover:border-[#EAE5D9]/60 transition-colors rounded-sm">GOOGLE CONNECT</button>
                <button onClick={handleKakaoLogin} className="w-full flex items-center justify-center py-5 bg-[#FEE500] text-black text-[11px] font-bold tracking-[0.2em] rounded-sm hover:bg-[#e6cf00] transition-colors">KAKAO CONNECT</button>
                <button onClick={handleNaverLogin} className="w-full flex items-center justify-center py-5 bg-[#03C75A] text-white text-[11px] font-bold tracking-[0.2em] rounded-sm hover:bg-[#02b350] transition-colors">NAVER CONNECT</button>
             </div>
             <p className="text-[9px] text-[#78716C] mb-10 leading-relaxed">
               By signing in, you agree to our{' '}
               <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#A8A29E] transition-colors">Privacy Policy</a>
               <span className="mx-1.5 opacity-40">·</span>
               <a href="/privacy-ko" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#A8A29E] transition-colors">개인정보처리방침</a>
             </p>
             <button onClick={() => setAuthMode(null)} className="text-[10px] uppercase tracking-widest text-[#78716C] hover:text-[#EAE5D9] border-b border-[#78716C] pb-1 transition-colors">Return</button>
          </section>
        ) : isProfileOpen && isLoggedIn ? (
          <section className="pt-32 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
             {/* 이름 + 아바타 */}
             <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-full bg-[#292524] flex items-center justify-center border border-[#EAE5D9]/10 shadow-lg overflow-hidden shrink-0">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={32} className="text-[#A8A29E]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditingName(false); }}
                        className="text-2xl font-light italic bg-transparent border-b border-[#EAE5D9]/40 text-[#EAE5D9] focus:outline-none focus:border-[#EAE5D9] w-48 mb-1"
                        autoFocus
                      />
                      <button onClick={handleSaveName} className="text-[10px] uppercase tracking-widest text-[#151413] bg-[#EAE5D9] px-3 py-1.5 rounded-sm hover:bg-white transition-colors">Save</button>
                      <button onClick={() => setIsEditingName(false)} className="text-[10px] uppercase tracking-widest text-[#78716C] hover:text-[#EAE5D9] transition-colors">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-3xl font-light italic text-[#EAE5D9] truncate">{currentUser?.displayName || 'Runner'}</h2>
                      <button onClick={() => { setEditNameValue(currentUser?.displayName || ''); setIsEditingName(true); }} className="text-[#5A5450] hover:text-[#A8A29E] transition-colors shrink-0"><Pencil size={14} /></button>
                    </div>
                  )}
                  <p className="text-[11px] uppercase tracking-[0.3em] text-[#78716C]">{currentUser?.email || ''}</p>
                </div>
             </div>

             {/* Ritual Score + Total Mileage */}
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1A1918] p-8 border border-[#EAE5D9]/5 rounded-sm">
                  <p className="text-[10px] text-[#78716C] uppercase tracking-widest mb-3">Ritual Score</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-light">{ritualScore !== null ? ritualScore : '—'}</span>
                    {ritualScore !== null && <span className="text-lg text-[#78716C]">/100</span>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-[#5A5450]">이번 주 활동 ×10점 <span className="text-[#78716C]">(최대 40)</span></p>
                    <p className="text-[9px] text-[#5A5450]">연속 활동 주 ×10점 <span className="text-[#78716C]">(최대 30)</span></p>
                    <p className="text-[9px] text-[#5A5450]">적정 심박수 140–165bpm <span className="text-[#78716C]">(30점)</span></p>
                    {!stravaData && <p className="text-[9px] text-[#FC4C02] pt-1">Strava 연동 시 활성화</p>}
                  </div>
                </div>
                <div className="bg-[#1A1918] p-8 border border-[#EAE5D9]/5 rounded-sm">
                  <p className="text-[10px] text-[#78716C] uppercase tracking-widest mb-3">Total Mileage</p>
                  {stravaData?.ytdDistanceM > 0 ? (
                    <>
                      <span className="text-4xl font-light">{(stravaData.ytdDistanceM / 1000).toFixed(1)}</span>
                      <span className="text-lg text-[#78716C] ml-1">km</span>
                      <p className="text-[9px] text-[#5A5450] mt-4">{new Date().getFullYear()}년 연간 누적</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-light text-[#5A5450]">—</span>
                      {!stravaData && <p className="text-[9px] text-[#FC4C02] mt-4">Strava 연동 시 활성화</p>}
                    </>
                  )}
                </div>
             </div>

             {/* 연결된 디바이스 */}
             <div className="mb-10 bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm p-8">
               <h4 className="text-[10px] uppercase tracking-widest text-[#78716C] mb-6 font-bold">Connected Device</h4>
               {stravaData ? (
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-[#FC4C02] inline-block"></span>
                     <span className="text-[13px] text-[#EAE5D9] font-light">Strava</span>
                     <span className="text-[11px] text-[#78716C]">{stravaData.name}</span>
                   </div>
                   <button onClick={() => { sessionStorage.removeItem('strava_data'); setStravaData(null); }} className="text-[10px] uppercase tracking-widest text-[#5A5450] hover:text-[#C2410C] transition-colors">Disconnect</button>
                 </div>
               ) : connectedDevice ? (
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-[#C2410C] inline-block"></span>
                     <span className="text-[13px] text-[#EAE5D9] font-light">{connectedDevice}</span>
                   </div>
                   <button onClick={() => { setIsProfileOpen(false); setIsWatchModalOpen(true); }} className="text-[10px] uppercase tracking-widest text-[#78716C] hover:text-[#EAE5D9] transition-colors">Change</button>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                   <button onClick={() => { setIsProfileOpen(false); setActiveTab('recovery'); }} className="flex items-center justify-between p-4 border border-[#EAE5D9]/10 rounded-sm hover:border-[#FC4C02]/40 transition-all group">
                     <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#A8A29E] group-hover:text-[#FC4C02] transition-colors">Connect Strava</span>
                     <ChevronRight size={14} className="text-[#5A5450]" />
                   </button>
                   <button onClick={() => { setIsProfileOpen(false); setIsWatchModalOpen(true); }} className="flex items-center justify-between p-4 border border-[#EAE5D9]/10 rounded-sm hover:border-[#EAE5D9]/30 transition-all group">
                     <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#A8A29E] group-hover:text-[#EAE5D9] transition-colors">Connect Device</span>
                     <ChevronRight size={14} className="text-[#5A5450]" />
                   </button>
                 </div>
               )}
             </div>

             <div className="mb-20">
                <h3 className="text-2xl font-light italic mb-8 text-[#EAE5D9] border-b border-[#EAE5D9]/10 pb-4">My Archive</h3>
                <div className="space-y-16">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#78716C] mb-6">Saved Journals ({savedItems.articles.length})</h4>
                    {savedItems.articles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedItems.articles.map(article => (
                          <div key={article._id} onClick={() => {setSelectedArticle(article); setIsProfileOpen(false); setActiveTab('journal');}} className="flex gap-4 p-4 bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm cursor-pointer hover:border-[#EAE5D9]/20 transition-all">
                            <div className="w-24 h-24 shrink-0 rounded-sm overflow-hidden">
                              {article.coverImage && <img src={urlFor(article.coverImage)} className="w-full h-full object-cover grayscale hover:grayscale-0" alt=""/>}
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-2">{article.subtitle}</p>
                              <h5 className="text-lg font-light italic text-[#EAE5D9] line-clamp-2">{article.title}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-[#5A5450]">아직 수집된 에디토리얼이 없습니다.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#78716C] mb-6">Saved Gear ({savedItems.gear.length})</h4>
                    {savedItems.gear.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedItems.gear.map(gear => (
                          <div key={gear._id} onClick={() => {setIsProfileOpen(false); setActiveTab('gear');}} className="flex gap-4 p-4 bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm cursor-pointer hover:border-[#EAE5D9]/20 transition-all">
                            <div className="w-24 h-24 shrink-0 rounded-sm overflow-hidden bg-[#151413]">
                              {gear.image && <img src={urlFor(gear.image)} className="w-full h-full object-cover" alt=""/>}
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#C2410C] mb-2">{gear.brand}</p>
                              <h5 className="text-lg font-light italic text-[#EAE5D9] line-clamp-2">{gear.name}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-[#5A5450]">아직 수집된 장비가 없습니다.</p>
                    )}
                  </div>
                </div>
             </div>
             {/* ✅ 실제 로그아웃 함수 연결 */}
             <button onClick={async () => { await logout(); sessionStorage.removeItem('kakao_user'); sessionStorage.removeItem('naver_user'); sessionStorage.removeItem('strava_data'); setStravaData(null); setCurrentUser(null); setIsLoggedIn(false); setIsProfileOpen(false); }} className="w-full py-5 bg-[#C2410C]/10 text-[#C2410C] text-[10px] uppercase font-bold tracking-[0.3em] rounded-sm hover:bg-[#C2410C]/20 transition-colors">LOG OUT</button>
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
                    <div className="flex justify-between items-start mb-16">
                      <div className="max-w-[80%]">
                        {selectedArticle.category && (
                          <p className="text-[9px] tracking-[0.4em] uppercase mb-3 text-[#C2410C] font-bold">{selectedArticle.category}</p>
                        )}
                        {selectedArticle.subtitle && (
                          <p className="text-[11px] tracking-[0.3em] uppercase mb-4 text-[#A8A29E] font-bold">{selectedArticle.subtitle}</p>
                        )}
                        <h2 className="text-5xl md:text-6xl font-light italic leading-[1.1] text-[#EAE5D9]">{selectedArticle.title}</h2>
                      </div>
                      <button
                        onClick={(e) => toggleSave(e, 'articles', selectedArticle)}
                        className={`p-3 rounded-full border transition-all ${isItemSaved('articles', selectedArticle._id) ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'border-[#EAE5D9]/20 text-[#EAE5D9] hover:bg-[#EAE5D9]/10'}`}
                      >
                        {isItemSaved('articles', selectedArticle._id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                      </button>
                    </div>
                    <EditorialRenderer blocks={selectedArticle.body || selectedArticle.content} />
                    <div className="h-40" />
                  </div>
                ) : (
                  <div className="pt-24 max-w-6xl mx-auto">
                    {siteContent.articles.length > 0 ? (
                      <>
                        <div className="flex gap-8 border-b border-[#EAE5D9]/10 pb-5 mb-16 overflow-x-auto whitespace-nowrap hide-scrollbar">
                          {['ALL', 'ESSAY', 'INTERVIEW', 'GUIDE'].map(cat => (
                            <button key={cat} onClick={() => setJournalCategoryFilter(cat)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${journalCategoryFilter === cat ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450] hover:text-[#A8A29E]'}`}>{cat}</button>
                          ))}
                        </div>
                        {(() => {
                          const filteredArticles = siteContent.articles.filter(a => journalCategoryFilter === 'ALL' || a.category === journalCategoryFilter);
                          if (filteredArticles.length === 0) {
                            return <div className="py-32 text-center text-[#78716C] italic text-lg">해당 카테고리의 에디토리얼이 아직 없습니다.</div>;
                          }
                          const heroArticle = filteredArticles[0];
                          const heroSaved = isItemSaved('articles', heroArticle._id);
                          return (
                            <>
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
                                <div className="absolute bottom-10 left-8 md:bottom-16 md:left-16 z-10 w-[80%] md:w-2/3">
                                  {heroArticle.category && <p className="text-[9px] tracking-[0.4em] uppercase mb-2 text-[#C2410C] font-bold">{heroArticle.category}</p>}
                                  <p className="text-[10px] tracking-[0.4em] uppercase mb-4 text-[#A8A29E] font-bold">{heroArticle.subtitle || 'Latest Feature'}</p>
                                  <h2 className="text-4xl md:text-7xl font-light italic leading-[1.1] text-[#EAE5D9] group-hover:text-white transition-colors duration-500 mb-8">{heroArticle.title}</h2>
                                  <button className="text-[11px] uppercase tracking-[0.3em] font-bold border-b border-[#EAE5D9]/30 pb-1.5 group-hover:border-[#EAE5D9] transition-colors">Read the Story</button>
                                </div>
                                <button
                                  onClick={(e) => toggleSave(e, 'articles', heroArticle)}
                                  className={`absolute top-6 right-6 z-20 p-3 rounded-full backdrop-blur-md border transition-all ${heroSaved ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'bg-black/30 border-white/20 text-white hover:bg-black/60'}`}
                                >
                                  {heroSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                                </button>
                              </div>
                              {filteredArticles.length > 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-16 pb-20">
                                  {filteredArticles.slice(1).map(article => {
                                    const saved = isItemSaved('articles', article._id);
                                    return (
                                      <div key={article._id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer flex flex-col relative">
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
                                        <div className="flex justify-between items-start">
                                          <div>
                                            {article.category && <p className="text-[9px] tracking-[0.4em] uppercase mb-1 text-[#C2410C] font-bold">{article.category}</p>}
                                            <p className="text-[9px] tracking-[0.4em] uppercase mb-3 text-[#78716C] font-bold">{article.subtitle || 'Volume'}</p>
                                            <h3 className="text-3xl md:text-4xl font-light italic leading-tight text-[#EAE5D9]/90 group-hover:text-[#EAE5D9] transition-colors duration-300 pr-4">{article.title}</h3>
                                          </div>
                                          <button
                                            onClick={(e) => toggleSave(e, 'articles', article)}
                                            className={`p-2.5 rounded-full border transition-all mt-1 ${saved ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'border-[#EAE5D9]/20 text-[#A8A29E] hover:text-[#EAE5D9] hover:bg-[#EAE5D9]/10'}`}
                                          >
                                            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          );
                        })()}
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
              <section className="pt-28 px-4 md:px-6 max-w-5xl mx-auto animate-in slide-in-from-bottom-8">
                {selectedRoute ? (
                  <div className="max-w-4xl mx-auto">
                    <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[#78716C] text-[11px] uppercase tracking-widest mb-10 hover:text-[#EAE5D9] transition-colors"><ArrowLeft size={16} /> Directory</button>
                    
                    <div className="flex justify-between items-end mb-12 border-b border-[#EAE5D9]/10 pb-8 px-2">
                      <div>
                        <span className={`text-[10px] px-4 py-1.5 rounded-full border mb-6 inline-block font-bold tracking-[0.2em] ${selectedRoute.type === 'TRAIL' ? 'text-[#C2410C] border-[#C2410C]/30 bg-[#C2410C]/5' : 'text-[#EAE5D9] border-[#EAE5D9]/30 bg-[#EAE5D9]/5'}`}>{selectedRoute.type}</span>
                        <h2 className="text-4xl md:text-5xl font-light italic text-[#EAE5D9] leading-tight">{selectedRoute.name}</h2>
                      </div>
                      <div className="flex gap-8 text-right">
                        {selectedRoute.distance && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-1">Distance</p>
                            <p className="text-2xl font-light text-[#EAE5D9]">{selectedRoute.distance}</p>
                          </div>
                        )}
                        {selectedRoute.elevationGain && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-1">Elevation</p>
                            <p className="text-2xl font-light text-[#EAE5D9]">{selectedRoute.elevationGain}</p>
                          </div>
                        )}
                        {selectedRoute.difficulty && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-1">Difficulty</p>
                            <p className="text-2xl font-light text-[#EAE5D9]">{selectedRoute.difficulty}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div ref={detailMapRef} className="w-full aspect-[4/3] md:aspect-[21/9] bg-[#1A1918] mb-16 rounded-sm border border-[#EAE5D9]/5 relative z-0 overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#151413] via-transparent to-transparent z-[400] pointer-events-none"></div>
                    </div>

                    <div className="mb-24 max-w-2xl mx-auto px-2">
                      <EditorialRenderer blocks={selectedRoute.description} />
                      {selectedRoute.body && <EditorialRenderer blocks={selectedRoute.body} />}
                    </div>

                    {selectedRoute.spots?.length > 0 && (
                      <div className="max-w-2xl mx-auto mb-24 px-2 space-y-16">
                        <h3 className="text-2xl font-light italic text-[#EAE5D9] border-b border-[#EAE5D9]/10 pb-6">Key Spots</h3>
                        {selectedRoute.spots.map((spot, i) => (
                          <div key={i} className="border-l-2 border-[#EAE5D9]/10 pl-8">
                            <div className="flex items-center gap-3 mb-2">
                              {spot.type && <span className="text-[9px] uppercase tracking-widest text-[#C2410C] font-bold border border-[#C2410C]/30 px-2 py-0.5 rounded-full">{spot.type}</span>}
                              <h4 className="text-xl font-light italic text-[#EAE5D9]">{spot.name}</h4>
                            </div>
                            {spot.address && (
                              <p className="text-[11px] text-[#78716C] mb-6 flex items-center gap-1.5">
                                <MapPin size={10} className="shrink-0" />{spot.address}
                              </p>
                            )}
                            {spot.body && <EditorialRenderer blocks={spot.body} />}
                            {spot.images?.length > 0 && (
                              <div className="flex flex-col gap-6 mt-8">
                                {spot.images.map((imgUrl, j) => imgUrl && (
                                  <div key={j} className="overflow-hidden rounded-sm bg-[#1A1918]">
                                    <img src={imgUrl} alt={spot.name} className="w-full h-auto block" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="bg-[#1A1918] max-w-2xl mx-auto p-8 border border-[#EAE5D9]/5 rounded-sm text-center mb-20">
                      <Compass size={32} className="mx-auto text-[#78716C] mb-6" />
                      <h3 className="text-xl font-light italic mb-8 text-[#EAE5D9]">Sync Route to Device</h3>
                      <div className="space-y-3">
                        {selectedRoute.playlistUrl && (
                          <a
                            href={selectedRoute.playlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 border border-[#EAE5D9]/20 text-[#A8A29E] hover:border-[#EAE5D9] hover:text-[#EAE5D9]"
                          >
                            ▶ Play Route Soundtrack
                          </a>
                        )}
                        <button
                          onClick={() => handleSyncGPX(selectedRoute._id)}
                          className={`w-full py-5 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${activeAiTarget === selectedRoute._id && syncSuccess ? 'bg-[#166534] text-[#EAE5D9]' : 'bg-[#EAE5D9] text-[#151413] hover:bg-white'}`}
                        >
                          {activeAiTarget === selectedRoute._id && syncSuccess ? <CheckCircle2 size={18} /> : <Watch size={18} />}
                          {activeAiTarget === selectedRoute._id && syncSuccess ? 'GPX Synced' : 'Send to Watch'}
                        </button>
                        {selectedRoute.gpxUrl && (
                          <a
                            href={selectedRoute.gpxUrl}
                            download
                            className="w-full py-4 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 border border-[#EAE5D9]/20 text-[#A8A29E] hover:border-[#EAE5D9] hover:text-[#EAE5D9]"
                          >
                            <Download size={16} /> Download GPX
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="h-20" />
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="mb-12 flex flex-col md:flex-row justify-between items-start gap-8">
                        <div>
                          <h2 className="text-4xl font-light italic mb-3 text-[#EAE5D9]">Narrative Explorer</h2>
                          <p className="text-[#78716C] text-sm italic">지도로 탐색하는 러너들의 서사. 마커를 클릭하여 숨겨진 궤적을 확인하세요.</p>
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
                        <div ref={mapRef} className="w-full aspect-square md:aspect-[21/9] bg-[#1A1918] rounded-sm overflow-hidden border border-[#EAE5D9]/5 shadow-2xl z-0" />
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
                              <div className="flex items-center gap-6 text-right shrink-0">
                                {route.distance && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest text-[#5A5450] mb-1">Dist</p>
                                    <p className="text-xl font-light text-[#78716C] group-hover:text-[#EAE5D9] transition-colors">{route.distance}</p>
                                  </div>
                                )}
                                {route.elevationGain && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest text-[#5A5450] mb-1">Elev</p>
                                    <p className="text-xl font-light text-[#78716C] group-hover:text-[#EAE5D9] transition-colors">{route.elevationGain}</p>
                                  </div>
                                )}
                                {route.difficulty && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest text-[#5A5450] mb-1">Grade</p>
                                    <p className="text-xl font-light text-[#78716C] group-hover:text-[#EAE5D9] transition-colors">{route.difficulty}</p>
                                  </div>
                                )}
                              </div>
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
                    {['ALL', 'TRAIL', 'ROAD', 'GROUP_RUN'].map(type => (<button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${raceTypeFilter === type ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450] hover:text-[#A8A29E]'}`}>{type}</button>))}
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

                               {race.location && (
                                 <p className="text-[11px] text-[#78716C] mb-4 flex items-center gap-1.5">
                                   <MapPin size={11} className="shrink-0" />{race.location}
                                 </p>
                               )}
                               {race.registrationDate && (
                                 <div className="flex items-center gap-2 mb-6">
                                   <CheckCircle2 size={12} className="text-[#C2410C]" />
                                   <p className="text-[11px] uppercase tracking-widest text-[#C2410C] font-bold">Registration: {race.registrationDate}</p>
                                 </div>
                               )}

                               <p className="text-[15px] text-[#A8A29E] font-light leading-relaxed max-w-2xl mb-10">{race.description}</p>
                               <div className="flex flex-wrap gap-4">
                                  <button onClick={() => generateAiContent(race.name, `${race.name} 대회의 트레일/로드 전략을 어시(Earthy)하고 철학적인 톤앤매너 매거진 스타일로 3문장 이내로 작성해줘.`)} className="flex items-center gap-3 bg-[#EAE5D9]/5 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm hover:bg-[#EAE5D9]/10 transition-all text-[#EAE5D9]"><Sparkles size={14} /> AI Strategy</button>
                                  
                                  {race.registrationUrl && (
                                    <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#EAE5D9] px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#151413] hover:bg-white transition-all shadow-lg">
                                      Official Link <ExternalLink size={14} />
                                    </a>
                                  )}

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
              <section className="px-4 md:px-6 animate-in fade-in duration-700">
                {selectedGear ? (
                  /* ── Gear 상세 페이지 ── */
                  (() => {
                    const allGear = siteContent.gearItems;
                    const currentIdx = allGear.findIndex(g => g._id === selectedGear._id);
                    const prevGear = currentIdx > 0 ? allGear[currentIdx - 1] : null;
                    const nextGear = currentIdx < allGear.length - 1 ? allGear[currentIdx + 1] : null;
                    const goToGear = (item) => {
                      setSelectedGear(item);
                      const slug = item.slug?.current || item._id;
                      window.history.pushState({ gearId: item._id }, '', `/gear/${slug}`);
                    };
                    const goBack = () => {
                      setSelectedGear(null);
                      window.history.pushState({}, '', '/');
                    };
                    return (
                      <div className="pt-24 max-w-3xl mx-auto">
                        <button onClick={goBack} className="flex items-center gap-2 text-[#78716C] text-[11px] uppercase tracking-widest mb-12 hover:text-[#EAE5D9] transition-colors">
                          <ArrowLeft size={16} /> Back to Gear
                        </button>
                        {selectedGear.image && (
                          <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden mb-16" style={{backgroundColor: '#151413', width: '100vw', marginLeft: 'calc(50% - 50vw)'}}>
                            <img src={urlFor(selectedGear.image)} alt={selectedGear.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-4 text-[#A8A29E] flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#C2410C] rounded-full inline-block"></span>
                          {selectedGear.brand} · {selectedGear.category}
                        </p>
                        <div className="flex justify-between items-start mb-10">
                          <h2 className="text-[24px] md:text-4xl font-light italic leading-[1.2] text-[#EAE5D9] max-w-[85%]">{selectedGear.name}</h2>
                          <button
                            onClick={(e) => toggleSave(e, 'gear', selectedGear)}
                            className={`p-3 rounded-full border transition-all shrink-0 ${isItemSaved('gear', selectedGear._id) ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'border-[#EAE5D9]/20 text-[#EAE5D9] hover:bg-[#EAE5D9]/10'}`}
                          >
                            {isItemSaved('gear', selectedGear._id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                          </button>
                        </div>
                        {selectedGear.note && (
                          <p className="text-[17px] leading-[1.9] text-[#78716C] italic font-light mb-12 border-l-2 border-[#C2410C]/40 pl-6">"{selectedGear.note}"</p>
                        )}
                        {selectedGear.body && <EditorialRenderer blocks={selectedGear.body} />}
                        {/* 이전/다음 네비게이션 */}
                        <div className="flex justify-between items-center mt-20 pt-10 border-t border-[#EAE5D9]/10">
                          {prevGear ? (
                            <button onClick={() => goToGear(prevGear)} className="flex items-center gap-3 text-left group max-w-[45%]">
                              <ArrowLeft size={16} className="text-[#78716C] group-hover:text-[#EAE5D9] transition-colors shrink-0" />
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-1">이전 글</p>
                                <p className="text-[13px] font-light italic text-[#A8A29E] group-hover:text-[#EAE5D9] transition-colors line-clamp-1">{prevGear.name}</p>
                              </div>
                            </button>
                          ) : <div />}
                          {nextGear ? (
                            <button onClick={() => goToGear(nextGear)} className="flex items-center gap-3 text-right group max-w-[45%]">
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-1">다음 글</p>
                                <p className="text-[13px] font-light italic text-[#A8A29E] group-hover:text-[#EAE5D9] transition-colors line-clamp-1">{nextGear.name}</p>
                              </div>
                              <ArrowRight size={16} className="text-[#78716C] group-hover:text-[#EAE5D9] transition-colors shrink-0" />
                            </button>
                          ) : <div />}
                        </div>
                        <div className="h-40" />
                      </div>
                    );
                  })()
                ) : (
                  /* ── Gear 목록 ── */
                  <div className="pt-28 max-w-5xl mx-auto">
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
                      {siteContent.gearItems.filter(item => gearFilter === 'ALL' || item.category === gearFilter).map(item => {
                        const saved = isItemSaved('gear', item._id);
                        return (
                          <div key={item._id} className="group relative cursor-pointer" onClick={() => { setSelectedGear(item); const slug = item.slug?.current || item._id; window.history.pushState({ gearId: item._id }, '', `/gear/${slug}`); }}>
                            <div className="aspect-[4/5] bg-[#1A1918] border border-[#EAE5D9]/5 overflow-hidden rounded-sm mb-8 relative">
                              {item.image && <img src={urlFor(item.image)} className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-105" alt={item.name} />}
                              <div className="absolute inset-0 bg-[#151413]/10 group-hover:bg-transparent transition-colors duration-700"></div>
                              <button
                                onClick={(e) => toggleSave(e, 'gear', item)}
                                className={`absolute top-6 right-6 z-20 p-3 rounded-full backdrop-blur-md border transition-all ${saved ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'bg-black/30 border-white/20 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'}`}
                              >
                                {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                              </button>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-3 text-[#A8A29E] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#C2410C] rounded-full inline-block"></span>
                                {item.brand}
                              </p>
                              <h3 className="text-3xl font-light italic mb-6 text-[#EAE5D9] group-hover:text-white transition-colors">{item.name}</h3>
                              <p className="text-[15px] leading-[1.8] text-[#78716C] italic font-light line-clamp-2">"{item.note}"</p>
                              <button
                                onClick={() => {
                                  setSelectedGear(item);
                                  const slug = item.slug?.current || item._id;
                                  window.history.pushState({ gearId: item._id }, '', `/gear/${slug}`);
                                }}
                                className="mt-3 text-[10px] uppercase tracking-[0.2em] text-[#A8A29E] hover:text-[#EAE5D9] border-b border-[#A8A29E]/40 hover:border-[#EAE5D9] pb-0.5 transition-colors"
                              >Read More</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'recovery' && (
              <section className="px-6 pt-32 max-w-3xl mx-auto animate-in slide-in-from-bottom-8">
                {/* 헤더 + Ritual Score 배너 */}
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-4xl font-light italic text-[#EAE5D9]">Recovery Ritual</h2>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-1 font-bold">Ritual Score</p>
                    <p className="text-3xl font-light text-[#EAE5D9]">
                      {ritualScore !== null ? ritualScore : '—'}
                      <span className="text-sm text-[#78716C] ml-0.5">/100</span>
                    </p>
                    {ritualScore !== null && (
                      <p className="text-[9px] text-[#5A5450] mt-1">
                        {ritualScore >= 80 ? 'Excellent' : ritualScore >= 60 ? 'Good' : ritualScore >= 40 ? 'Building' : 'Getting Started'}
                      </p>
                    )}
                  </div>
                </div>
                {stravaData && (
                  <p className="text-[10px] uppercase tracking-widest text-[#FC4C02] mb-10 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FC4C02] inline-block animate-pulse"></span>
                    Connected · {stravaData.name}
                  </p>
                )}
                {!stravaData && <div className="mb-10" />}

                {stravaData ? (
                  <div className="animate-in fade-in space-y-6">
                    {/* Last Run Header */}
                    <div className="bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm p-8">
                      <p className="text-[10px] uppercase tracking-widest text-[#FC4C02] mb-3 font-bold">Last Run</p>
                      {stravaData.lastRun ? (
                        <>
                          <h3 className="text-2xl font-light italic text-[#EAE5D9] mb-1">{stravaData.lastRun.name}</h3>
                          <p className="text-[11px] text-[#5A5450]">{new Date(stravaData.lastRun.start_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          {/* 4-col metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-2 font-bold">Distance</p>
                              <p className="text-3xl font-light text-[#EAE5D9]">{(stravaData.lastRun.distance / 1000).toFixed(1)}</p>
                              <p className="text-[10px] text-[#78716C] mt-1">km</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-2 font-bold">Pace</p>
                              <p className="text-3xl font-light text-[#EAE5D9]">{formatPace(stravaData.lastRun.paceSecsPerKm)}</p>
                              <p className="text-[10px] text-[#78716C] mt-1">/km</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-2 font-bold">Avg HR</p>
                              <p className="text-3xl font-light text-[#EAE5D9]">{stravaData.lastRun.average_heartrate ? Math.round(stravaData.lastRun.average_heartrate) : '—'}</p>
                              <p className="text-[10px] text-[#78716C] mt-1">bpm</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-2 font-bold">Calories</p>
                              <p className="text-3xl font-light text-[#EAE5D9]">{stravaData.lastRun.calories ?? '—'}</p>
                              <p className="text-[10px] text-[#78716C] mt-1">kcal</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-[#5A5450] italic mt-3">러닝 기록이 없습니다.</p>
                      )}
                    </div>

                    {/* This Week */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm p-8">
                        <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-4 font-bold">This Week · Distance</p>
                        <p className="text-4xl font-light text-[#EAE5D9]">
                          {stravaData.weeklyStats?.distanceM > 0 ? (stravaData.weeklyStats.distanceM / 1000).toFixed(1) : '—'}
                        </p>
                        <p className="text-[10px] text-[#78716C] mt-2">km</p>
                      </div>
                      <div className="bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm p-8">
                        <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-4 font-bold">This Week · Runs</p>
                        <p className="text-4xl font-light text-[#EAE5D9]">
                          {stravaData.weeklyStats?.count ?? '—'}
                        </p>
                        <p className="text-[10px] text-[#78716C] mt-2">activities</p>
                      </div>
                    </div>

                    {/* Recent Runs */}
                    {stravaData.recentRuns?.length > 0 && (
                      <div className="bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm p-8">
                        <p className="text-[9px] uppercase tracking-widest text-[#78716C] mb-6 font-bold">Recent Runs</p>
                        <div>
                          {stravaData.recentRuns.map((run, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b border-[#EAE5D9]/5 last:border-0">
                              <div>
                                <p className="text-[13px] text-[#EAE5D9] font-light">{run.name}</p>
                                <p className="text-[10px] text-[#5A5450] mt-0.5">{new Date(run.start_date).toLocaleDateString('ko-KR')}</p>
                              </div>
                              <div className="text-right shrink-0 ml-4 space-y-0.5">
                                <p className="text-[14px] text-[#A8A29E] font-light">{(run.distance / 1000).toFixed(1)} km</p>
                                <p className="text-[10px] text-[#5A5450]">{formatPace(run.paceSecsPerKm)}{run.average_heartrate ? ` · ${Math.round(run.average_heartrate)} bpm` : ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Ritual */}
                    <div className="text-center pt-8 pb-6">
                      <button
                        onClick={() => generateAiContent('recovery', `Strava 실데이터 기반 러너: 마지막 러닝 ${stravaData.lastRun ? (stravaData.lastRun.distance / 1000).toFixed(1) : '?'}km · 페이스 ${formatPace(stravaData.lastRun?.paceSecsPerKm)} · 평균 심박수 ${stravaData.lastRun?.average_heartrate ? Math.round(stravaData.lastRun.average_heartrate) : '?'}bpm · 이번 주 ${stravaData.weeklyStats ? (stravaData.weeklyStats.distanceM / 1000).toFixed(1) : '?'}km 완주. 이 러너를 위한 오늘의 회복(Recovery) 리추얼을 프리미엄 라이프스타일 매거진 톤으로 짧고 감각적이게 추천해줘.`)}
                        className="px-12 py-5 bg-[#EAE5D9] text-[#151413] font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-2xl hover:bg-white active:scale-95 transition-all"
                      >Curate My Ritual</button>
                      {activeAiTarget === 'recovery' && aiResponse && (
                        <div className="mt-10 p-8 border border-[#EAE5D9]/5 bg-[#1A1918] text-[15px] italic text-[#EAE5D9]/90 font-light leading-[1.8] rounded-sm text-left">
                          "{aiResponse}"
                        </div>
                      )}
                      <div className="mt-16">
                        <button
                          onClick={() => { sessionStorage.removeItem('strava_data'); setStravaData(null); }}
                          className="text-[9px] uppercase tracking-[0.3em] text-[#3A3532] hover:text-[#78716C] transition-colors"
                        >Disconnect Strava</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 border border-dashed border-[#EAE5D9]/20 rounded-sm bg-[#1A1918]/50 animate-in fade-in">
                    <WatchIcon size={48} className="mx-auto mb-8 text-[#5A5450] animate-pulse"/>
                    <p className="text-[15px] text-[#A8A29E] mb-12 leading-[1.8] font-light italic max-w-sm mx-auto text-center">
                      거친 트레일의 끝,<br/>실제 러닝 데이터를 연동하여<br/>완벽한 회복의 서사를 완성하세요.
                    </p>
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <button
                        onClick={() => { if (!isLoggedIn) { setAuthMode('login'); } else { loginWithStrava(); } }}
                        className="w-full px-12 py-5 bg-[#FC4C02] text-white font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-2xl hover:bg-[#e84402] active:scale-95 transition-all"
                      >Connect Strava</button>
                      <p className="text-[10px] uppercase tracking-widest text-[#5A5450]">— or —</p>
                      <button onClick={handleDeviceConnectClick} className="w-full px-12 py-5 border border-[#EAE5D9]/20 text-[#A8A29E] font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm hover:border-[#EAE5D9]/50 hover:text-[#EAE5D9] transition-all">Connect Device</button>
                    </div>
                  </div>
                )}
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