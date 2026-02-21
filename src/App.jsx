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

// --- Sanity 이미지 URL 변환 헬퍼 ---
const urlFor = (source) => {
  if (!source) return null;
  if (source.isLocal) return source.url; 
  if (!source.asset || !source.asset._ref) return null;
  const ref = source.asset._ref;
  const [_file, id, dimensions, extension] = ref.split('-');
  return `https://cdn.sanity.io/images/${SANITY_CONFIG.projectId}/${SANITY_CONFIG.dataset}/${id}-${dimensions}.${extension}`;
};

// --- 🌟 PESSAGE Fallback Data ---
const FALLBACK_DATA = {
  articles: [
    {
      _id: 'fallback-1',
      title: 'The Silent Pace',
      subtitle: 'Editor\'s Note',
      coverImage: { isLocal: true, url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop' },
      content: [{ _type: 'block', style: 'normal', children: [{ text: '데이터를 불러오는 중입니다...' }] }]
    }
  ],
  gearItems: [],
  routes: [],
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
        if (block._type === 'quote') {
          return (
            <div key={index} className="py-16 border-y border-[#EAE5D9]/10 my-20 text-center bg-gradient-to-b from-transparent via-[#EAE5D9]/5 to-transparent">
              <Quote size={24} className="mx-auto mb-8 text-[#EAE5D9]/30" />
              <p className="text-2xl md:text-3xl font-light italic text-[#EAE5D9] mb-6 px-4">"{block.text}"</p>
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
  const [raceTypeFilter, setRaceTypeFilter] = useState('ALL');
  const [gearFilter, setGearFilter] = useState('ALL');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [activeAiTarget, setActiveAiTarget] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // --- 1. CMS 데이터 페칭 ---
  useEffect(() => {
    const fetchCmsData = async () => {
      const query = encodeURIComponent(`{
        "articles": *[_type == "journal"] | order(publishedAt desc),
        "routes": *[_type == "course"] { ..., "gpxUrl": gpxFile.asset->url },
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
          races: data.races || []
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

  const handleSyncGPX = (targetId) => {
    if (!isLoggedIn) { setAuthMode('login'); return; }
    setActiveAiTarget(targetId);
    setTimeout(() => { setSyncSuccess(true); setTimeout(() => { setSyncSuccess(false); setActiveAiTarget(null); }, 3000); }, 1500);
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
    } catch (e) { setAiResponse("AI Connection Error"); } finally { setIsAiLoading(false); }
  };

  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(id); setSelectedArticle(null); setAiResponse(null); }} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === id ? 'text-[#EAE5D9]' : 'text-[#78716C] hover:text-[#EAE5D9]'}`}><Icon size={20} /><span className="text-[9px] uppercase tracking-widest font-medium">{label}</span></button>
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
    <div className="min-h-screen bg-[#151413] text-[#EAE5D9] font-sans">
      {/* Header */}
      <header className={`fixed top-0 w-full z-[1000] transition-all duration-700 px-6 py-5 flex justify-between items-center ${scrolled ? 'bg-[#151413]/90 backdrop-blur-lg border-b border-[#EAE5D9]/5' : 'bg-gradient-to-b from-[#151413]/80 to-transparent'}`}>
        <h1 className="text-2xl font-bold tracking-[0.3em] italic cursor-pointer" onClick={() => setActiveTab('journal')}>PESSAGE</h1>
        <button onClick={() => setAuthMode('login')} className="text-[10px] uppercase tracking-widest bg-[#EAE5D9] text-[#151413] px-6 py-2.5 rounded-full font-bold">SIGN IN</button>
      </header>

      <main className="pb-40 pt-10">
        {activeTab === 'journal' && (
          <section className="pt-28 px-6 max-w-5xl mx-auto">
            {selectedArticle ? (
              <div className="animate-in fade-in">
                <button onClick={() => setSelectedArticle(null)} className="flex items-center gap-2 text-[#78716C] mb-12 hover:text-[#EAE5D9]"><ArrowLeft size={16} /> Back</button>
                <h2 className="text-5xl font-light italic mb-12">{selectedArticle.title}</h2>
                <EditorialRenderer blocks={selectedArticle.content} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {siteContent.articles.map(article => (
                  <div key={article._id} onClick={() => setSelectedArticle(article)} className="group cursor-pointer">
                    <div className="aspect-[16/9] overflow-hidden rounded-sm bg-[#1A1918] mb-6 border border-[#EAE5D9]/5">
                      <img src={urlFor(article.coverImage)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-2xl font-light italic">{article.title}</h3>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'sessions' && (
          /* 🏁 SESSIONS TAB: 제민님의 CSV 데이터와 완벽 연동 */
          <section className="pt-28 px-6 max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
            <div className="mb-16">
              <h2 className="text-4xl font-light italic mb-8">Race Calendar</h2>
              <div className="flex gap-8 border-b border-[#EAE5D9]/10 pb-5 mb-12">
                {['ALL', 'TRAIL', 'ROAD'].map(type => (<button key={type} onClick={() => setRaceTypeFilter(type)} className={`text-[11px] uppercase tracking-[0.3em] font-bold ${raceTypeFilter === type ? 'text-[#EAE5D9] border-b border-[#EAE5D9] pb-5 -mb-5' : 'text-[#5A5450]'}`}>{type}</button>))}
              </div>
            </div>

            <div className="space-y-24">
              {Object.entries(groupedRaces()).map(([month, monthRaces]) => (
                <div key={month}>
                   <div className="flex items-center gap-4 mb-10">
                      <Calendar size={16} className="text-[#A8A29E]" />
                      <h3 className="text-[12px] uppercase tracking-[0.4em] font-bold text-[#A8A29E]">{month}</h3>
                      <div className="h-[1px] bg-[#EAE5D9]/10 flex-1"></div>
                   </div>
                   <div className="space-y-16">
                      {monthRaces.map(race => (
                        <div key={race._id} className="group border-l-2 border-[#EAE5D9]/10 pl-8 md:pl-12 relative hover:border-[#EAE5D9]/50 transition-colors">
                           <div className={`absolute left-[-5px] top-1.5 w-2 h-2 rounded-full ${race.type === 'TRAIL' ? 'bg-[#C2410C]' : 'bg-[#A8A29E]'}`}></div>
                           
                           {/* 날짜와 타입 */}
                           <div className="flex items-center gap-3 mb-3">
                             <span className="text-[10px] text-[#78716C] font-mono">{race.date}</span>
                             <span className="text-[8px] px-2 py-0.5 border border-[#EAE5D9]/20 rounded-sm font-bold">{race.type}</span>
                           </div>

                           <h3 className="text-3xl font-light italic mb-4 text-[#EAE5D9]">{race.name}</h3>
                           
                           {/* 💡 핵심: 접수 기간 표시 */}
                           {race.registrationDate && (
                             <div className="flex items-center gap-2 mb-6 text-[#C2410C]">
                               <CheckCircle2 size={12} />
                               <p className="text-[11px] uppercase tracking-widest font-bold">Registration: {race.registrationDate}</p>
                             </div>
                           )}

                           <p className="text-[15px] text-[#A8A29E] font-light leading-relaxed mb-10 max-w-2xl">{race.description}</p>
                           
                           <div className="flex flex-wrap gap-4">
                              <button onClick={() => generateAiContent(race.name, `${race.name} 대회의 전략을 짧게 작성해줘.`)} className="flex items-center gap-3 bg-[#EAE5D9]/5 px-8 py-4 text-[10px] uppercase font-bold tracking-widest rounded-sm"><Sparkles size={14} /> AI Strategy</button>
                              
                              {/* 💡 핵심: 접수처 링크 버튼 */}
                              {race.registrationUrl && (
                                <a href={race.registrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-[#EAE5D9] text-[#151413] px-8 py-4 text-[10px] uppercase font-bold tracking-widest rounded-sm">
                                  Official Link <ExternalLink size={14} />
                                </a>
                              )}
                              
                              <button onClick={() => handleSyncGPX(race._id)} className="flex items-center gap-3 border border-[#EAE5D9]/20 px-8 py-4 text-[10px] uppercase font-bold tracking-widest rounded-sm text-[#78716C] hover:text-[#EAE5D9]">
                                {activeAiTarget === race._id && syncSuccess ? <CheckCircle2 size={14} /> : <Watch size={14} />} 
                                {activeAiTarget === race._id && syncSuccess ? 'Synced' : 'Sync Event'}
                              </button>
                           </div>

                           {activeAiTarget === race.name && aiResponse && (
                             <div className="mt-8 p-6 bg-[#1A1918] border border-[#EAE5D9]/5 rounded-sm italic text-sm text-[#EAE5D9]/80 animate-in slide-in-from-top-4">
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

        {/* Other Tabs Placeholder */}
        {(activeTab === 'routes' || activeTab === 'gear' || activeTab === 'recovery') && (
          <section className="pt-40 px-6 text-center text-[#78716C] italic">
             {activeTab.toUpperCase()} Section is being curated...
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 w-full z-[1001] px-6 py-8 bg-[#151413]/95 backdrop-blur-2xl border-t border-[#EAE5D9]/5 flex justify-between items-center">
        <NavItem id="journal" icon={Wind} label="Journal" />
        <NavItem id="routes" icon={Compass} label="Routes" />
        <NavItem id="sessions" icon={Flag} label="Sessions" />
        <NavItem id="gear" icon={ShoppingBag} label="Gear" />
        <NavItem id="recovery" icon={Activity} label="Ritual" />
      </nav>
    </div>
  );
}
