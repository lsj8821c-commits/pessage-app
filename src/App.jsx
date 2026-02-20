import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, ShoppingBag, Wind, User, MapPin, ArrowRight, ChevronRight, Activity, 
  Flag, Watch, CheckCircle2, Sparkles, Loader2, Zap, Coffee, ArrowLeft, Download, 
  TrendingUp, Heart, Settings, LogOut, Mail, Lock, UserPlus, Globe, Trophy, 
  Smartphone, Moon, Check, Flame, CupSoda, Info, BookOpen, Quote, Layers, 
  Map as MapIcon, List, X, XCircle, Maximize2, Music, ThermometerSnowflake, Leaf, Calendar,
  Smartphone as WatchIcon, RefreshCw, Image as ImageIcon, Copy, AlertTriangle
} from 'lucide-react';

/**
 * ============================================================
 * ☁️ SANITY CONFIGURATION (Project ID: 1pnkcp2x)
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

// --- Sanity 이미지 URL 변환 헬퍼 ---
const urlFor = (source) => {
  if (!source || !source.asset || !source.asset._ref) return null;
  const ref = source.asset._ref;
  const [_file, id, dimensions, extension] = ref.split('-');
  return `https://cdn.sanity.io/images/${SANITY_CONFIG.projectId}/${SANITY_CONFIG.dataset}/${id}-${dimensions}.${extension}`;
};

/**
 * 🖋️ Editorial Content Renderer (Portable Text 지원)
 */
