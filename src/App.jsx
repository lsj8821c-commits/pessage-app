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
  useCdn: false, // 개발 시에는 정확한 데이터 확인을 위해 CDN을 끕니다.
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
              {block.caption && (
                <figcaption className="mt-4 text-[10px] uppercase tracking-widest text-[#525252] text-center italic">
                  — {block.caption}
                </figcaption>
              )}
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
  const [siteContent, setSiteContent] = useState({ articles: [], routes: [], gearItems: [] });
  const [activeTab, setActiveTab] = useState('journal');
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null); 
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isWatchModalOpen, setIsWatchModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [cmsError, setCmsError] = useState(null);
  const [currentOrigin, setCurrentOrigin] = useState("");

  // --- CMS 데이터 페칭 로직 (안정성 강화) ---
  useEffect(() => {
    // 현재 실행 환경의 도메인(Origin) 추출
    const origin = window.location.origin;
    setCurrentOrigin(origin);
    
    const fetchCmsData = async () => {
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "route"] {
           ...,
           "gpxUrl": gpxFile.asset->url,
           "gallery": images[].asset->url
        },
        "gearItems": *[_type == "gear"]
      }`);
      
      const endpoint = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${query}`;

      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
           const errorText = await response.text();
           throw new Error(`Sanity Error ${response.status}: ${errorText}`);
        }
        const result = await response.json();
        if (result.result) {
          setSiteContent(result.result);
          setCmsError(null);
        }
      } catch (e) {
        console.error("CMS Sync Error Detail:", e);
        // 에러가 발생하면 사용자에게 도움을 줄 수 있는 가이드를 상태로 저장
        setCmsError(e.message || "Failed to fetch data from Sanity");
      }
    };
    fetchCmsData();
  }, []);

  // 도메인 주소 복사 핸들러
  const handleCopyOrigin = () => {
    const tempInput = document.createElement('input');
    tempInput.value = currentOrigin;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
  };

  // --- UI 효과 ---
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => { setActiveTab(id); setSelectedArticle(null); setSelectedRoute(null); setAuthMode(null); setCmsError(null); }} 
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === id ? 'text-white' : 'text-[#525252] hover:text-white'}`}
    >
      <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.5} />
      <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans selection:bg-white selection:text-black">
      
      {/* ⚠️ CORS Error Diagnostic View */}
      {cmsError && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
          <div className="max-w-md w-full bg-[#1c1c1c] border border-red-900/40 p-10 rounded-sm shadow-2xl">
            <AlertTriangle size={48} className="text-orange-500 mx-auto mb-6" />
            <h2 className="text-2xl font-light italic mb-4 text-center">CMS Sync Required</h2>
            <p className="text-sm text-[#a3a3a3] leading-relaxed mb-8 text-center">
              데이터를 불러오기 위해 아래 주소를 Sanity 관리자 페이지의 <strong>CORS Origins</strong>에 추가해야 합니다.
            </p>
            
            <div className="bg-black/50 p-5 rounded-sm border border-white/5 mb-10">
              <p className="text-[9px] uppercase tracking-widest text-[#525252] mb-3 font-bold">Current Origin URL:</p>
              <div className="flex items-center justify-between gap-4">
                <code className="text-[11px] text-orange-400 break-all">{currentOrigin}</code>
                <button onClick={handleCopyOrigin} className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <ol className="text-[11px] text-left space-y-4 mb-10 text-[#737373]">
              <li className="flex gap-3">
                <span className="text-white font-bold">1.</span>
                <span><a href="https://www.sanity.io/manage" target="_blank" className="underline text-white">Sanity Manage</a> 접속 및 로그인</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-bold">2.</span>
                <span><strong>PESSAGE</strong> 프로젝트 → <strong>API</strong> 탭 선택</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-bold">3.</span>
                <span><strong>CORS origins</strong> 섹션의 <strong>Add CORS origin</strong> 클릭</span>
              </li>
              <li className="flex gap-3">
                <span className="text-white font-bold">4.</span>
                <span>복사한 주소를 붙여넣고 <strong>Allow credentials</strong> 체크 후 저장</span>
              </li>
            </ol>

            <button 
              onClick={() => window.location.reload()} 
              className="w-full py-4 bg-white text-black font-bold uppercase text-[12px] tracking-[0.2em] active:scale-95 transition-transform"
            >
              Refresh to Sync
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className={`fixed top-0 w-full z-[1000] transition-all duration-500 px-6 py-4 flex justify-between items-center ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.2em] italic cursor-pointer" onClick={() => {setActiveTab('journal'); setSelectedArticle(null);}}>PESSAGE</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => setIsLoggedIn(!isLoggedIn)} className={isLoggedIn ? "text-white" : "text-[#525252]"}>
            <User size={22} />
          </button>
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
                  <div className="aspect-[21/9] w-full overflow-hidden mb-12 border border-white/5">
                    <img src={urlFor(selectedArticle.coverImage)} alt="" className="w-full h-full object-cover grayscale" />
                  </div>
                )}
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#c2410c] mb-4 font-bold">{selectedArticle.subtitle || 'Article'}</p>
                <h2 className="text-5xl font-light italic mb-16 leading-tight">{selectedArticle.title}</h2>
                <EditorialRenderer blocks={selectedArticle.content} />
                <div className="h-40" />
              </div>
            ) : (
              <div className="pt-32 space-y-24 max-w-4xl mx-auto">
                {siteContent.articles.length > 0 ? siteContent.articles.map(article => (
                  <div key={article._id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer">
                    <p className="text-[10px] tracking-[0.4em] uppercase mb-4 text-[#525252] font-bold">{article.subtitle || 'Volume 01'}</p>
                    <h2 className="text-5xl md:text-7xl font-light italic leading-tight group-hover:text-white transition-colors mb-6">{article.title}</h2>
                    <button className="text-[11px] uppercase tracking-[0.3em] border-b border-white/30 pb-1">Read Journal</button>
                  </div>
                )) : (
                  <div className="h-[60vh] flex flex-col items-center justify-center text-[#333] italic gap-4">
                    <Loader2 size={32} className="animate-spin" />
                    <p className="text-[10px] uppercase tracking-widest tracking-[0.2em]">Syncing Editorial Content...</p>
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
                    <span className={`text-[10px] px-3 py-1 rounded-full border mb-4 inline-block font-bold tracking-widest ${selectedRoute.type === 'TRAIL' ? 'border-orange-400/30 text-orange-400' : 'border-blue-400/30 text-blue-400'}`}>{selectedRoute.type}</span>
                    <h2 className="text-5xl font-light italic">{selectedRoute.name}</h2>
                  </div>
                  <div className="text-right"><p className="text-[10px] text-[#525252] uppercase tracking-widest mb-1">Distance</p><p className="text-2xl font-light">{selectedRoute.distance}</p></div>
                </div>

                {selectedRoute.curationSpot && (
                  <div className="mb-20 animate-in fade-in">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#525252] mb-8 flex items-center gap-3">
                      <Info size={14} /> Curation Spot
                    </p>
                    <div className="bg-[#1c1c1c] aspect-video mb-8 overflow-hidden rounded-sm">
                       {selectedRoute.curationSpot.spotImage && <img src={urlFor(selectedRoute.curationSpot.spotImage)} className="w-full h-full object-cover grayscale" alt="" />}
                    </div>
                    <h3 className="text-2xl font-light italic mb-4">{selectedRoute.curationSpot.spotName}</h3>
                    <p className="text-sm text-[#737373] leading-relaxed italic">{selectedRoute.curationSpot.spotDescription}</p>
                  </div>
                )}

                <div className="mb-20">
                   <EditorialRenderer blocks={selectedRoute.description} />
                </div>

                <button 
                   disabled={!selectedRoute.gpxUrl}
                   className={`w-full py-4 rounded-full font-bold uppercase text-[12px] tracking-widest transition-all ${selectedRoute.gpxUrl ? 'bg-white text-black active:scale-95 shadow-xl' : 'bg-white/5 text-[#444] cursor-not-allowed'}`}>
                  {selectedRoute.gpxUrl ? 'Sync GPX to Watch' : 'No GPX Available'}
                </button>
                <div className="h-40" />
              </div>
            ) : (
              <div className="space-y-6">
                 <h2 className="text-3xl font-light italic mb-12">Narrative Explorer</h2>
                 {siteContent.routes.map(route => (
                   <div key={route._id} onClick={() => setSelectedRoute(route)} className="p-8 bg-[#1c1c1c] border border-white/5 flex justify-between items-center cursor-pointer hover:border-white/20 transition-all group rounded-sm shadow-lg">
                      <div className="flex items-center gap-6">
                         <div className={`w-1 h-8 rounded-full ${route.type === 'TRAIL' ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                         <div>
                            <p className={`text-[9px] uppercase font-bold tracking-widest mb-1 ${route.type === 'TRAIL' ? 'text-orange-400' : 'text-blue-400'}`}>{route.type} / {route.region}</p>
                            <h4 className="text-2xl font-light italic group-hover:text-white transition-colors">{route.name}</h4>
                         </div>
                      </div>
                      <span className="text-xl font-light text-[#525252] group-hover:text-white">{route.distance}</span>
                   </div>
                 ))}
              </div>
            )}
          </section>
        )}

        {/* GEAR TAB */}
        {activeTab === 'gear' && (
          <section className="pt-28 px-6 max-w-4xl mx-auto animate-in fade-in">
            <h2 className="text-3xl font-light italic mb-4">Essential Tools</h2>
            <p className="text-[#525252] text-xs italic mb-20 tracking-wide">에디터의 취향과 신뢰가 깃든 도구들에 대한 사설.</p>
            <div className="space-y-32">
              {siteContent.gearItems.map(item => (
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
            <div className="py-24 border border-dashed border-white/10 rounded-sm bg-white/2 overflow-hidden relative">
              <Zap size={48} className="mx-auto mb-6 text-[#333] animate-pulse"/>
              <p className="text-sm text-[#737373] mb-10 leading-relaxed">워치 데이터를 동기화하여 <br/>오늘의 컨디션에 맞는 리추얼을 분석하세요.</p>
              <button className="px-12 py-4 bg-white text-black font-bold text-[11px] uppercase tracking-widest rounded-full shadow-2xl active:scale-95 transition-transform">Connect Watch</button>
            </div>
          </section>
        )}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 w-full z-[1001] px-10 py-6 bg-black/95 backdrop-blur-xl border-t border-white/5 flex justify-between items-center shadow-2xl">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
