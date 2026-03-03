import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass, ShoppingBag, Wind, User, ChevronRight, Activity,
  Flag, Watch, CheckCircle2, Sparkles, Loader2, ArrowLeft, ArrowRight,
  Map as MapIcon, List, Calendar, Smartphone as WatchIcon, Quote,
  Bookmark, BookmarkCheck, ExternalLink, Pencil, Download, MapPin
} from 'lucide-react';
import { loginWithGoogle, loginWithKakao, loginWithNaver, loginWithStrava, logout, onAuthChange, updateUserProfile, auth, db, doc, getDoc, setDoc } from './firebase';

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
          if (block.style === 'h2') return <h2 key={index} className="text-3xl font-light italic mt-16 mb-6 tracking-wide" style={{color:'var(--text-primary)'}}>{text}</h2>;
          if (block.style === 'h3') return <h3 key={index} className="text-xl font-bold mt-8 mb-4" style={{color:'var(--text-primary)'}}>{text}</h3>;
          return <p key={index} className="text-[17px] leading-[1.8] font-light" style={{color:'var(--text-secondary)'}}>{text}</p>;
        }
        
        if (block._type === 'image') {
          const imageUrl = urlFor(block);
          if (!imageUrl) return null;
          return (
            <figure key={index} className="my-20 animate-in fade-in duration-1000">
              <div className="w-full overflow-hidden rounded-sm border" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                <img src={imageUrl} alt={block.caption || ''} className="w-full h-auto block" />
              </div>
              {block.caption && <figcaption className="mt-6 text-[10px] uppercase tracking-widest text-center italic" style={{color:'var(--text-muted)'}}>— {block.caption}</figcaption>}
            </figure>
          );
        }

        if (block._type === 'quote') {
          return (
            <div key={index} className="py-16 border-y my-20 text-center animate-in slide-in-from-bottom-2" style={{borderColor:'var(--border-mid)'}}>
              <Quote size={24} className="mx-auto mb-8" style={{color:'var(--text-dim)'}} />
              <p className="text-2xl md:text-3xl font-light italic leading-relaxed mb-6 px-4" style={{color:'var(--text-primary)'}}>"{block.text}"</p>
              {block.author && <cite className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{color:'var(--text-muted)'}}>— {block.author}</cite>}
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
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  const [savedItems, setSavedItems] = useState({ articles: [], gear: [], routes: [], sessions: [] });
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedGear, setSelectedGear] = useState(null);
  
  const [routeViewMode, setRouteViewMode] = useState('LIST'); 
  const [routeTypeFilter, setRouteTypeFilter] = useState('ALL');
  const [routeRegionFilter, setRouteRegionFilter] = useState('ALL');
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [raceTimeTab, setRaceTimeTab] = useState('upcoming');
  const [raceViewMode, setRaceViewMode] = useState('list'); // 'list' | 'calendar'
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-11
  const [expandedRaceId, setExpandedRaceId] = useState(null);
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
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentAge, setConsentAge] = useState(false);
  const consentAllChecked = consentTerms && consentPrivacy && consentAge;

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pessage-theme');
    if (saved) return saved;
    const h = new Date().getHours();
    return (h >= 21 || h < 5) ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pessage-theme', theme);
  }, [theme]);

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
        "routes": *[_type == "route"] { ..., "gpxUrl": gpxFile.asset->url, "gallery": images[].asset->url, elevationGain, difficulty, body, "spots": spots[]{ name, category, address, body } },
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

  const getCurrentUid = () => {
    if (auth.currentUser) return auth.currentUser.uid;
    const kakaoUser = sessionStorage.getItem('kakao_user');
    if (kakaoUser) {
      const parsed = JSON.parse(kakaoUser);
      return `kakao_${parsed.id}`;
    }
    const naverUser = sessionStorage.getItem('naver_user');
    if (naverUser) {
      const parsed = JSON.parse(naverUser);
      return `naver_${parsed.id}`;
    }
    return null;
  };

  const loadSavedItems = async (uid) => {
    const resolvedUid = uid || getCurrentUid();
    if (!resolvedUid) return;
    try {
      const ref = doc(db, 'users', resolvedUid, 'data', 'savedItems');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSavedItems(snap.data());
      }
    } catch (e) {
      console.error('저장 데이터 불러오기 실패:', e);
    }
  };

  // --- ✅ Firebase 로그인 상태 감지 ---
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setIsLoggedIn(true);
        setCurrentUser(user);
        setAuthMode(null);
        loadSavedItems(user.uid);
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
          const uid = getCurrentUid();
          if (uid) loadSavedItems(uid);
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
          const uid = getCurrentUid();
          if (uid) loadSavedItems(uid);
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
      const list = prev[type] || [];
      const exists = list.some(i => i.id === item.id || i._id === item._id);
      const updated = exists
        ? list.filter(i => i.id !== item.id && i._id !== item._id)
        : [...list, item];
      const newState = { ...prev, [type]: updated };

      const uid = getCurrentUid();
      if (uid) {
        setDoc(doc(db, 'users', uid, 'data', 'savedItems'), newState)
          .catch(e => console.error('저장 실패:', e));
      }

      return newState;
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
      style={activeTab === id && !authMode && !isProfileOpen ? {color:'var(--text-primary)'} : {color:'var(--text-muted)'}}
      className="flex flex-col items-center gap-1.5 transition-all duration-300"
    >
      <Icon size={20} strokeWidth={activeTab === id && !authMode && !isProfileOpen ? 2 : 1.5} />
      <span className="text-[9px] uppercase tracking-widest font-medium">{label}</span>
    </button>
  );

  const groupedRaces = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = siteContent.races.filter(race => {
      const matchType = raceTypeFilter === 'ALL' || race.type === raceTypeFilter;
      if (!matchType) return false;
      if (!race.date) return raceTimeTab === 'upcoming';
      const raceDate = new Date(race.date);
      return raceTimeTab === 'upcoming' ? raceDate >= today : raceDate < today;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      const diff = new Date(a.date) - new Date(b.date);
      return raceTimeTab === 'upcoming' ? diff : -diff;
    });

    return sorted.reduce((acc, race) => {
      const dateStr = race.date
        ? new Date(race.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
        : '날짜 미정';
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(race);
      return acc;
    }, {});
  };

  const renderCalendarView = () => {
    const year = calendarYear;
    const month = calendarMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const monthRaces = siteContent.races.filter(race => {
      if (!race.date) return false;
      const matchType = raceTypeFilter === 'ALL' || race.type === raceTypeFilter;
      const d = new Date(race.date);
      return matchType && d.getFullYear() === year && d.getMonth() === month;
    });

    const racesByDay = monthRaces.reduce((acc, race) => {
      const day = new Date(race.date).getDate();
      if (!acc[day]) acc[day] = [];
      acc[day].push(race);
      return acc;
    }, {});

    const weeks = [];
    let cells = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
      if (cells.length === 7) { weeks.push(cells); cells = []; }
    }
    if (cells.length > 0) {
      while (cells.length < 7) cells.push(null);
      weeks.push(cells);
    }

    const monthName = new Date(year, month).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

    return (
      <div>
        {/* 월 네비게이션 */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); }
              else setCalendarMonth(m => m - 1);
            }}
            className="transition-colors px-4 py-2 text-xl" style={{color:'var(--text-dim)'}}
          >←</button>
          <h3 className="text-[13px] uppercase tracking-[0.3em] font-bold" style={{color:'var(--text-secondary)'}}>{monthName}</h3>
          <button
            onClick={() => {
              if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); }
              else setCalendarMonth(m => m + 1);
            }}
            className="transition-colors px-4 py-2 text-xl" style={{color:'var(--text-dim)'}}
          >→</button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
            <div key={d} className="text-center text-[9px] uppercase tracking-widest py-2" style={{color:'var(--text-dim)'}}>{d}</div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="border-t border-l" style={{borderColor:'var(--border)'}}>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                const isToday = day && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                const races = day ? (racesByDay[day] || []) : [];
                return (
                  <div key={di} className={`border-b border-r min-h-[80px] p-1.5`} style={{borderColor:'var(--border)', background: !day ? 'var(--bg-elevated)' : 'transparent'}}>
                    {day && (
                      <>
                        <span className={`text-[11px] font-bold block mb-1 w-6 h-6 flex items-center justify-center rounded-full`} style={isToday ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-dim)'}}>{day}</span>
                        {races.map(race => (
                          <div key={race._id}>
                            <button
                              onClick={() => setExpandedRaceId(expandedRaceId === race._id ? null : race._id)}
                              className={`w-full text-left text-[9px] uppercase tracking-wide font-bold px-1.5 py-1 rounded-sm mb-1 truncate transition-all ${race.type === 'TRAIL' ? 'bg-[#C2410C]/20 text-[#C2410C] hover:bg-[#C2410C]/30' : ''}`}
                              style={race.type !== 'TRAIL' ? {background:'var(--bg-elevated)', color:'var(--text-secondary)'} : {}}
                            >{race.name}</button>
                            {/* 상세 정보 펼치기 */}
                            {expandedRaceId === race._id && (
                              <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setExpandedRaceId(null)}>
                                <div className="border rounded-sm p-8 max-w-md w-full shadow-2xl" style={{background:'var(--bg-surface)', borderColor:'var(--border-mid)'}} onClick={e => e.stopPropagation()}>
                                  <div className="flex justify-between items-start mb-6">
                                    <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${race.type === 'TRAIL' ? 'text-[#C2410C]' : ''}`} style={race.type !== 'TRAIL' ? {color:'var(--text-secondary)'} : {}}>{race.type}</p>
                                    <button onClick={() => setExpandedRaceId(null)} className="transition-colors text-lg leading-none" style={{color:'var(--text-dim)'}}>✕</button>
                                  </div>
                                  <h3 className="text-2xl font-light italic mb-4" style={{color:'var(--text-primary)'}}>{race.name}</h3>
                                  {race.location && (
                                    <p className="text-[11px] mb-3 flex items-center gap-1.5" style={{color:'var(--text-muted)'}}>📍 {race.location}</p>
                                  )}
                                  {race.date && (
                                    <p className="text-[11px] mb-3" style={{color:'var(--text-muted)'}}>📅 {new Date(race.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                  )}
                                  {race.registrationDate && (
                                    <p className="text-[11px] text-[#C2410C] font-bold uppercase tracking-widest mb-4">Registration: {race.registrationDate}</p>
                                  )}
                                  {race.description && (
                                    <p className="text-[14px] font-light leading-relaxed mb-6" style={{color:'var(--text-secondary)'}}>{race.description}</p>
                                  )}
                                  {race.registrationUrl && (
                                    <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-bold rounded-sm transition-all" style={{background:'var(--text-primary)', color:'var(--bg-base)'}}>
                                      Official Link →
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* 해당 월에 대회 없을 때 */}
        {monthRaces.length === 0 && (
          <div className="py-16 text-center italic text-sm" style={{color:'var(--text-dim)'}}>이 달에 등록된 대회가 없습니다.</div>
        )}
      </div>
    );
  };

  const ritualScore = calcRitualScore(stravaData);

  return (
    <div className="min-h-screen font-sans" style={{background:'var(--bg-base)', color:'var(--text-primary)'}}>
      <style>{`
        .leaflet-container { background: #151413 !important; border: none; } 
        .custom-pin { display: flex; align-items: center; justify-content: center; transition: transform 0.3s; cursor: pointer; }
        .custom-pin:hover { transform: scale(1.5); }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>
      
      {showConnectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{background: 'rgba(0,0,0,0.5)'}}
          onClick={() => setShowConnectModal(false)}
        >
          <div
            className="mx-6 p-8 rounded-sm text-center"
            style={{background: 'var(--bg-surface)', maxWidth: '320px'}}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-[0.3em] mb-4 font-bold" style={{color: 'var(--text-muted)'}}>AI Strategy</p>
            <p className="text-[15px] font-light leading-[1.8] mb-6" style={{color: 'var(--text-primary)'}}>운동 기록을 연동하면 나만의 전략을 받을 수 있어요.</p>
            <button
              className="text-[11px] uppercase tracking-[0.2em] px-6 py-3 rounded-sm"
              style={{background: 'var(--text-primary)', color: 'var(--bg-surface)'}}
              onClick={() => setShowConnectModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {isWatchModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-sm w-full bg-[#F0EDE8] rounded-sm shadow-2xl flex flex-col" style={{maxHeight: '80vh'}}>
            <h3 className="text-2xl font-light italic pt-6 pb-4 px-6 text-center text-[#1B2A4A] border-b border-[#E8E4DF]">Sync Your Gear</h3>
            <div className="flex-1 overflow-y-auto">
              {[
                {name: 'Garmin', status: 'available'},
                {name: 'COROS', status: 'available'},
                {name: 'Suunto', status: 'coming'},
                {name: 'Samsung Health', status: 'coming'},
                {name: 'Apple Health', status: 'coming'},
              ].map(({name, status}) => (
                <button key={name} onClick={() => { if(status === 'available') { setConnectedDevice(name); setIsWatchModalOpen(false); }}} className={`w-full flex justify-between items-center px-6 border-b border-[#E8E4DF] transition-all group ${status === 'coming' ? 'text-[#C8C0B4] cursor-default' : 'text-[#3D3530] hover:bg-[#E8E4DF]'}`} style={{height: '56px'}}>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] uppercase tracking-widest font-light">{name}</span>
                    {status === 'coming' && <span className="text-[10px] uppercase tracking-[0.5px] border border-[#C8C0B4] px-2 py-0.5 rounded-full text-[#888888]" style={{whiteSpace: 'nowrap'}}>C.S</span>}
                  </div>
                  <span className="text-[#3D3530]/30 group-hover:text-[#3D3530]/60 transition-colors">›</span>
                </button>
              ))}
            </div>
            <button onClick={() => setIsWatchModalOpen(false)} className="w-full text-[10px] uppercase tracking-[0.3em] text-[#3D3530] hover:bg-[#E8E4DF] transition-colors border-t border-[#E8E4DF] bg-[#F0EDE8]" style={{height: '52px', flexShrink: 0}}>CLOSE</button>
          </div>
        </div>
      )}

      {(isAiLoading || isSyncing) && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 size={36} className="animate-spin text-[#EAE5D9] mb-8" />
          <p className="text-[11px] uppercase tracking-[0.5em] font-bold text-[#EAE5D9]">CALIBRATING...</p>
        </div>
      )}

      <header
        className={`fixed top-0 w-full z-[1000] transition-all duration-700 px-4 flex justify-between items-center overflow-hidden ${scrolled ? 'backdrop-blur-lg' : ''}`}
        style={{
          height: '56px',
          ...(scrolled
            ? { background: 'var(--bg-surface)', borderBottom: '1px solid', borderColor: 'var(--border)' }
            : { background: 'transparent' })
        }}
      >
        <h1 className="text-2xl font-bold tracking-[0.3em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setSelectedArticle(null); setAuthMode(null); setIsProfileOpen(false);}}>PESSAGE</h1>
        <div className="flex gap-3 items-center" style={{flexShrink: 0, minWidth: 0}}>
          {/* 테마 슬라이더 토글 */}
          <button
            onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
            className="flex items-center justify-center"
            style={{width: '44px', height: '44px', cursor: 'pointer', flexShrink: 0}}
            aria-label="Toggle theme"
          >
            <div style={{
              position: 'relative',
              width: '36px',
              height: '20px',
              borderRadius: '4px',
              border: `1px solid ${theme === 'dark' ? '#4A3F35' : '#C8C0B4'}`,
              background: 'transparent',
              transition: 'border-color 0.2s ease',
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                width: '14px',
                height: '14px',
                borderRadius: '2px',
                background: theme === 'dark' ? '#E8E0D5' : '#1B2A4A',
                transform: theme === 'dark' ? 'translateX(18px)' : 'translateX(2px)',
                transition: 'transform 0.2s ease, background 0.2s ease',
              }} />
            </div>
          </button>

          {isLoggedIn ? (
            <>
              {/* 디바이스 상태 칩 */}
              <button
                onClick={handleDeviceConnectClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '20px',
                  border: `1px solid ${
                    stravaData
                      ? '#FC4C02'
                      : connectedDevice
                        ? (theme === 'dark' ? '#8B6914' : '#C8941A')
                        : (theme === 'dark' ? '#4A3F35' : '#C8C0B4')
                  }`,
                  background: 'transparent',
                  fontSize: '10px',
                  letterSpacing: '1px',
                  color: stravaData
                    ? '#FC4C02'
                    : connectedDevice
                      ? (theme === 'dark' ? '#C8941A' : '#A0720E')
                      : '#888888',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: stravaData
                    ? '#FC4C02'
                    : connectedDevice
                      ? (theme === 'dark' ? '#C8941A' : '#C8941A')
                      : '#888888',
                }} />
                {stravaData ? 'STRAVA' : connectedDevice ? connectedDevice.toUpperCase() : 'NO DEVICE'}
              </button>
              <div className="flex items-center justify-center" style={{width: '44px', height: '44px', flexShrink: 0}}>
                <button
                  onClick={() => {setIsProfileOpen(!isProfileOpen); setAuthMode(null);}}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isProfileOpen ? '#D4CFC9' : '#E8E4DF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3D3530',
                    flexShrink: 0,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <User size={16} />
                </button>
              </div>
            </>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[10px] uppercase tracking-widest bg-[#EAE5D9] text-[#151413] px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-white active:scale-95 transition-all">SIGN IN</button>
          )}
        </div>
      </header>

      <main className="pb-40 pt-10">
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto animate-in slide-in-from-bottom-8 text-center">
             <h2 className="text-4xl font-light italic mb-12" style={{color:'var(--text-primary)'}}>Join the Pack</h2>
             {/* 동의 체크박스 */}
             <div className="text-left space-y-3 mb-5 p-4 border rounded-sm" style={{borderColor:'var(--border-mid)'}}>
               <label className="flex items-start gap-3 cursor-pointer group">
                 <input type="checkbox" checked={consentTerms} onChange={e => setConsentTerms(e.target.checked)} className="mt-0.5 accent-[#EAE5D9] w-4 h-4 shrink-0" />
                 <span className="text-[10px] leading-relaxed transition-colors" style={{color:'var(--text-secondary)'}}>
                   <span className="text-[#C2410C] font-bold">[필수]</span> <a href="/terms-ko" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">이용약관</a>에 동의합니다.
                 </span>
               </label>
               <label className="flex items-start gap-3 cursor-pointer group">
                 <input type="checkbox" checked={consentPrivacy} onChange={e => setConsentPrivacy(e.target.checked)} className="mt-0.5 accent-[#EAE5D9] w-4 h-4 shrink-0" />
                 <span className="text-[10px] leading-relaxed transition-colors" style={{color:'var(--text-secondary)'}}>
                   <span className="text-[#C2410C] font-bold">[필수]</span> <a href="/privacy-ko" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">개인정보 수집 및 이용</a>에 동의합니다.
                 </span>
               </label>
               <label className="flex items-start gap-3 cursor-pointer group">
                 <input type="checkbox" checked={consentAge} onChange={e => setConsentAge(e.target.checked)} className="mt-0.5 accent-[#EAE5D9] w-4 h-4 shrink-0" />
                 <span className="text-[10px] leading-relaxed transition-colors" style={{color:'var(--text-secondary)'}}>
                   <span className="text-[#C2410C] font-bold">[필수]</span> 만 14세 이상임을 확인합니다.
                 </span>
               </label>
             </div>

             {/* 로그인 버튼 */}
             <div className="space-y-4 mb-8">
               <button onClick={handleGoogleLogin} disabled={!consentAllChecked} className="w-full flex items-center justify-center py-5 bg-transparent text-[11px] font-bold tracking-[0.2em] border transition-colors rounded-sm disabled:opacity-30 disabled:cursor-not-allowed" style={{color:'var(--text-primary)', borderColor:'var(--border-mid)'}}>GOOGLE CONNECT</button>
               <button onClick={handleKakaoLogin} disabled={!consentAllChecked} className="w-full flex items-center justify-center py-5 bg-[#FEE500] text-black text-[11px] font-bold tracking-[0.2em] rounded-sm hover:bg-[#e6cf00] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">KAKAO CONNECT</button>
               <button onClick={handleNaverLogin} disabled={!consentAllChecked} className="w-full flex items-center justify-center py-5 bg-[#03C75A] text-white text-[11px] font-bold tracking-[0.2em] rounded-sm hover:bg-[#02b350] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">NAVER CONNECT</button>
             </div>
             <button onClick={() => { setAuthMode(null); setConsentTerms(false); setConsentPrivacy(false); setConsentAge(false); }} className="text-[10px] uppercase tracking-widest border-b pb-1 transition-colors" style={{color:'var(--text-muted)', borderColor:'var(--text-muted)'}}>Return</button>
          </section>
        ) : isProfileOpen && isLoggedIn ? (
          <section className="pt-32 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
             {/* 이름 + 아바타 */}
             <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 rounded-full flex items-center justify-center border shadow-lg overflow-hidden shrink-0" style={{background:'var(--bg-surface)', borderColor:'var(--border-mid)'}}>
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={32} style={{color:'var(--text-secondary)'}} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <input
                        value={editNameValue}
                        onChange={e => setEditNameValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setIsEditingName(false); }}
                        className="text-2xl font-light italic bg-transparent border-b focus:outline-none w-48 mb-1" style={{color:'var(--text-primary)', borderColor:'var(--border-mid)'}}
                        autoFocus
                      />
                      <button onClick={handleSaveName} className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm hover:bg-white transition-colors" style={{color:'var(--bg-base)', background:'var(--text-primary)'}}>Save</button>
                      <button onClick={() => setIsEditingName(false)} className="text-[10px] uppercase tracking-widest transition-colors" style={{color:'var(--text-muted)'}}>Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-3xl font-light italic truncate" style={{color:'var(--text-primary)'}}>{currentUser?.displayName || 'Runner'}</h2>
                      <button onClick={() => { setEditNameValue(currentUser?.displayName || ''); setIsEditingName(true); }} className="transition-colors shrink-0" style={{color:'var(--text-dim)'}}><Pencil size={14} /></button>
                    </div>
                  )}
                  <p className="text-[11px] uppercase tracking-[0.3em]" style={{color:'var(--text-muted)'}}>{currentUser?.email || ''}</p>
                </div>
             </div>

             {/* Ritual Score + Total Mileage */}
             <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-8 border rounded-sm" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>Ritual Score</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-light">{ritualScore !== null ? ritualScore : '—'}</span>
                    {ritualScore !== null && <span className="text-lg ml-0.5" style={{color:'var(--text-muted)'}}>/100</span>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px]" style={{color:'var(--text-dim)'}}>이번 주 활동 ×10점 <span style={{color:'var(--text-muted)'}}>(최대 40)</span></p>
                    <p className="text-[9px]" style={{color:'var(--text-dim)'}}>연속 활동 주 ×10점 <span style={{color:'var(--text-muted)'}}>(최대 30)</span></p>
                    <p className="text-[9px]" style={{color:'var(--text-dim)'}}>적정 심박수 140–165bpm <span style={{color:'var(--text-muted)'}}>(30점)</span></p>
                    {!stravaData && <p className="text-[9px] text-[#FC4C02] pt-1">Strava 연동 시 활성화</p>}
                  </div>
                </div>
                <div className="p-8 border rounded-sm" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                  <p className="text-[10px] uppercase tracking-widest mb-3" style={{color:'var(--text-muted)'}}>Total Mileage</p>
                  {stravaData?.ytdDistanceM > 0 ? (
                    <>
                      <span className="text-4xl font-light">{(stravaData.ytdDistanceM / 1000).toFixed(1)}</span>
                      <span className="text-lg ml-1" style={{color:'var(--text-muted)'}}>km</span>
                      <p className="text-[9px] mt-4" style={{color:'var(--text-dim)'}}>{new Date().getFullYear()}년 연간 누적</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-light" style={{color:'var(--text-dim)'}}>—</span>
                      {!stravaData && <p className="text-[9px] text-[#FC4C02] mt-4">Strava 연동 시 활성화</p>}
                    </>
                  )}
                </div>
             </div>

             {/* 연결된 디바이스 */}
             <div className="mb-10 border rounded-sm p-8" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
               <h4 className="text-[10px] uppercase tracking-widest mb-6 font-bold" style={{color:'var(--text-muted)'}}>Connected Device</h4>
               {stravaData ? (
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-[#FC4C02] inline-block"></span>
                     <span className="text-[13px] font-light" style={{color:'var(--text-primary)'}}>Strava</span>
                     <span className="text-[11px]" style={{color:'var(--text-muted)'}}>{stravaData.name}</span>
                   </div>
                   <button onClick={() => { sessionStorage.removeItem('strava_data'); setStravaData(null); }} className="text-[10px] uppercase tracking-widest transition-colors" style={{color:'var(--text-dim)'}}>Disconnect</button>
                 </div>
               ) : connectedDevice ? (
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <span className="w-2 h-2 rounded-full bg-[#C2410C] inline-block"></span>
                     <span className="text-[13px] font-light" style={{color:'var(--text-primary)'}}>{connectedDevice}</span>
                   </div>
                   <button onClick={() => { setIsProfileOpen(false); setIsWatchModalOpen(true); }} className="text-[10px] uppercase tracking-widest transition-colors" style={{color:'var(--text-muted)'}}>Change</button>
                 </div>
               ) : (
                 <div className="flex flex-col gap-3">
                   <button onClick={() => { setIsProfileOpen(false); setActiveTab('recovery'); }} className="flex items-center justify-between p-4 border rounded-sm hover:border-[#FC4C02]/40 transition-all group" style={{borderColor:'var(--border-mid)'}}>
                     <span className="text-[11px] uppercase tracking-[0.2em] font-bold transition-colors" style={{color:'var(--text-secondary)'}}>Connect Strava</span>
                     <ChevronRight size={14} style={{color:'var(--text-dim)'}} />
                   </button>
                   <button onClick={() => { setIsProfileOpen(false); setIsWatchModalOpen(true); }} className="flex items-center justify-between p-4 border rounded-sm transition-all group" style={{borderColor:'var(--border-mid)'}}>
                     <span className="text-[11px] uppercase tracking-[0.2em] font-bold transition-colors" style={{color:'var(--text-secondary)'}}>Connect Device</span>
                     <ChevronRight size={14} style={{color:'var(--text-dim)'}} />
                   </button>
                 </div>
               )}
             </div>

             <div className="mb-20">
                <h3 className="text-2xl font-light italic mb-8 border-b pb-4" style={{color:'var(--text-primary)', borderColor:'var(--border)'}}>My Archive</h3>
                <div className="space-y-16">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold mb-6" style={{color:'var(--text-muted)'}}>Saved Journals ({savedItems.articles.length})</h4>
                    {savedItems.articles.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedItems.articles.map(article => (
                          <div key={article._id} onClick={() => {setSelectedArticle(article); setIsProfileOpen(false); setActiveTab('journal');}} className="flex gap-4 p-4 border rounded-sm cursor-pointer transition-all" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                            <div className="w-24 h-24 shrink-0 rounded-sm overflow-hidden">
                              {article.coverImage && <img src={urlFor(article.coverImage)} className="w-full h-full object-cover grayscale hover:grayscale-0" alt=""/>}
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>{article.subtitle}</p>
                              <h5 className="text-lg font-light italic line-clamp-2" style={{color:'var(--text-primary)'}}>{article.title}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{color:'var(--text-dim)'}}>아직 수집된 에디토리얼이 없습니다.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold mb-6" style={{color:'var(--text-muted)'}}>Saved Gear ({savedItems.gear.length})</h4>
                    {savedItems.gear.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedItems.gear.map(gear => (
                          <div key={gear._id} onClick={() => {setIsProfileOpen(false); setActiveTab('gear');}} className="flex gap-4 p-4 border rounded-sm cursor-pointer transition-all" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                            <div className="w-24 h-24 shrink-0 rounded-sm overflow-hidden" style={{background:'var(--bg-base)'}}>
                              {gear.image && <img src={urlFor(gear.image)} className="w-full h-full object-cover" alt=""/>}
                            </div>
                            <div className="flex flex-col justify-center">
                              <p className="text-[9px] uppercase tracking-widest text-[#C2410C] mb-2">{gear.brand}</p>
                              <h5 className="text-lg font-light italic line-clamp-2" style={{color:'var(--text-primary)'}}>{gear.name}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{color:'var(--text-dim)'}}>아직 수집된 장비가 없습니다.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold mb-6" style={{color:'var(--text-muted)'}}>Saved Routes ({savedItems.routes?.length || 0})</h4>
                    {savedItems.routes?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedItems.routes.map(route => (
                          <div key={route._id} onClick={() => {setSelectedRoute(route); setIsProfileOpen(false); setActiveTab('routes');}} className="flex gap-4 p-4 border rounded-sm cursor-pointer transition-all" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                            <div className="flex flex-col justify-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>{route.type}{route.region ? ` · ${route.region}` : ''}</p>
                              <h5 className="text-lg font-light italic line-clamp-2" style={{color:'var(--text-primary)'}}>{route.name}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{color:'var(--text-dim)'}}>저장한 루트가 없어요.</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold mb-6" style={{color:'var(--text-muted)'}}>Saved Sessions ({savedItems.sessions?.length || 0})</h4>
                    {savedItems.sessions?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {savedItems.sessions.map(session => (
                          <div key={session._id} className="flex gap-4 p-4 border rounded-sm cursor-pointer transition-all" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                            <div className="flex flex-col justify-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2" style={{color:'var(--text-muted)'}}>{session.type}</p>
                              <h5 className="text-lg font-light italic line-clamp-2" style={{color:'var(--text-primary)'}}>{session.name}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic" style={{color:'var(--text-dim)'}}>저장한 세션이 없어요.</p>
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
                    <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[11px] uppercase tracking-widest mb-12 transition-colors" style={{color:'var(--text-muted)'}}><ArrowLeft size={16} /> Back to Directory</button>
                    {selectedArticle.coverImage && (
                      <div className="w-full overflow-hidden mb-16 rounded-sm relative group">
                        <img src={urlFor(selectedArticle.coverImage)} alt="" className="w-full h-auto block" />
                        <div className="absolute inset-0" style={{background:'linear-gradient(to top, var(--bg-base) 0%, transparent 30%)'}}></div>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-16">
                      <div className="max-w-[80%]">
                        {selectedArticle.category && (
                          <p className="text-[9px] tracking-[0.4em] uppercase mb-3 text-[#C2410C] font-bold">{selectedArticle.category}</p>
                        )}
                        {selectedArticle.subtitle && (
                          <p className="text-[11px] tracking-[0.3em] uppercase mb-4 font-bold" style={{color:'var(--text-secondary)'}}>{selectedArticle.subtitle}</p>
                        )}
                        <h2 className="text-5xl md:text-6xl font-light italic leading-[1.1]" style={{color:'var(--text-primary)'}}>{selectedArticle.title}</h2>
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
                        <div className="flex gap-8 border-b pb-5 mb-16 overflow-x-auto whitespace-nowrap hide-scrollbar" style={{borderColor:'var(--border)'}}>
                          {['ALL', 'ESSAY', 'INTERVIEW', 'GUIDE'].map(cat => (
                            <button key={cat} onClick={() => setJournalCategoryFilter(cat)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${journalCategoryFilter === cat ? 'border-b pb-5 -mb-5' : ''}`} style={journalCategoryFilter === cat ? {color:'var(--text-primary)', borderColor:'var(--text-primary)'} : {color:'var(--text-dim)'}}>{cat}</button>
                          ))}
                        </div>
                        {(() => {
                          const filteredArticles = siteContent.articles.filter(a => journalCategoryFilter === 'ALL' || a.category === journalCategoryFilter);
                          if (filteredArticles.length === 0) {
                            return <div className="py-32 text-center italic text-lg" style={{color:'var(--text-muted)'}}>해당 카테고리의 에디토리얼이 아직 없습니다.</div>;
                          }
                          const heroArticle = filteredArticles[0];
                          const heroSaved = isItemSaved('articles', heroArticle._id);
                          return (
                            <>
                              <div
                                onClick={() => setSelectedArticle(heroArticle)}
                                className="group cursor-pointer relative mb-24 md:mb-32 block overflow-hidden rounded-sm"
                              >
                                <div className="w-full relative" style={{background:'var(--bg-surface)'}}>
                                  {heroArticle.coverImage && (
                                    <img
                                      src={urlFor(heroArticle.coverImage)}
                                      className="w-full h-auto block"
                                      alt={heroArticle.title}
                                    />
                                  )}
                                  <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.1) 70%, transparent 100%)'}}></div>
                                </div>
                                <div className="absolute bottom-10 left-8 md:bottom-16 md:left-16 z-10 w-[80%] md:w-2/3">
                                  {heroArticle.category && <p className="text-[9px] tracking-[0.4em] uppercase mb-2 text-[#C2410C] font-bold">{heroArticle.category}</p>}
                                  <p className="text-[10px] tracking-[0.4em] uppercase mb-4 font-bold text-white/70">{heroArticle.subtitle || 'Latest Feature'}</p>
                                  <h2 className="text-4xl md:text-7xl font-light italic leading-[1.1] text-[#EAE5D9] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-colors duration-500 mb-8">{heroArticle.title}</h2>
                                  <button className="text-[11px] uppercase tracking-[0.3em] font-bold border-b border-[#EAE5D9]/50 pb-1.5 text-[#EAE5D9] drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] transition-colors">Read the Story</button>
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
                                        <div className="w-full aspect-[4/3] overflow-hidden rounded-sm mb-6 border relative" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                                          {article.coverImage && (
                                            <img
                                              src={urlFor(article.coverImage)}
                                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                              alt={article.title}
                                            />
                                          )}
                                          <div className="absolute inset-0 group-hover:bg-transparent transition-colors duration-700"></div>
                                        </div>
                                        <div className="flex justify-between items-start">
                                          <div>
                                            {article.category && <p className="text-[9px] tracking-[0.4em] uppercase mb-1 text-[#C2410C] font-bold">{article.category}</p>}
                                            <p className="text-[9px] tracking-[0.4em] uppercase mb-3 font-bold" style={{color:'var(--text-muted)'}}>{article.subtitle || 'Volume'}</p>
                                            <h3 className="text-3xl md:text-4xl font-light italic leading-tight transition-colors duration-300 pr-4" style={{color:'var(--text-primary)'}}>{article.title}</h3>
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
                      <div className="h-[60vh] flex flex-col items-center justify-center italic gap-6" style={{color:'var(--text-muted)'}}>
                        <Loader2 size={40} className="animate-spin" style={{color:'var(--text-dim)'}} />
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
                    <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[11px] uppercase tracking-widest mb-10 transition-colors" style={{color:'var(--text-muted)'}}><ArrowLeft size={16} /> Directory</button>

                    <div className="flex justify-between items-end mb-12 border-b pb-8 px-2" style={{borderColor:'var(--border)'}}>
                      <div>
                        <span className={`text-[10px] px-4 py-1.5 rounded-full border mb-6 inline-block font-bold tracking-[0.2em] ${selectedRoute.type === 'TRAIL' ? 'text-[#C2410C] border-[#C2410C]/30 bg-[#C2410C]/5' : ''}`} style={selectedRoute.type !== 'TRAIL' ? {color:'var(--text-primary)', borderColor:'var(--border-mid)'} : {}}>{selectedRoute.type}</span>
                        <h2 className="text-4xl md:text-5xl font-light italic leading-tight" style={{color:'var(--text-primary)'}}>{selectedRoute.name}</h2>
                      </div>
                      <div className="flex gap-8 text-right">
                        {selectedRoute.distance && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Distance</p>
                            <p className="text-2xl font-light" style={{color:'var(--text-primary)'}}>{selectedRoute.distance}</p>
                          </div>
                        )}
                        {selectedRoute.elevationGain && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Elevation</p>
                            <p className="text-2xl font-light" style={{color:'var(--text-primary)'}}>{selectedRoute.elevationGain}</p>
                          </div>
                        )}
                        {selectedRoute.difficulty && (
                          <div>
                            <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>Difficulty</p>
                            <p className="text-2xl font-light" style={{color:'var(--text-primary)'}}>{selectedRoute.difficulty}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div ref={detailMapRef} className="w-full aspect-[4/3] md:aspect-[21/9] mb-16 rounded-sm border relative z-0 overflow-hidden shadow-2xl" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[400] pointer-events-none"></div>
                    </div>

                    <div className="mb-24 max-w-2xl mx-auto px-2">
                      <EditorialRenderer blocks={selectedRoute.description} />
                      {selectedRoute.body && <EditorialRenderer blocks={selectedRoute.body} />}
                    </div>

                    {selectedRoute.spots?.length > 0 && (
                      <div className="max-w-2xl mx-auto mb-24 px-2 space-y-16">
                        <h3 className="text-2xl font-light italic border-b pb-6" style={{color:'var(--text-primary)', borderColor:'var(--border)'}}>Key Spots</h3>
                        {selectedRoute.spots.map((spot, i) => (
                          <div key={i} className="border-l-2 pl-8" style={{borderColor:'var(--border-mid)'}}>
                            <div className="flex items-center gap-3 mb-2">
                              {spot.type && <span className="text-[9px] uppercase tracking-widest text-[#C2410C] font-bold border border-[#C2410C]/30 px-2 py-0.5 rounded-full">{spot.type}</span>}
                              <h4 className="text-xl font-light italic" style={{color:'var(--text-primary)'}}>{spot.name}</h4>
                            </div>
                            {spot.address && (
                              <p className="text-[11px] mb-6 flex items-center gap-1.5" style={{color:'var(--text-muted)'}}>
                                <MapPin size={10} className="shrink-0" />{spot.address}
                              </p>
                            )}
                            {spot.body && <EditorialRenderer blocks={spot.body} />}
                            {spot.images?.length > 0 && (
                              <div className="flex flex-col gap-6 mt-8">
                                {spot.images.map((imgUrl, j) => imgUrl && (
                                  <div key={j} className="overflow-hidden rounded-sm" style={{background:'var(--bg-surface)'}}>
                                    <img
                                      src={`${imgUrl}?auto=format`}
                                      alt={spot.name}
                                      className="w-full h-auto block"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="max-w-2xl mx-auto p-8 border rounded-sm text-center mb-20" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                      <Compass size={32} className="mx-auto mb-6" style={{color:'var(--text-muted)'}} />
                      <h3 className="text-xl font-light italic mb-8" style={{color:'var(--text-primary)'}}>Sync Route to Device</h3>
                      <div className="space-y-3">
                        {selectedRoute.playlistUrl && (
                          <a
                            href={selectedRoute.playlistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 border"
                            style={{borderColor:'var(--border-mid)', color:'var(--text-secondary)'}}
                          >
                            ▶ Play Route Soundtrack
                          </a>
                        )}
                        <button
                          onClick={() => handleSyncGPX(selectedRoute._id)}
                          className={`w-full py-5 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${activeAiTarget === selectedRoute._id && syncSuccess ? 'bg-[#166534]' : ''}`}
                          style={activeAiTarget === selectedRoute._id && syncSuccess ? {color:'var(--text-primary)'} : {background:'var(--text-primary)', color:'var(--bg-base)'}}
                        >
                          {activeAiTarget === selectedRoute._id && syncSuccess ? <CheckCircle2 size={18} /> : <Watch size={18} />}
                          {activeAiTarget === selectedRoute._id && syncSuccess ? 'GPX Synced' : 'Send to Watch'}
                        </button>
                        {selectedRoute.gpxUrl && (
                          <a
                            href={selectedRoute.gpxUrl}
                            download
                            className="w-full py-4 rounded-sm font-bold uppercase text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 border"
                            style={{borderColor:'var(--border-mid)', color:'var(--text-secondary)'}}
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
                          <h2 className="text-4xl font-light italic mb-3" style={{color:'var(--text-primary)'}}>Narrative Explorer</h2>
                          <p className="text-sm italic" style={{color:'var(--text-muted)'}}>지도로 탐색하는 러너들의 서사. 마커를 클릭하여 숨겨진 궤적을 확인하세요.</p>
                        </div>
                        <div className="flex p-1.5 rounded-sm border" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                            <button onClick={() => {setRouteViewMode('LIST'); setMapPopup(null);}} className={`px-6 py-2 rounded-sm text-[11px] font-bold tracking-widest transition-all`} style={routeViewMode === 'LIST' ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-muted)'}}><List size={14} className="inline mr-2 -mt-0.5"/> LIST</button>
                            <button onClick={() => setRouteViewMode('MAP')} className={`px-6 py-2 rounded-sm text-[11px] font-bold tracking-widest transition-all`} style={routeViewMode === 'MAP' ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-muted)'}}><MapIcon size={14} className="inline mr-2 -mt-0.5"/> MAP</button>
                        </div>
                    </div>
                    
                    <div className="mb-12">
                        <div className="flex gap-8 border-b pb-5 mb-8 overflow-x-auto whitespace-nowrap hide-scrollbar" style={{borderColor:'var(--border)'}}>
                            {['ALL', 'ORIGINAL', 'TRAIL', 'ROAD'].map(t => (<button key={t} onClick={() => setRouteTypeFilter(t)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${routeTypeFilter === t ? 'border-b pb-5 -mb-5' : ''}`} style={routeTypeFilter === t ? {color:'var(--text-primary)', borderColor:'var(--text-primary)'} : {color:'var(--text-dim)'}}>{t}</button>))}
                        </div>
                        <div className="flex gap-8 border-b pb-5 overflow-x-auto whitespace-nowrap hide-scrollbar" style={{borderColor:'var(--border)'}}>
                            {['ALL', 'SEOUL', 'GYEONGGI', 'GANGWON', 'CHUNGCHEONG', 'GYEONGSANG', 'JEJU'].map(r => (<button key={r} onClick={() => setRouteRegionFilter(r)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${routeRegionFilter === r ? 'border-b pb-5 -mb-5' : ''}`} style={routeRegionFilter === r ? {color:'var(--text-primary)', borderColor:'var(--text-primary)'} : {color:'var(--text-dim)'}}>{r}</button>))}
                        </div>
                    </div>

                    {routeViewMode === 'MAP' ? (
                      <div className="relative animate-in fade-in duration-700 min-h-[500px]">
                        <div ref={mapRef} className="w-full aspect-square md:aspect-[21/9] rounded-sm overflow-hidden border shadow-2xl z-0" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}} />
                        {mapPopup && (
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 backdrop-blur-md border p-8 rounded-sm shadow-2xl z-[2000] animate-in zoom-in-95 text-center" style={{background:'var(--bg-surface)', borderColor:'var(--border-mid)'}}>
                              <p className={`text-[9px] uppercase tracking-[0.3em] mb-3 font-bold ${mapPopup.type === 'TRAIL' ? 'text-[#C2410C]' : ''}`} style={mapPopup.type !== 'TRAIL' ? {color:'var(--text-secondary)'} : {}}>{mapPopup.type} • {mapPopup.region}</p>
                              <h4 className="text-2xl font-light italic mb-8 leading-tight" style={{color:'var(--text-primary)'}}>{mapPopup.name}</h4>
                              <button onClick={() => setSelectedRoute(mapPopup)} className="w-full py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm" style={{background:'var(--text-primary)', color:'var(--bg-base)'}}>Explore Course</button>
                              <button onClick={() => setMapPopup(null)} className="mt-5 text-[10px] uppercase tracking-widest transition-colors" style={{color:'var(--text-muted)'}}>Close</button>
                           </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {siteContent.routes.length > 0 ? siteContent.routes.filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter) && (routeRegionFilter === 'ALL' || r.region === routeRegionFilter)).map(route => (
                          <div key={route._id} onClick={() => setSelectedRoute(route)} className="p-8 md:p-10 border cursor-pointer transition-all duration-300 group rounded-sm shadow-lg relative" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                              <button
                                onClick={(e) => toggleSave(e, 'routes', route)}
                                className={`absolute top-6 right-6 z-20 p-2.5 rounded-full border transition-all ${isItemSaved('routes', route._id) ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'opacity-0 group-hover:opacity-100 border-[#EAE5D9]/20 text-[#A8A29E]'}`}
                              >
                                {isItemSaved('routes', route._id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                              </button>
                              <p className={`text-[10px] uppercase font-bold tracking-[0.3em] mb-3 ${route.type === 'TRAIL' ? 'text-[#C2410C]' : ''}`} style={route.type !== 'TRAIL' ? {color:'var(--text-secondary)'} : {}}>{route.type} / {route.region}</p>
                              <h4 className="text-2xl md:text-3xl font-normal not-italic transition-colors leading-tight mb-6" style={{color:'var(--text-primary)'}}>{route.name}</h4>
                              <div className="flex items-center gap-6">
                                {route.distance && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-dim)'}}>Dist</p>
                                    <p className="text-xl font-light transition-colors" style={{color:'var(--text-muted)'}}>{route.distance}</p>
                                  </div>
                                )}
                                {route.elevationGain && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-dim)'}}>Elev</p>
                                    <p className="text-xl font-light transition-colors" style={{color:'var(--text-muted)'}}>{route.elevationGain}</p>
                                  </div>
                                )}
                                {route.difficulty && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-dim)'}}>Grade</p>
                                    <p className="text-xl font-light transition-colors" style={{color:'var(--text-muted)'}}>{route.difficulty}</p>
                                  </div>
                                )}
                              </div>
                          </div>
                        )) : (
                          <div className="py-32 text-center italic text-lg" style={{color:'var(--text-muted)'}}>해당 조건의 서사가 아직 기록되지 않았습니다.</div>
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
                  <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <h2 className="text-4xl font-light italic" style={{color:'var(--text-primary)'}}>Race Calendar</h2>
                    {/* List / Calendar 토글 */}
                    <div className="flex gap-1 p-1 rounded-sm border" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                      <button
                        onClick={() => setRaceViewMode('list')}
                        className={`text-[10px] uppercase tracking-[0.25em] font-bold px-5 py-2 rounded-sm transition-all`}
                        style={raceViewMode === 'list' ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-dim)'}}
                      >List</button>
                      <button
                        onClick={() => setRaceViewMode('calendar')}
                        className={`text-[10px] uppercase tracking-[0.25em] font-bold px-5 py-2 rounded-sm transition-all`}
                        style={raceViewMode === 'calendar' ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-dim)'}}
                      >Calendar</button>
                    </div>
                  </div>
                  {/* 예정 / 지난 대회 탭 */}
                  <div className="flex gap-1 mb-8 p-1 rounded-sm border w-fit" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                    <button
                      onClick={() => setRaceTimeTab('upcoming')}
                      className={`text-[10px] uppercase tracking-[0.25em] font-bold px-6 py-2.5 rounded-sm transition-all`}
                      style={raceTimeTab === 'upcoming' ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-dim)'}}
                    >Upcoming</button>
                    <button
                      onClick={() => setRaceTimeTab('past')}
                      className={`text-[10px] uppercase tracking-[0.25em] font-bold px-6 py-2.5 rounded-sm transition-all`}
                      style={raceTimeTab === 'past' ? {background:'var(--text-primary)', color:'var(--bg-base)'} : {color:'var(--text-dim)'}}
                    >Past</button>
                  </div>
                  <div className="flex gap-8 border-b pb-5 mb-12 overflow-x-auto whitespace-nowrap hide-scrollbar" style={{borderColor:'var(--border)'}}>
                    {['ALL', 'TRAIL', 'ROAD', 'GROUP_RUN'].map(type => (<button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${raceTypeFilter === type ? 'border-b pb-5 -mb-5' : ''}`} style={raceTypeFilter === type ? {color:'var(--text-primary)', borderColor:'var(--text-primary)'} : {color:'var(--text-dim)'}}>{type}</button>))}
                  </div>
                </div>

                {raceViewMode === 'calendar' ? (
                  renderCalendarView()
                ) : (
                <div className="space-y-24">
                  {Object.entries(groupedRaces()).map(([month, monthRaces]) => (
                    <div key={month} className="animate-in fade-in">
                       <div className="flex items-center gap-4 mb-10">
                          <Calendar size={16} style={{color:'var(--text-secondary)'}} />
                          <h3 className="text-[12px] uppercase tracking-[0.4em] font-bold" style={{color:'var(--text-secondary)'}}>{month}</h3>
                          <div className="h-[1px] flex-1" style={{background:'var(--border)'}}></div>
                       </div>
                       <div className="space-y-16">
                          {monthRaces.map(race => (
                            <div key={race._id || race.id} className="group border-l-2 pl-8 md:pl-12 relative transition-colors duration-500" style={{borderColor:'var(--border-mid)'}}>
                               <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-[#C2410C]' : ''}`} style={race.type !== 'TRAIL' ? {background:'var(--text-secondary)'} : {}}></div>
                               <div className="flex justify-between items-start mb-5">
                                 <h3 className="text-3xl md:text-4xl font-light italic" style={{color:'var(--text-primary)'}}>{race.name}</h3>
                                 <button
                                   onClick={(e) => toggleSave(e, 'sessions', race)}
                                   className={`p-2.5 rounded-full border transition-all shrink-0 ml-4 ${isItemSaved('sessions', race._id || race.id) ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'border-[#EAE5D9]/20 text-[#A8A29E] opacity-0 group-hover:opacity-100'}`}
                                 >
                                   {isItemSaved('sessions', race._id || race.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                 </button>
                               </div>

                               {race.date && (
                                 <p className="text-[11px] uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{color:'var(--text-secondary)'}}>
                                   <Calendar size={11} className="shrink-0" />
                                   {new Date(race.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                 </p>
                               )}

                               {race.location && (
                                 <p className="text-[11px] mb-4 flex items-center gap-1.5" style={{color:'var(--text-muted)'}}>
                                   <MapPin size={11} className="shrink-0" />{race.location}
                                 </p>
                               )}
                               {race.registrationDate && (
                                 <div className="flex items-center gap-2 mb-6">
                                   <CheckCircle2 size={12} className="text-[#C2410C]" />
                                   <p className="text-[11px] uppercase tracking-widest text-[#C2410C] font-bold">Registration: {race.registrationDate}</p>
                                 </div>
                               )}

                               <p className="text-[15px] font-light leading-relaxed max-w-2xl mb-10" style={{color:'var(--text-secondary)'}}>{race.description}</p>
                               <div className="flex flex-wrap gap-4">
                                  <button onClick={() => {
                                    if (!stravaData) {
                                      setShowConnectModal(true);
                                      return;
                                    }
                                    generateAiContent(race.name,
                                      `당신은 PESSAGE의 수석 에디터다.
PESSAGE 문체: 짧은 현재형 문장, 경험 중심, 광고성 표현 금지, 기록보다 감각을 우선.
러너 데이터를 반드시 해석해서 반영할 것 — 제네릭한 답변 금지.

대회 정보:
- 이름: ${race.name}
- 유형: ${race.type}
- 날짜: ${race.date}
- 장소: ${race.location || '미정'}
- 설명: ${race.description}

러너 현황 (이 데이터를 반드시 전략에 반영할 것):
- 이번 주 훈련: ${(stravaData.weeklyStats?.distanceM / 1000).toFixed(1)}km / ${stravaData.weeklyStats?.count}회
- 최근 페이스: ${formatPace(stravaData.lastRun?.paceSecsPerKm)} /km
- 최근 심박수: ${Math.round(stravaData.lastRun?.average_heartrate || 0)}bpm
- Ritual Score: ${ritualScore}/100

위 러너의 현재 훈련 수준과 컨디션을 분석해서, 이 대회를 어떻게 접근해야 하는지 태도와 전략을 함께 3~4문장으로 써라.
페이스나 심박수 수치를 직접 언급하면서 이 러너에게만 해당하는 구체적인 조언을 줄 것.
형식: 줄바꿈으로 구분된 3~4문장. 번호나 마크다운 없이 순수 텍스트만.`
                                    );
                                  }} className="flex items-center gap-3 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm transition-all" style={{background:'var(--bg-surface)', color:'var(--text-primary)'}}><Sparkles size={14} /> AI Strategy</button>

                                  {race.registrationUrl && (
                                    <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm transition-all shadow-lg" style={{background:'var(--text-primary)', color:'var(--bg-base)'}}>
                                      Official Link <ExternalLink size={14} />
                                    </a>
                                  )}

                                  <button onClick={() => handleSyncGPX(race._id)} className={`flex items-center gap-3 py-4 px-8 text-[10px] uppercase font-bold tracking-[0.2em] border transition-all rounded-sm ${activeAiTarget === race._id && syncSuccess ? 'bg-[#166534] border-[#166534]' : ''}`} style={!(activeAiTarget === race._id && syncSuccess) ? {borderColor:'var(--border-mid)', color:'var(--text-secondary)'} : {color:'var(--text-primary)'}}>{activeAiTarget === race._id && syncSuccess ? <CheckCircle2 size={14} /> : <Watch size={14} />} {activeAiTarget === race._id && syncSuccess ? 'Synced' : 'Sync Event'}</button>
                               </div>
                               {activeAiTarget === race.name && aiResponse && (
                                 <div className="mt-8 p-8 border rounded-sm italic text-[15px] font-light leading-[1.8] animate-in slide-in-from-top-4" style={{background:'var(--bg-surface)', borderColor:'var(--border)', color:'var(--text-secondary)'}}>
                                   "{aiResponse}"
                                 </div>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
                </div>
                )}
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
                        <button onClick={goBack} className="flex items-center gap-2 text-[11px] uppercase tracking-widest mb-12 transition-colors" style={{color:'var(--text-muted)'}}>
                          <ArrowLeft size={16} /> Back to Gear
                        </button>
                        {selectedGear.image && (
                          <div className="aspect-[4/3] md:aspect-[16/9] overflow-hidden mb-16" style={{background:'var(--bg-base)', width: '100vw', marginLeft: 'calc(50% - 50vw)'}}>
                            <img src={urlFor(selectedGear.image)} alt={selectedGear.name} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-4 flex items-center gap-2" style={{color:'var(--text-secondary)'}}>
                          <span className="w-1.5 h-1.5 bg-[#C2410C] rounded-full inline-block"></span>
                          {selectedGear.brand} · {selectedGear.category}
                        </p>
                        <div className="flex justify-between items-start mb-10">
                          <h2 className="text-[24px] md:text-4xl font-light italic leading-[1.2] max-w-[85%]" style={{color:'var(--text-primary)'}}>{selectedGear.name}</h2>
                          <button
                            onClick={(e) => toggleSave(e, 'gear', selectedGear)}
                            className={`p-3 rounded-full border transition-all shrink-0 ${isItemSaved('gear', selectedGear._id) ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : ''}`}
                            style={!isItemSaved('gear', selectedGear._id) ? {borderColor:'var(--border-mid)', color:'var(--text-primary)'} : {}}
                          >
                            {isItemSaved('gear', selectedGear._id) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                          </button>
                        </div>
                        {selectedGear.note && (
                          <p className="text-[17px] leading-[1.9] italic font-light mb-12 border-l-2 border-[#C2410C]/40 pl-6" style={{color:'var(--text-muted)'}}>"{selectedGear.note}"</p>
                        )}
                        {selectedGear.body && <EditorialRenderer blocks={selectedGear.body} />}
                        {/* 이전/다음 네비게이션 */}
                        <div className="flex justify-between items-center mt-20 pt-10 border-t" style={{borderColor:'var(--border)'}}>
                          {prevGear ? (
                            <button onClick={() => goToGear(prevGear)} className="flex items-center gap-3 text-left group max-w-[45%]">
                              <ArrowLeft size={16} className="transition-colors shrink-0" style={{color:'var(--text-muted)'}} />
                              <div>
                                <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>이전 글</p>
                                <p className="text-[13px] font-light italic transition-colors line-clamp-1" style={{color:'var(--text-secondary)'}}>{prevGear.name}</p>
                              </div>
                            </button>
                          ) : <div />}
                          {nextGear ? (
                            <button onClick={() => goToGear(nextGear)} className="flex items-center gap-3 text-right group max-w-[45%]">
                              <div>
                                <p className="text-[9px] uppercase tracking-widest mb-1" style={{color:'var(--text-muted)'}}>다음 글</p>
                                <p className="text-[13px] font-light italic transition-colors line-clamp-1" style={{color:'var(--text-secondary)'}}>{nextGear.name}</p>
                              </div>
                              <ArrowRight size={16} className="transition-colors shrink-0" style={{color:'var(--text-muted)'}} />
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
                    <div className="mb-16 flex flex-col justify-between items-start gap-8 border-b pb-8" style={{borderColor:'var(--border)'}}>
                      <div>
                        <h2 className="text-4xl font-light italic mb-3" style={{color:'var(--text-primary)'}}>Essential Tools</h2>
                        <p className="text-sm italic tracking-wide" style={{color:'var(--text-secondary)'}}>디렉터 제민의 시선으로 큐레이션된, 기능과 미학의 교차점.</p>
                      </div>
                      <div className="flex gap-6 overflow-x-auto whitespace-nowrap hide-scrollbar w-full">
                        {['ALL', 'PACK', 'APPAREL', 'EYEWEAR', 'ACCESSORY'].map(cat => (<button key={cat} onClick={() => setGearFilter(cat)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all px-4 py-2 rounded-full border`} style={gearFilter === cat ? {background:'var(--text-primary)', color:'var(--bg-base)', borderColor:'var(--text-primary)'} : {color:'var(--text-muted)', borderColor:'transparent'}}>{cat}</button>))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
                      {siteContent.gearItems.filter(item => gearFilter === 'ALL' || item.category === gearFilter).map(item => {
                        const saved = isItemSaved('gear', item._id);
                        return (
                          <div key={item._id} className="group relative cursor-pointer" onClick={() => { setSelectedGear(item); const slug = item.slug?.current || item._id; window.history.pushState({ gearId: item._id }, '', `/gear/${slug}`); }}>
                            <div className="aspect-[4/5] border overflow-hidden rounded-sm mb-8 relative" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                              {item.image && <img src={urlFor(item.image)} className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-105" alt={item.name} />}
                              <div className="absolute inset-0 group-hover:bg-transparent transition-colors duration-700"></div>
                              <button
                                onClick={(e) => toggleSave(e, 'gear', item)}
                                className={`absolute top-6 right-6 z-20 p-3 rounded-full backdrop-blur-md border transition-all ${saved ? 'bg-[#EAE5D9] text-[#151413] border-[#EAE5D9]' : 'bg-black/30 border-white/20 text-white hover:bg-black/60 opacity-0 group-hover:opacity-100'}`}
                              >
                                {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                              </button>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-3 flex items-center gap-2" style={{color:'var(--text-secondary)'}}>
                                <span className="w-1.5 h-1.5 bg-[#C2410C] rounded-full inline-block"></span>
                                {item.brand}
                              </p>
                              <h3 className="text-3xl font-light italic mb-6 transition-colors" style={{color:'var(--text-primary)'}}>{item.name}</h3>
                              <p className="text-[15px] leading-[1.8] italic font-light line-clamp-2" style={{color:'var(--text-muted)'}}>"{item.note}"</p>
                              <button
                                onClick={() => {
                                  setSelectedGear(item);
                                  const slug = item.slug?.current || item._id;
                                  window.history.pushState({ gearId: item._id }, '', `/gear/${slug}`);
                                }}
                                className="mt-3 text-[10px] uppercase tracking-[0.2em] border-b pb-0.5 transition-colors"
                                style={{color:'var(--text-secondary)', borderColor:'var(--border-mid)'}}
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
                  <h2 className="text-4xl font-light italic" style={{color:'var(--text-primary)'}}>Recovery Ritual</h2>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-[9px] uppercase tracking-widest mb-1 font-bold" style={{color:'var(--text-muted)'}}>Ritual Score</p>
                    <p className="text-3xl font-light" style={{color:'var(--text-primary)'}}>
                      {ritualScore !== null ? ritualScore : '—'}
                      <span className="text-sm ml-0.5" style={{color:'var(--text-muted)'}}>/100</span>
                    </p>
                    {ritualScore !== null && (
                      <p className="text-[9px] mt-1" style={{color:'var(--text-dim)'}}>
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
                    <div className="border rounded-sm p-8" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                      <p className="text-[10px] uppercase tracking-widest text-[#FC4C02] mb-3 font-bold">Last Run</p>
                      {stravaData.lastRun ? (
                        <>
                          <h3 className="text-2xl font-light italic mb-1" style={{color:'var(--text-primary)'}}>{stravaData.lastRun.name}</h3>
                          <p className="text-[11px]" style={{color:'var(--text-dim)'}}>{new Date(stravaData.lastRun.start_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          {/* 4-col metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{color:'var(--text-muted)'}}>Distance</p>
                              <p className="text-3xl font-light" style={{color:'var(--text-primary)'}}>{(stravaData.lastRun.distance / 1000).toFixed(1)}</p>
                              <p className="text-[10px] mt-1" style={{color:'var(--text-muted)'}}>km</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{color:'var(--text-muted)'}}>Pace</p>
                              <p className="text-3xl font-light" style={{color:'var(--text-primary)'}}>{formatPace(stravaData.lastRun.paceSecsPerKm)}</p>
                              <p className="text-[10px] mt-1" style={{color:'var(--text-muted)'}}>/km</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{color:'var(--text-muted)'}}>Avg HR</p>
                              <p className="text-3xl font-light" style={{color:'var(--text-primary)'}}>{stravaData.lastRun.average_heartrate ? Math.round(stravaData.lastRun.average_heartrate) : '—'}</p>
                              <p className="text-[10px] mt-1" style={{color:'var(--text-muted)'}}>bpm</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[9px] uppercase tracking-widest mb-2 font-bold" style={{color:'var(--text-muted)'}}>Calories</p>
                              <p className="text-3xl font-light" style={{color:'var(--text-primary)'}}>{stravaData.lastRun.calories ?? '—'}</p>
                              <p className="text-[10px] mt-1" style={{color:'var(--text-muted)'}}>kcal</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="italic mt-3" style={{color:'var(--text-dim)'}}>러닝 기록이 없습니다.</p>
                      )}
                    </div>

                    {/* This Week */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-sm p-8" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                        <p className="text-[9px] uppercase tracking-widest mb-4 font-bold" style={{color:'var(--text-muted)'}}>This Week · Distance</p>
                        <p className="text-4xl font-light" style={{color:'var(--text-primary)'}}>
                          {stravaData.weeklyStats?.distanceM > 0 ? (stravaData.weeklyStats.distanceM / 1000).toFixed(1) : '—'}
                        </p>
                        <p className="text-[10px] mt-2" style={{color:'var(--text-muted)'}}>km</p>
                      </div>
                      <div className="border rounded-sm p-8" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                        <p className="text-[9px] uppercase tracking-widest mb-4 font-bold" style={{color:'var(--text-muted)'}}>This Week · Runs</p>
                        <p className="text-4xl font-light" style={{color:'var(--text-primary)'}}>
                          {stravaData.weeklyStats?.count ?? '—'}
                        </p>
                        <p className="text-[10px] mt-2" style={{color:'var(--text-muted)'}}>activities</p>
                      </div>
                    </div>

                    {/* Recent Runs */}
                    {stravaData.recentRuns?.length > 0 && (
                      <div className="border rounded-sm p-8" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                        <p className="text-[9px] uppercase tracking-widest mb-6 font-bold" style={{color:'var(--text-muted)'}}>Recent Runs</p>
                        <div>
                          {stravaData.recentRuns.map((run, i) => (
                            <div key={i} className="flex justify-between items-center py-4 border-b last:border-0" style={{borderColor:'var(--border)'}}>
                              <div>
                                <p className="text-[13px] font-light" style={{color:'var(--text-primary)'}}>{run.name}</p>
                                <p className="text-[10px] mt-0.5" style={{color:'var(--text-dim)'}}>{new Date(run.start_date).toLocaleDateString('ko-KR')}</p>
                              </div>
                              <div className="text-right shrink-0 ml-4 space-y-0.5">
                                <p className="text-[14px] font-light" style={{color:'var(--text-secondary)'}}>{(run.distance / 1000).toFixed(1)} km</p>
                                <p className="text-[10px]" style={{color:'var(--text-dim)'}}>{formatPace(run.paceSecsPerKm)}{run.average_heartrate ? ` · ${Math.round(run.average_heartrate)} bpm` : ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Ritual */}
                    <div className="text-center pt-8 pb-6">
                      <button
                        onClick={() => generateAiContent('recovery', `당신은 웰니스 에디토리얼 브랜드 PESSAGE의 수석 에디터다.
PESSAGE 문체 규칙:
- 짧고 감각적인 현재형 문장, 단 각 섹션은 충분한 깊이로 써라
- 광고성 표현, 과장 금지 ("최고", "완벽한" 같은 단어 사용 금지)
- 한국어/영어 자연스럽게 혼용
- 여백과 침묵을 활용하는 서사
- 러너 데이터를 반드시 해석해서 반영할 것 — 제네릭한 답변 금지

러너 데이터:
- 마지막 러닝: ${(stravaData.lastRun?.distance / 1000).toFixed(1)}km / 페이스 ${formatPace(stravaData.lastRun?.paceSecsPerKm)} / 심박수 ${Math.round(stravaData.lastRun?.average_heartrate || 0)}bpm
- 이번 주 누적: ${(stravaData.weeklyStats?.distanceM / 1000).toFixed(1)}km / ${stravaData.weeklyStats?.count}회
- Ritual Score: ${ritualScore}/100

위 데이터를 분석해서 이 러너의 신체 상태를 구체적으로 판단한 뒤, 아래 형식으로 출력하라.
형식 외 다른 텍스트는 절대 출력하지 마라.

[TODAY'S READ]
이 러너의 현재 신체 상태와 피로도를 데이터 기반으로 감각적으로 묘사하는 2~3문장. 페이스와 심박수를 해석해서 오늘 몸이 어떤 상태인지 구체적으로 표현할 것.

[RECOVERY SEQUENCE]
1. 액션 — 구체적인 시간/방법/이유 포함 (2줄 이내)
2. 액션 — 구체적인 시간/방법/이유 포함 (2줄 이내)
3. 액션 — 구체적인 시간/방법/이유 포함 (2줄 이내)

[PESSAGE NOTE]
이 러너의 데이터와 연결된 달리기의 철학적 의미. 2~3문장으로 깊이 있게 마무리할 것.`)}
                        className="px-12 py-5 font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-2xl active:scale-95 transition-all"
                        style={{background:'var(--text-primary)', color:'var(--bg-base)'}}
                      >Curate My Ritual</button>
                      {activeAiTarget === 'recovery' && aiResponse && (() => {
                        const sections = {
                          read: aiResponse.match(/\[TODAY'S READ\]([\s\S]*?)\[/)?.[1]?.trim(),
                          sequence: aiResponse.match(/\[RECOVERY SEQUENCE\]([\s\S]*?)\[/)?.[1]?.trim(),
                          note: aiResponse.match(/\[PESSAGE NOTE\]([\s\S]*?)$/)?.[1]?.trim()
                        };
                        return (
                          <div className="mt-10 border rounded-sm text-left" style={{background:'var(--bg-surface)', borderColor:'var(--border)'}}>
                            {sections.read && (
                              <div className="p-8 border-b" style={{borderColor:'var(--border)'}}>
                                <p className="text-[9px] uppercase tracking-[0.3em] mb-3 font-bold" style={{color:'var(--text-muted)'}}>Today's Read</p>
                                <p className="text-[17px] italic font-light leading-[1.8]" style={{color:'var(--text-primary)'}}>{sections.read}</p>
                              </div>
                            )}
                            {sections.sequence && (
                              <div className="p-8 border-b" style={{borderColor:'var(--border)'}}>
                                <p className="text-[9px] uppercase tracking-[0.3em] mb-4 font-bold" style={{color:'var(--text-muted)'}}>Recovery Sequence</p>
                                {sections.sequence.split('\n').filter(Boolean).map((line, i) => (
                                  <p key={i} className="text-[14px] font-light leading-[1.9] py-2 border-b last:border-0" style={{color:'var(--text-secondary)', borderColor:'var(--border)'}}>{line}</p>
                                ))}
                              </div>
                            )}
                            {sections.note && (
                              <div className="p-8">
                                <p className="text-[9px] uppercase tracking-[0.3em] mb-3 font-bold text-[#C2410C]">PESSAGE Note</p>
                                <p className="text-[15px] italic font-light leading-[1.8]" style={{color:'var(--text-muted)'}}>— {sections.note}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      <div className="mt-16">
                        <button
                          onClick={() => { sessionStorage.removeItem('strava_data'); setStravaData(null); }}
                          className="text-[9px] uppercase tracking-[0.3em] transition-colors"
                          style={{color:'var(--text-dim)'}}
                        >Disconnect Strava</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 border border-dashed rounded-sm animate-in fade-in" style={{borderColor:'var(--border-mid)', background:'var(--bg-surface)'}}>
                    <WatchIcon size={48} className="mx-auto mb-8 animate-pulse" style={{color:'var(--text-dim)'}}/>
                    <p className="text-[15px] mb-12 leading-[1.8] font-light italic max-w-sm mx-auto text-center" style={{color:'var(--text-secondary)'}}>
                      거친 트레일의 끝,<br/>실제 러닝 데이터를 연동하여<br/>완벽한 회복의 서사를 완성하세요.
                    </p>
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <button
                        onClick={() => { if (!isLoggedIn) { setAuthMode('login'); } else { loginWithStrava(); } }}
                        className="w-full px-12 py-5 bg-[#FC4C02] text-white font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm shadow-2xl hover:bg-[#e84402] active:scale-95 transition-all"
                      >Connect Strava</button>
                      <p className="text-[10px] uppercase tracking-widest" style={{color:'var(--text-dim)'}}>— or —</p>
                      <button onClick={handleDeviceConnectClick} className="w-full px-12 py-5 border font-bold text-[11px] uppercase tracking-[0.2em] rounded-sm transition-all" style={{borderColor:'var(--border-mid)', color:'var(--text-secondary)'}}>Connect Device</button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      <div className="flex justify-center items-center gap-6 py-6 border-t mb-20" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
        <a href="/privacy" target="_blank" rel="noopener noreferrer"
           className="text-[10px] uppercase tracking-widest transition-colors" style={{color:'var(--text-dim)'}}>
          Privacy Policy
        </a>
        <span style={{color:'var(--text-dim)'}}>·</span>
        <a href="/privacy-ko" target="_blank" rel="noopener noreferrer"
           className="text-[10px] uppercase tracking-widest transition-colors" style={{color:'var(--text-dim)'}}>
          개인정보처리방침
        </a>
      </div>

      <nav className="fixed bottom-0 w-full z-[1001] px-6 md:px-16 pt-4 pb-6 backdrop-blur-2xl border-t flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" style={{background:'var(--bg-surface)', borderColor:'var(--border)', paddingBottom:'calc(1.5rem + env(safe-area-inset-bottom))'}}>

        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}