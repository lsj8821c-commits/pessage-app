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
        { _type: 'block', style: 'normal', children: [{ text: '거친 호흡이 지나간 자리, 러닝은 단순한 스포츠가 아닌 하나의 의식(Ritual)이 됩니다.' }] },
        { _type: 'quote', text: '가장 거친 자연 속에서 가장 정제된 나를 발견한다.', author: 'Patrick Stangbye' }
      ]
    }
  ],
  gearItems: [],
  routes: [],
  races: [
    { _id: 'race1', name: 'Trans Jeju 100K', date: '2026-10-12', registrationDate: '2026.04 오픈 예정', registrationUrl: 'https://transjeju.com', type: 'TRAIL', description: '화산섬의 척박한 땅을 달리는 국내 최대의 울트라 트레일 대제전.' },
    { _id: 'race2', name: 'Seoul Marathon', date: '2026-03-15', registrationDate: '선착순 접수 중', registrationUrl: 'http://seoul-marathon.com', type: 'ROAD', description: '서울의 심장을 가로지르는 역사적인 레이스.' }
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
          return <p key={index} className="text-[17px] leading-[1.8] text-[#A8A29E] font-light">{text}</p>;
        }
        if (block._type === 'image') {
          const imageUrl = urlFor(block);
          if (!imageUrl) return null;
          return (
            <figure key={index} className="my-20">
              <div className="aspect-video w-full bg-[#1A1918] overflow-hidden rounded-sm border border-[#EAE5D9]/5">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </figure>
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
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeAiTarget, setActiveAiTarget] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // --- 1. CMS 데이터 페칭 ---
  useEffect(() => {
    const fetchCmsData = async () => {
      // 💡 races 필드에 registrationDate, registrationUrl이 포함되도록 쿼리 확인
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "route"] { ..., "gpxUrl": gpxFile.asset->url },
        "gearItems": *[_type == "gear"],
        "races": *[_type == "race"] | order(date asc) 
      }`);
      
      const endpoint = `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}?query=${query}`;

      try {
        const response = await fetch(endpoint);
        const result = await response.json();
        const data = result.result;
        setSiteContent({
          articles: data.articles?.length > 0 ? data.articles : FALLBACK_DATA.articles,
          routes: data.routes || [],
          gearItems: data.gearItems || [],
          races: data.races?.length > 0 ? data.races : FALLBACK_DATA.races
        });
      } catch (e) {
        setSiteContent(FALLBACK_DATA); 
      }
    };
    fetchCmsData();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSocialLogin = () => { setIsAiLoading(true); setTimeout(() => { setIsLoggedIn(true); setAuthMode(null); setIsAiLoading(false); }, 1500); };
  const toggleSave = (e, type, item) => { e.stopPropagation(); if (!isLoggedIn) { setAuthMode('login'); return; } setSavedItems(prev => { const isSaved = prev[type].some(i => i._id === item._id); if (isSaved) return { ...prev, [type]: prev[type].filter(i => i._id !== item._id) }; else return { ...prev, [type]: [...prev[type], item] }; }); };
  const isItemSaved = (type, id) => savedItems[type].some(i => i._id === id);

  const handleSyncGPX = (targetId) => {
    if (!isLoggedIn) { setAuthMode('login'); return; }
    setActiveAiTarget(targetId);
    setTimeout(() => { setSyncSuccess(true); setTimeout(() => { setSyncSuccess(false); setActiveAiTarget(null); }, 3000); }, 2000);
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
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || "Error");
    } catch (e) { setAiResponse("AI 연결 오류"); } finally { setIsAiLoading(false); }
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(id); setSelectedArticle(null); setAiResponse(null); setActiveAiTarget(null); setAuthMode(null); setIsProfileOpen(false); }} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === id && !authMode ? 'text-[#EAE5D9]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><Icon size={20} /><span className="text-[9px] uppercase tracking-widest font-medium">{label}</span></button>
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
      {(isAiLoading) && (
        <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
          <Loader2 size={36} className="animate-spin text-[#EAE5D9] mb-8" />
          <p className="text-[11px] uppercase tracking-[0.5em] font-bold text-[#EAE5D9]">CALIBRATING...</p>
        </div>
      )}

      <header className={`fixed top-0 w-full z-[1000] transition-all duration-700 px-6 py-5 flex justify-between items-center ${scrolled ? 'bg-[#151413]/90 backdrop-blur-lg border-b border-[#EAE5D9]/5' : 'bg-gradient-to-b from-[#151413]/80 to-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.3em] italic cursor-pointer" onClick={() => setActiveTab('journal')}>PESSAGE</h1>
        <button onClick={() => setAuthMode('login')} className="text-[10px] uppercase tracking-widest bg-[#EAE5D9] text-[#151413] px-6 py-2.5 rounded-full font-bold shadow-lg">SIGN IN</button>
      </header>

      <main className="pb-40 pt-10">
        {authMode ? (
          <section className="pt-32 px-6 max-w-sm mx-auto text-center">
             <h2 className="text-4xl font-light italic mb-12">Join the Pack</h2>
             <button onClick={handleSocialLogin} className="w-full py-5 border border-[#EAE5D9]/20 text-[11px] font-bold tracking-[0.2em] mb-4 rounded-sm">GOOGLE CONNECT</button>
             <button onClick={() => setAuthMode(null)} className="text-[10px] uppercase tracking-widest text-[#78716C] border-b border-[#78716C] pb-1">Return</button>
          </section>
        ) : activeTab === 'sessions' ? (
          /* 🏁 SESSIONS TAB: 정확한 데이터 매핑 및 UI 수정 */
          <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
            <div className="mb-16">
              <h2 className="text-4xl font-light italic mb-8">Race Calendar</h2>
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
                      {monthRaces.map((race, idx) => (
                        <div key={race._id || idx} className="group border-l-2 border-[#EAE5D9]/10 pl-8 md:pl-12 relative hover:border-[#EAE5D9]/50 transition-colors duration-500">
                           <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-[#C2410C]' : 'bg-[#A8A29E]'}`}></div>
                           
                           {/* 💡 날짜 및 유형 배지 */}
                           <div className="flex items-center gap-3 mb-3">
                             <span className="text-[10px] text-[#78716C] font-mono tracking-tighter">{race.date}</span>
                             <span className={`text-[8px] px-2 py-0.5 rounded-sm font-bold tracking-widest border ${race.type === 'TRAIL' ? 'text-[#C2410C] border-[#C2410C]/30' : 'text-[#A8A29E] border-[#A8A29E]/30'}`}>{race.type}</span>
                           </div>

                           <h3 className="text-3xl md:text-4xl font-light italic mb-5 text-[#EAE5D9]">{race.name}</h3>
                           
                           {/* 💡 접수 기간 (신규 필드 연동) */}
                           {race.registrationDate && (
                             <div className="flex items-center gap-2 mb-6 text-[#C2410C]">
                               <CheckCircle2 size={12} />
                               <p className="text-[11px] uppercase tracking-widest font-bold">Registration: {race.registrationDate}</p>
                             </div>
                           )}

                           <p className="text-[15px] text-[#A8A29E] font-light leading-relaxed max-w-2xl mb-10">{race.description}</p>
                           
                           <div className="flex flex-wrap gap-4">
                              <button onClick={() => generateAiContent(race.name, `${race.name} 대회의 전략을 짧고 감각적이게 작성해줘.`)} className="flex items-center gap-3 bg-[#EAE5D9]/5 px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#EAE5D9] hover:bg-[#EAE5D9]/10 transition-all"><Sparkles size={14} /> AI Strategy</button>
                              
                              {/* 💡 공식 홈페이지 링크 버튼 (신규 필드 연동) */}
                              {race.registrationUrl && (
                                <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#EAE5D9] px-8 py-4 text-[10px] uppercase font-bold tracking-[0.2em] rounded-sm text-[#151413] hover:bg-white transition-all shadow-lg">
                                  Official Link <ExternalLink size={14} />
                                </a>
                              )}

                              <button onClick={() => handleSyncGPX(race._id)} className={`flex items-center gap-3 py-4 px-8 text-[10px] uppercase font-bold tracking-[0.2em] border transition-all rounded-sm ${activeAiTarget === race._id && syncSuccess ? 'bg-[#166534] border-[#166534] text-[#EAE5D9]' : 'border-[#EAE5D9]/20 text-[#A8A29E] hover:border-[#EAE5D9] hover:text-[#EAE5D9]'}`}>
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
          /* Journal 탭 등 기본 페이지 */
          <section className="pt-28 px-6 max-w-5xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {siteContent.articles.map(article => (
                  <div key={article._id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer">
                    <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#1A1918] mb-6 border border-[#EAE5D9]/5 relative">
                      <img src={urlFor(article.coverImage)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#78716C] mb-3 font-bold">{article.subtitle}</p>
                    <h3 className="text-2xl font-light italic text-[#EAE5D9]">{article.title}</h3>
                  </div>
                ))}
             </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 w-full z-[1001] px-6 md:px-16 py-6 bg-[#151413]/95 backdrop-blur-2xl border-t border-[#EAE5D9]/5 flex justify-between items-center shadow-2xl">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
