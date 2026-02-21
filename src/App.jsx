import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, ArrowLeft, 
  Map as MapIcon, List, Calendar, Smartphone as WatchIcon, Quote,
  Bookmark, BookmarkCheck, ExternalLink, MapPin, Layers
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

// --- 🌟 PESSAGE x PORTAL Fallback Data (데이터가 없을 때만 사용) ---
const FALLBACK_DATA = {
  articles: [
    {
      _id: 'portal-feature-1',
      title: 'Shadows on the Trail',
      subtitle: 'Brand Focus: Portal',
      coverImage: { isLocal: true, url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop' },
      content: [
        { _type: 'block', style: 'h2', children: [{ text: '빛과 그림자, 러닝의 이면' }] },
        { _type: 'block', style: 'normal', children: [{ text: '거친 호흡이 지나간 자리, 러닝은 단순한 스포츠가 아닌 하나의 의식(Ritual)이 됩니다.' }] }
      ]
    }
  ],
  gearItems: [
    { _id: 'g1', category: 'PACK', brand: 'PORTAL', name: 'Trail Running Belt', note: '가장 필요한 것만 남긴 미니멀리즘.', image: { isLocal: true, url: 'https://images.unsplash.com/photo-1553531384-397c80973a0b?q=80&w=2070&auto=format&fit=crop' } }
  ],
  routes: [
    { _id: 'r1', name: 'Namsan Loop', type: 'ROAD', region: 'SEOUL', distance: '12.5 km', lat: 37.5511, lng: 126.9882, description: [{_type:'block', style:'normal', children:[{text:'서울의 심장을 달리는 코스.'}]}] }
  ],
  races: []
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

  // --- 1. CMS 데이터 페칭 ---
  useEffect(() => {
    const fetchCmsData = async () => {
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "course"] { ..., "gpxUrl": gpxFile.asset->url, "gallery": images[].asset->url },
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
          articles: data.articles || FALLBACK_DATA.articles,
          routes: data.routes || FALLBACK_DATA.routes,
          gearItems: data.gearItems || FALLBACK_DATA.gearItems,
          races: data.races || []
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

  // --- 3. 액션 핸들러 ---
  const handleSocialLogin = () => { setIsAiLoading(true); setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); }, 1500); };
  const toggleSave = (e, type, item) => { e.stopPropagation(); if (!isLoggedIn) { setAuthMode('login'); return; } setSavedItems(prev => { const isSaved = prev[type].some(i => i._id === item._id); if (isSaved) return { ...prev, [type]: prev[type].filter(i => i._id !== item._id) }; else return { ...prev, [type]: [...prev[type], item] }; }); };
  const handleSyncGPX = (targetId) => { if (!isLoggedIn) { setAuthMode('login'); return; } setActiveAiTarget(targetId); setIsSyncing(true); setTimeout(() => { setIsSyncing(false); setSyncSuccess(true); setTimeout(() => { setSyncSuccess(false); setActiveAiTarget(null); }, 3000); }, 2000); };
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
        ) : activeTab === 'journal' ? (
          /* 📓 JOURNAL TAB */
          <section className="pt-28 px-6 max-w-5xl mx-auto animate-in fade-in duration-700">
            {selectedArticle ? (
              <div className="max-w-3xl mx-auto">
                <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#78716C] mb-12 hover:text-[#EAE5D9] transition-colors"><ArrowLeft size={16} /><span className="text-[10px] uppercase tracking-widest font-bold">Back to Journal</span></button>
                <header className="mb-20 text-center">
                   <p className="text-[10px] uppercase tracking-[0.5em] text-[#78716C] mb-4 font-bold">{selectedArticle.subtitle || 'Editorial'}</p>
                   <h2 className="text-5xl md:text-7xl font-light italic mb-8 tracking-tight">{selectedArticle.title}</h2>
                   <div className="h-[1px] w-20 bg-[#EAE5D9]/20 mx-auto"></div>
                </header>
                <EditorialRenderer blocks={selectedArticle.content} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {siteContent.articles.map((article, idx) => (
                  <div key={article._id} onClick={() => setSelectedArticle(article)} className={`group cursor-pointer ${idx === 0 ? 'md:col-span-2' : ''}`}>
                    <div className={`overflow-hidden rounded-sm bg-[#1A1918] mb-6 ${idx === 0 ? 'aspect-[21/9]' : 'aspect-square'}`}>
                      <img src={urlFor(article.coverImage)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                    </div>
                    <div className={idx === 0 ? 'text-center max-w-2xl mx-auto' : ''}>
                      <p className="text-[10px] uppercase tracking-[0.4em] text-[#78716C] mb-3 font-bold">{article.subtitle}</p>
                      <h3 className={`${idx === 0 ? 'text-4xl' : 'text-2xl'} font-light italic text-[#EAE5D9] group-hover:translate-x-2 transition-transform duration-500`}>{article.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : activeTab === 'routes' ? (
          /* 🗺️ ROUTES TAB */
          <section className="pt-28 px-6 max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-end mb-12 border-b border-[#EAE5D9]/10 pb-8">
              <h2 className="text-4xl font-light italic">Recommended Courses</h2>
              <div className="flex gap-4 p-1 bg-[#EAE5D9]/5 rounded-full border border-[#EAE5D9]/10">
                <button onClick={() => setRouteViewMode('LIST')} className={`p-2 rounded-full transition-all ${routeViewMode === 'LIST' ? 'bg-[#EAE5D9] text-[#151413]' : 'text-[#78716C]'}`}><List size={18} /></button>
                <button onClick={() => setRouteViewMode('MAP')} className={`p-2 rounded-full transition-all ${routeViewMode === 'MAP' ? 'bg-[#EAE5D9] text-[#151413]' : 'text-[#78716C]'}`}><Layers size={18} /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {siteContent.routes.map(route => (
                <div key={route._id} className="group border border-[#EAE5D9]/5 bg-[#1A1918]/50 p-8 rounded-sm hover:border-[#EAE5D9]/30 transition-all duration-500">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[9px] px-2 py-1 rounded-sm font-bold tracking-widest border ${route.difficulty === 'HARD' ? 'text-red-400 border-red-400/30' : 'text-[#EAE5D9] border-[#EAE5D9]/30'}`}>{route.difficulty}</span>
                    <MapPin size={16} className="text-[#78716C]" />
                  </div>
                  <h3 className="text-2xl font-light italic mb-2">{route.title}</h3>
                  <p className="text-[11px] uppercase tracking-widest text-[#78716C] mb-6">{route.location} • {route.distance}</p>
                  <p className="text-sm text-[#A8A29E] leading-relaxed mb-8 line-clamp-3">{route.description}</p>
                  <div className="flex gap-4">
                    <a href={route.mapUrl} target="_blank" rel="noreferrer" className="flex-1 text-center py-3 border border-[#EAE5D9]/20 text-[10px] uppercase font-bold tracking-widest hover:bg-[#EAE5D9] hover:text-[#151413] transition-all">Open Map</a>
                    <button onClick={() => handleSyncGPX(route._id)} className="p-3 border border-[#EAE5D9]/20 text-[#78716C] hover:text-[#EAE5D9]"><Watch size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : activeTab === 'sessions' ? (
          /* 🏁 SESSIONS TAB (기존 반영됨) */
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
                           <div className="flex items-center gap-3 mb-3">
                             <span className="text-[10px] text-[#78716C] font-mono tracking-tighter">{race.date}</span>
                             <span className={`text-[8px] px-2 py-0.5 rounded-sm font-bold tracking-widest border ${race.type === 'TRAIL' ? 'text-[#C2410C] border-[#C2410C]/30' : 'text-[#A8A29E] border-[#A8A29E]/30'}`}>{race.type}</span>
                           </div>
                           <h3 className="text-3xl md:text-4xl font-light italic mb-5 text-[#EAE5D9]">{race.name}</h3>
                           {race.registrationDate && (
                             <div className="flex items-center gap-2 mb-6">
                               <CheckCircle2 size={12} className="text-[#C2410C]" />
                               <p className="text-[11px] uppercase tracking-widest text-[#C2410C] font-bold">Registration: {race.registrationDate}</p>
                             </div>
                           )}
                           <p className="text-[15px] text-[#A8A29E] font-light leading-relaxed max-w-2xl mb-10">{race.description}</p>
                           <div className="flex flex-wrap gap-4">
                              <button onClick={() => generateAiContent(race.name, `${race.name} 대회의 전략을 매거진 톤으로 작성해줘.`)} className="flex items-center gap-3 bg-[#EAE5D9]/5 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#EAE5D9]"><Sparkles size={14} /> AI Strategy</button>
                              {race.registrationUrl && (
                                <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#EAE5D9] px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#151413] hover:bg-white transition-all shadow-lg">Official Link <ExternalLink size={14} /></a>
                              )}
                              <button onClick={() => handleSyncGPX(race._id)} className={`flex items-center gap-3 py-4 px-8 text-[10px] uppercase font-bold tracking-[0.2em] border transition-all rounded-sm border-[#EAE5D9]/20 text-[#A8A29E] hover:border-[#EAE5D9] hover:text-[#EAE5D9]`}>{activeAiTarget === race._id && syncSuccess ? <CheckCircle2 size={14} /> : <Watch size={14} />} {activeAiTarget === race._id && syncSuccess ? 'Synced' : 'Sync Event'}</button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          </section>
        ) : activeTab === 'gear' ? (
          /* 🎒 GEAR TAB */
          <section className="pt-28 px-6 max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
             <div className="mb-16">
              <h2 className="text-4xl font-light italic mb-8">Selected Gear</h2>
              <div className="flex gap-8 border-b border-[#EAE5D9]/10 pb-5 mb-12 overflow-x-auto whitespace-nowrap hide-scrollbar">
                {['ALL', 'PACK', 'APPAREL', 'EYEWEAR'].map(cat => (<button key={cat} onClick={() => setGearFilter(cat)} className={`text-[11px] uppercase tracking-[0.3em] font-bold transition-all ${gearFilter === cat ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450] hover:text-[#A8A29E]'}`}>{cat}</button>))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-16">
              {siteContent.gearItems.map(item => (
                <div key={item._id} className="group cursor-pointer">
                  <div className="aspect-[3/4] overflow-hidden bg-[#1A1918] rounded-sm mb-6 border border-[#EAE5D9]/5">
                    <img src={urlFor(item.image)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2 font-bold">{item.brand}</p>
                  <h3 className="text-lg font-light italic text-[#EAE5D9] mb-4">{item.name}</h3>
                  <div className="flex items-center gap-3 text-[#78716C] italic text-[13px] border-l border-[#EAE5D9]/20 pl-4 py-1">
                    "{item.note}"
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* 🧘 RITUAL (RECOVERY) TAB */
          <section className="pt-40 px-6 max-w-2xl mx-auto text-center animate-in zoom-in-95 duration-700">
             <Wind size={40} className="mx-auto mb-12 text-[#EAE5D9]/30" />
             <h2 className="text-5xl font-light italic mb-8">The Art of Recovery</h2>
             <p className="text-[17px] leading-[1.8] text-[#A8A29E] font-light mb-16">러닝의 끝은 기록이 아닌, 완전한 회복에서 완성됩니다. 호흡을 가다듬고, 근육의 긴장을 풀며 다시 나아갈 준비를 합니다.</p>
             <div className="grid grid-cols-1 gap-6">
                <button onClick={() => generateAiContent('Ritual', '러너를 위한 10분 마인드풀니스 가이드를 작성해줘.')} className="bg-[#EAE5D9] text-[#151413] py-6 px-12 text-[11px] uppercase font-bold tracking-[0.3em] hover:bg-white transition-all shadow-xl">Start Ritual Session</button>
             </div>
             {aiResponse && (
                <div className="mt-20 p-10 bg-[#1A1918] border border-[#EAE5D9]/10 rounded-sm text-left italic leading-[1.8] text-[#EAE5D9]/90 font-light whitespace-pre-wrap animate-in slide-in-from-bottom-4">
                   "{aiResponse}"
                </div>
             )}
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