const EditorialRenderer = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return (
    <div className="space-y-10">
      {blocks.map((block, index) => {
        if (block._type === 'block') {
          const text = block.children?.map(child => child.text).join('') || '';
          if (!text) return <div key={index} className="h-4" />;
          if (block.style === 'h2') return <h2 key={index} className="text-3xl font-light italic text-white mt-16 mb-6">{text}</h2>;
          if (block.style === 'h3') return <h3 key={index} className="text-xl font-bold text-white mt-8 mb-4">{text}</h3>;
          return <p key={index} className="text-[17px] leading-[1.8] text-[#d4d4d4] font-light">{text}</p>;
        }
        
        if (block._type === 'image') {
          const imageUrl = urlFor(block);
          if (!imageUrl) return null;
          return (
            <figure key={index} className="my-16 animate-in fade-in duration-1000">
              <div className="aspect-video w-full bg-[#1c1c1c] overflow-hidden rounded-sm">
                <img src={imageUrl} alt={block.alt || ''} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
              </div>
              {block.caption && <figcaption className="mt-4 text-[10px] uppercase tracking-widest text-[#525252] text-center italic">— {block.caption}</figcaption>}
            </figure>
          );
        }

        if (block._type === 'quote') {
          return (
            <div key={index} className="py-12 border-y border-white/5 my-16 text-center animate-in slide-in-from-bottom-2">
              <Quote size={24} className="mx-auto mb-6 text-white/20" />
              <p className="text-2xl font-light italic leading-relaxed text-white mb-4">"{block.text}"</p>
              {block.author && <cite className="text-[10px] uppercase tracking-[0.3em] text-[#525252]">— {block.author}</cite>}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default function App() {
  // --- 상태 관리 ---
  const [siteContent, setSiteContent] = useState({ articles: [], routes: [], gearItems: [], races: [] });
  const [activeTab, setActiveTab] = useState('journal');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // 필터 상태들
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
  const [cmsError, setCmsError] = useState(null);
  const [currentOrigin, setCurrentOrigin] = useState("");

  // --- CMS 데이터 페칭 ---
  useEffect(() => {
    setCurrentOrigin(window.location.origin);
    
    const fetchCmsData = async () => {
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "route"] {
           ...,
           "gpxUrl": gpxFile.asset->url,
           "gallery": images[].asset->url
        },
        "gearItems": *[_type == "gear"],
        "races": *[_type == "race"] | order(date asc) 
      }`);
      
      const endpoint = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${query}`;

      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Fetch Error: ${response.status}`);
        const result = await response.json();
        if (result.result) {
          setSiteContent({
            articles: result.result.articles || [],
            routes: result.result.routes || [],
            gearItems: result.result.gearItems || [],
            races: result.result.races.length > 0 ? result.result.races : [
              { _id: 'r1', name: 'Trans Jeju 100K', date: '2026-10-12', type: 'TRAIL', description: '한국 최대의 울트라 트레일 대제전.' },
              { _id: 'r2', name: 'UTMB Mont-Blanc', date: '2026-08-28', type: 'TRAIL', description: '트레일 러너들의 성지.' },
              { _id: 'r3', name: 'Seoul Marathon', date: '2026-03-15', type: 'ROAD', description: '역사적인 서울 로드 레이스.' }
            ]
          });
          setCmsError(null);
        }
      } catch (e) {
        console.error("CMS Sync Error:", e);
        setCmsError(e.message);
      }
    };
    fetchCmsData();
  }, []);

  // --- 워치 연결 핸들러 ---
  const connectDevice = (brand) => {
    setIsAiLoading(true);
    // 실제 연결 시뮬레이션
    setTimeout(() => {
      setConnectedDevice(brand);
      setIsWatchModalOpen(false);
      setIsAiLoading(false);
    }, 1500);
  };

  // --- GPX 전송 핸들러 ---
  const handleSyncGPX = (targetId) => {
    if (!isLoggedIn) { 
      setActiveTab('journal'); 
      return; 
    }
    if (!connectedDevice) {
      setIsWatchModalOpen(true);
      return;
    }
    
    setActiveAiTarget(targetId);
    setIsSyncing(true);
    setSyncSuccess(false);
    
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
        setActiveAiTarget(null);
      }, 3000);
    }, 2000);
  };

  // --- AI 전략 생성 ---
  const generateAiContent = async (target, prompt) => {
    if (!apiKey) return;
    setIsAiLoading(true);
    setActiveAiTarget(target);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "분석 실패");
    } catch (e) { setAiResponse("AI 연결 오류"); } finally { setIsAiLoading(false); }
  };

  // --- UI 효과 ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setSelectedArticle(null); setSelectedRoute(null); setAiResponse(null); setActiveAiTarget(null); }} 
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === id ? 'text-white' : 'text-[#525252] hover:text-white'}`}
    >
      <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.5} />
      <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
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
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-white selection:text-black">
      
      {/* ⚠️ CORS Error Diagnostic */}
      {cmsError && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-6 text-center animate-in fade-in">
          <div className="max-w-md w-full bg-[#1c1c1c] border border-red-900/30 p-10 rounded-sm shadow-2xl">
            <AlertTriangle size={48} className="text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl font-light italic mb-4">CMS Connection Required</h2>
            <p className="text-sm text-[#737373] leading-relaxed mb-8">Sanity 관리자 페이지에 아래 주소를 등록해주세요.</p>
            <code className="block bg-black p-4 text-[11px] text-orange-400 break-all mb-8">{currentOrigin}</code>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-white text-black font-bold uppercase text-[12px] tracking-[0.2em]">Retry Connection</button>
          </div>
        </div>
      )}

      {/* ⌚ Device Connection Modal (복구됨) */}
      {isWatchModalOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-sm w-full bg-[#1c1c1c] border border-white/10 p-8 rounded-sm shadow-2xl">
            <h3 className="text-xl font-light italic mb-8 text-center text-white">Connect Device</h3>
            <div className="space-y-3">
              {['Garmin', 'COROS', 'Apple Watch'].map(brand => (
                <button key={brand} onClick={() => connectDevice(brand)} className="w-full flex justify-between items-center p-5 bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white">{brand}</span>
                  <ChevronRight size={14} className="text-[#525252]" />
                </button>
              ))}
            </div>
            <button onClick={() => setIsWatchModalOpen(false)} className="w-full mt-10 text-[9px] uppercase tracking-widest text-[#444] hover:text-white">Close</button>
          </div>
        </div>
      )}

      {/* 🔄 Syncing/Loading Overlay */}
      {(isAiLoading || isSyncing) && (
        <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 size={32} className="animate-spin text-white mb-6" />
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold tracking-widest text-white">DATA SYNCING...</p>
        </div>
      )}

      {/* 헤더 */}
      <header className={`fixed top-0 w-full z-[1000] transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.2em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setSelectedArticle(null);}}>PESSAGE</h1>
        <div className="flex gap-4 items-center">
          {isLoggedIn ? (
            <>
              <div className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border transition-all ${connectedDevice ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-[#525252]'}`}>
                {connectedDevice ? connectedDevice.toUpperCase() : 'DISCONNECTED'}
              </div>
              <button onClick={() => setIsLoggedIn(!isLoggedIn)} className="p-1 text-[#a3a3a3] hover:text-white transition-all"><User size={22} /></button>
            </>
          ) : (
            <button onClick={() => setIsLoggedIn(true)} className="text-[11px] uppercase bg-white text-black px-5 py-2 rounded-full font-bold shadow-lg active:scale-95 transition-transform">JOIN</button>
          )}
        </div>
      </header>

      <main className="pb-32">
        {/* JOURNAL TAB */}
        {activeTab === 'journal' && (
          <section className="px-6 animate-in fade-in">
            {selectedArticle ? (
              <div className="pt-28 max-w-2xl mx-auto">
                <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#737373] text-[10px] uppercase tracking-widest mb-10 hover:text-white transition-colors"><ArrowLeft size={14} /> Back</button>
                {selectedArticle.coverImage && (
                  <div className="aspect-[21/9] w-full overflow-hidden mb-12 border border-white/5 rounded-sm">
                    <img src={urlFor(selectedArticle.coverImage)} alt="" className="w-full h-full object-cover grayscale" />
                  </div>
                )}
                <h2 className="text-5xl font-light italic mb-16 leading-tight">{selectedArticle.title}</h2>
                <EditorialRenderer blocks={selectedArticle.content} />
                <div className="h-40" />
              </div>
            ) : (
              <div className="pt-32 space-y-24 max-w-4xl mx-auto text-center">
                {siteContent.articles.length > 0 ? siteContent.articles.map(article => (
                  <div key={article._id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer">
                    <p className="text-[10px] tracking-[0.4em] uppercase mb-4 text-[#525252] font-bold">{article.subtitle || 'Volume 01'}</p>
                    <h2 className="text-5xl md:text-7xl font-light italic leading-tight group-hover:text-white transition-colors mb-6">{article.title}</h2>
                    <button className="text-[11px] uppercase tracking-[0.3em] border-b border-white/30 pb-1">Read Journal</button>
                  </div>
                )) : (
                  <div className="h-[60vh] flex flex-col items-center justify-center text-[#333] italic gap-4">
                    <Loader2 size={32} className="animate-spin" />
                    <p>Syncing PESSAGE Content...</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ROUTES TAB */}
        {activeTab === 'routes' && (
          <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            {selectedRoute ? (
              <div className="max-w-2xl mx-auto">
                <button onClick={() => setSelectedRoute(null)} className="flex items-center gap-2 text-[#737373] text-xs uppercase mb-10 hover:text-white transition-colors"><ArrowLeft size={14} /> Back</button>
                <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-12">
                  <div>
                    <span className={`text-[10px] px-3 py-1 rounded-full border mb-4 inline-block font-bold tracking-widest ${selectedRoute.type === 'TRAIL' ? 'text-orange-400 border-orange-400/30' : 'text-blue-400 border-blue-400/30'}`}>{selectedRoute.type}</span>
                    <h2 className="text-5xl font-light italic">{selectedRoute.name}</h2>
                  </div>
                  <div className="text-right"><p className="text-[10px] text-[#525252] uppercase tracking-widest mb-1">Distance</p><p className="text-2xl font-light">{selectedRoute.distance}</p></div>
                </div>

                {selectedRoute.curationSpot && (
                  <div className="mb-20 animate-in fade-in">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#525252] mb-8 flex items-center gap-3"><Info size={14} /> Curation Spot</p>
                    <div className="bg-[#1c1c1c] aspect-video mb-8 overflow-hidden rounded-sm">
                       {selectedRoute.curationSpot.spotImage && <img src={urlFor(selectedRoute.curationSpot.spotImage)} className="w-full h-full object-cover grayscale" alt="" />}
                    </div>
                    <h3 className="text-2xl font-light italic mb-4">{selectedRoute.curationSpot.spotName}</h3>
                    <p className="text-sm text-[#737373] leading-relaxed italic">{selectedRoute.curationSpot.spotDescription}</p>
                  </div>
                )}

                <div className="mb-20"><EditorialRenderer blocks={selectedRoute.description} /></div>

                <button 
                  onClick={() => handleSyncGPX(selectedRoute._id)}
                  className={`w-full py-4 rounded-full font-bold uppercase text-[12px] tracking-widest transition-all flex items-center justify-center gap-2 ${activeAiTarget === selectedRoute._id && syncSuccess ? 'bg-green-600' : 'bg-white text-black active:scale-95 shadow-xl disabled:bg-white/5 disabled:text-[#444]'}`}
                >
                  {activeAiTarget === selectedRoute._id && syncSuccess ? <CheckCircle2 size={16} /> : <Watch size={16} />}
                  {activeAiTarget === selectedRoute._id && syncSuccess ? 'Synced to Watch' : 'Sync GPX to Device'}
                </button>
                <div className="h-40" />
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div><h2 className="text-3xl font-light italic mb-2">Narrative Explorer</h2><p className="text-[#737373] text-sm italic">지도로 탐색하는 러닝의 서사.</p></div>
                    <div className="flex bg-[#1c1c1c] p-1 rounded-full border border-white/5">
                        <button onClick={() => setRouteViewMode('LIST')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${routeViewMode === 'LIST' ? 'bg-white text-black' : 'text-[#525252]'}`}><List size={12}/> List</button>
                        <button onClick={() => setRouteViewMode('MAP')} className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${routeViewMode === 'MAP' ? 'bg-white text-black' : 'text-[#525252]'}`}><MapIcon size={12}/> Map</button>
                    </div>
                 </div>

                 {/* Filters */}
                 <div className="mb-10">
                    <div className="flex gap-6 border-b border-white/5 pb-4 mb-6 overflow-x-auto whitespace-nowrap">
                        {['ALL', 'ORIGINAL', 'TRAIL', 'ROAD'].map(t => (
                          <button key={t} onClick={() => setRouteTypeFilter(t)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${routeTypeFilter === t ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{t}</button>
                        ))}
                    </div>
                    <div className="flex gap-6 border-b border-white/5 pb-4 overflow-x-auto whitespace-nowrap">
                        {['ALL', 'SEOUL', 'JEJU', 'GYEONGGI', 'GANGWON'].map(r => (
                          <button key={r} onClick={() => setRouteRegionFilter(r)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${routeRegionFilter === r ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{r}</button>
                        ))}
                    </div>
                 </div>

                 {routeViewMode === 'MAP' ? (
                   <div className="w-full aspect-[4/5] md:aspect-[16/9] bg-[#1c1c1c] rounded-sm flex items-center justify-center text-[#333] italic border border-white/5">Map logic initialized. Zooming in...</div>
                 ) : (
                   <div className="space-y-6">
                    {siteContent.routes
                      .filter(r => (routeTypeFilter === 'ALL' || r.type === routeTypeFilter))
                      .filter(r => (routeRegionFilter === 'ALL' || r.region === routeRegionFilter))
                      .map(route => (
                      <div key={route._id} onClick={() => setSelectedRoute(route)} className="p-8 bg-[#1c1c1c] border border-white/5 flex justify-between items-center cursor-pointer hover:border-white/20 transition-all group rounded-sm shadow-lg">
                          <div>
                            <p className={`text-[9px] uppercase font-bold tracking-widest mb-1 ${route.type === 'TRAIL' ? 'text-orange-400' : 'text-blue-400'}`}>{route.type} / {route.region}</p>
                            <h4 className="text-2xl font-light italic group-hover:text-white transition-colors">{route.name}</h4>
                          </div>
                          <span className="text-xl font-light text-[#525252] group-hover:text-white">{route.distance}</span>
                      </div>
                    ))}
                   </div>
                 )}
              </div>
            )}
          </section>
        )}

        {/* SESSIONS TAB */}
        {activeTab === 'sessions' && (
          <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-4">
            <div className="mb-12">
              <h2 className="text-3xl font-light italic mb-6">Race & Narrative</h2>
              <div className="flex gap-6 border-b border-white/5 pb-4 mb-10 overflow-x-auto whitespace-nowrap">
                {['ALL', 'TRAIL', 'ROAD'].map(type => (
                  <button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[10px] uppercase tracking-[0.3em] font-bold transition-all ${raceTypeFilter === type ? 'text-white border-b border-white pb-4 -mb-4' : 'text-[#404040]'}`}>{type}</button>
                ))}
              </div>
            </div>

            <div className="space-y-20">
              {Object.entries(groupedRaces()).map(([month, monthRaces]) => (
                <div key={month} className="animate-in fade-in">
                   <div className="flex items-center gap-4 mb-8">
                      <Calendar size={14} className="text-[#404040]" />
                      <h3 className="text-[11px] uppercase tracking-[0.4em] font-bold text-[#525252]">{month}</h3>
                      <div className="h-[1px] bg-white/5 flex-1"></div>
                   </div>
                   <div className="space-y-12">
                      {monthRaces.map(race => (
                        <div key={race._id || race.id} className="group border-l border-white/5 pl-8 relative">
                           <div className={`absolute left-[-4px] top-0 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                           <h3 className="text-3xl font-light italic mb-4">{race.name}</h3>
                           <p className="text-sm text-[#737373] font-light leading-relaxed max-w-xl mb-8">{race.description}</p>
                           <div className="flex gap-3">
                              <button onClick={() => generateAiContent(race.name, `${race.name} 전략`)} className="flex items-center gap-2 bg-white/10 px-6 py-3 text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"><Sparkles size={12} /> AI Strategy</button>
                              <button 
                                onClick={() => handleSyncGPX(race._id)}
                                className={`flex items-center gap-2 py-3 px-6 text-[10px] uppercase tracking-widest border border-[#262626] transition-all ${activeAiTarget === race._id && syncSuccess ? 'bg-green-600 border-none' : 'hover:border-white'}`}
                              >
                                {activeAiTarget === race._id && syncSuccess ? <CheckCircle2 size={12} /> : <Watch size={12} />}
                                {activeAiTarget === race._id && syncSuccess ? 'Synced' : 'Sync GPX'}
                              </button>
                           </div>
                           {activeAiTarget === race.name && aiResponse && (
                             <div className="mt-8 p-6 bg-white/5 border border-white/5 rounded-sm italic text-sm text-[#d4d4d4] font-light leading-relaxed">"{aiResponse}"</div>
                           )}
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* GEAR TAB */}
        {activeTab === 'gear' && (
          <section className="pt-28 px-6 max-w-4xl mx-auto animate-in fade-in">
            <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
              <div><h2 className="text-3xl font-light italic mb-2">Essential Tools</h2><p className="text-[#525252] text-xs italic tracking-wide">에디터의 취향과 신뢰가 깃든 도구들에 대한 사설.</p></div>
              <div className="flex gap-4 border-b border-white/5 pb-1 overflow-x-auto whitespace-nowrap">
                {['ALL', 'TRAIL', 'ROAD', 'NUTRITION'].map(cat => (
                  <button key={cat} onClick={() => setGearFilter(cat)} className={`text-[9px] uppercase tracking-widest font-bold transition-all ${gearFilter === cat ? 'text-white border-b border-white pb-2' : 'text-[#404040]'}`}>{cat}</button>
                ))}
              </div>
            </div>

            <div className="space-y-32">
              {siteContent.gearItems.filter(item => gearFilter === 'ALL' || item.category === gearFilter).map(item => (
                <div key={item._id} className="flex flex-col md:flex-row gap-12 items-start group">
                  <div className="w-full md:w-1/2 aspect-[4/5] bg-[#1c1c1c] border border-white/5 overflow-hidden rounded-sm">
                    {item.image && <img src={urlFor(item.image)} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" alt={item.name} />}
                  </div>
                  <div className="w-full md:w-1/2 pt-4">
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em] mb-4 text-[#525252]">{item.category} • {item.brand}</p>
                    <h3 className="text-4xl font-light italic mb-8 group-hover:text-white transition-colors">{item.name}</h3>
                    <div className="relative">
                       <Quote size={18} className="absolute -left-8 -top-2 text-white/10" />
                       <p className="text-sm leading-relaxed text-[#a3a3a3] italic">"{item.note}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RITUAL TAB */}
        {activeTab === 'recovery' && (
          <section className="px-6 pt-28 max-w-3xl mx-auto text-center animate-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-light italic mb-10">Recovery Ritual</h2>
            <div className="py-24 border border-dashed border-white/10 rounded-sm relative bg-white/[0.02]">
              {connectedDevice ? (
                <div className="animate-in fade-in">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                      <div className="bg-[#1c1c1c] p-6 border border-white/5 rounded-sm"><p className="text-[10px] uppercase tracking-widest text-[#737373] mb-4 font-bold">Recovery Score</p><div className="text-6xl font-light mb-2">84</div><p className="text-[9px] text-green-400 uppercase font-bold tracking-widest">Optimal</p></div>
                      <div className="bg-[#1c1c1c] p-6 border border-white/5 rounded-sm"><p className="text-[10px] uppercase tracking-widest text-[#737373] mb-4 font-bold">Data Source</p><div className="text-2xl font-light uppercase tracking-tighter mt-4">{connectedDevice}</div></div>
                      <div className="bg-[#1c1c1c] p-6 border border-white/5 rounded-sm"><p className="text-[10px] uppercase tracking-widest text-[#737373] mb-4 font-bold">Last Sync</p><div className="text-2xl font-light italic mt-4">Just Now</div></div>
                   </div>
                   <button onClick={() => generateAiContent('recovery', 'Recovery Ritual 조언')} className="px-12 py-4 bg-white text-black font-bold text-[11px] uppercase tracking-widest rounded-full shadow-2xl active:scale-95 transition-transform">Get AI Ritual</button>
                   {activeAiTarget === 'recovery' && aiResponse && (
                     <div className="mt-12 text-sm italic text-[#d4d4d4] font-light leading-relaxed max-w-md mx-auto">"{aiResponse}"</div>
                   )}
                   <button onClick={() => setIsWatchModalOpen(true)} className="mt-12 text-[10px] uppercase tracking-widest text-[#525252] hover:text-white block mx-auto underline underline-offset-4">Change Device</button>
                </div>
              ) : (
                <div className="animate-in fade-in">
                   <Zap size={48} className="mx-auto mb-6 text-[#333] animate-pulse"/>
                   <p className="text-sm text-[#737373] mb-10 leading-relaxed font-light">워치 데이터를 동기화하여 <br/>오늘의 컨디션에 맞는 리추얼을 분석하세요.</p>
                   <button onClick={() => setIsWatchModalOpen(true)} className="px-12 py-4 bg-white text-black font-bold text-[11px] uppercase tracking-widest rounded-full shadow-2xl active:scale-95 transition-transform">Connect Watch</button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 w-full z-[1001] px-10 py-6 bg-black/95 backdrop-blur-xl border-t border-white/5 flex justify-between items-center shadow-2xl transition-transform duration-500">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
