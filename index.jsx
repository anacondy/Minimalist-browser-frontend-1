import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, History, Bookmark, Layers, X, Globe } from 'lucide-react';

// Main App Component
export default function App() {
  // State to manage the current active view (main, tabs, history, bookmarks, settings)
  const [activeView, setActiveView] = useState('main');
  
  // State to manage the search bar position ('bottom' or 'raised')
  const [searchPosition, setSearchPosition] = useState('raised');
  
  // State to store the user's search query
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reference to the search input element for programmatic focus (Ctrl+K)
  const searchInputRef = useRef(null);

  // Mock data for Tabs, inspired by the staggered schedule image (Image 3)
  // Included YouTube Music as per your preferences!
  const openTabs = [
    { id: 1, label: '01/MAIN', title: 'YOUTUBE MUSIC - CURRENT PLAYLIST', offset: 'ml-0' },
    { id: 2, label: '02/DOCS', title: 'PHYSICS SEMESTER NOTES', offset: 'ml-12' },
    { id: 3, label: '03/CODE', title: 'REACT JS DOCUMENTATION', offset: 'ml-24' },
    { id: 4, label: '04/DATA', title: 'STATISTICS RESEARCH PAPER', offset: 'ml-16' },
    { id: 5, label: '05/SYS',  title: 'SS JAIN SUBODH PORTAL', offset: 'ml-4' },
    { id: 6, label: '06/SRCH', title: 'GITHUB REPOSITORIES', offset: 'ml-20' },
    { id: 7, label: '07/NET',  title: 'STACK OVERFLOW THREADS', offset: 'ml-32' },
  ];

  // Mock data for History, styled like the cast list (Image 1)
  const historyData = [
    { role: 'visited', name: 'localhost:3000' },
    { role: 'searched', name: 'how to build custom browser engine' },
    { role: 'played', name: 'youtube music - lofi hip hop' },
    { role: 'read', name: 'advanced physics kinematics' },
    { role: 'downloaded', name: 'statistics_dataset_2025.csv' },
    { role: 'visited', name: 'github.com/trending' },
    { role: 'searched', name: 'minimalist brutalist web design' },
  ];

  // Effect hook to handle all global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus Search (Ctrl + K)
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setActiveView('main');
        // Small timeout ensures the view renders before we try to focus
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // Open Settings (Ctrl + ,)
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setActiveView('settings');
      }
      // Open History (Ctrl + H)
      else if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setActiveView('history');
      }
      // Open Bookmarks (Ctrl + B)
      else if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setActiveView('bookmarks');
      }
      // Escape to return to main view
      else if (e.key === 'Escape') {
        setActiveView('main');
      }
    };

    // Attach event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener on component unmount
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Effect to autofocus search bar on initial load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reusable component for the Navigation/Status Bar at the top
  const TopNav = () => (
    <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 mix-blend-difference text-neutral-400 font-mono text-xs uppercase tracking-[0.2em]">
      <div className="flex flex-col gap-1">
        <span>BPM® BROWSER v1.0</span>
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
      </div>
      <div className="flex gap-6">
        <button onClick={() => setActiveView('tabs')} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
          <Layers size={14} /> Tabs
        </button>
        <button onClick={() => setActiveView('history')} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
          <History size={14} /> Hist
        </button>
        <button onClick={() => setActiveView('bookmarks')} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
          <Bookmark size={14} /> Bkmk
        </button>
        <button onClick={() => setActiveView('settings')} className="hover:text-white transition-colors duration-300 flex items-center gap-2">
          <Settings size={14} /> Cfg
        </button>
      </div>
    </div>
  );

  return (
    // Main Container: Strict black background, hidden overflow for clean UI
    <div className="min-h-screen bg-black text-neutral-200 font-sans overflow-hidden relative selection:bg-white selection:text-black">
      
      <TopNav />

      {/* --- MAIN SEARCH VIEW --- */}
      {/* Inspired by Image 2 (Catalog/BPM cover) */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'main' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <div className="text-center mb-24">
          <p className="font-mono text-xs tracking-[0.3em] text-neutral-500 mb-4">CATALOGUE BR/1.0</p>
          <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-white mb-6">SYS®</h1>
          <div className="font-mono text-xs tracking-[0.1em] text-neutral-400 space-y-1">
            <p>HERE FOR THE WEB.</p>
            <p>JAIPUR, RAJASTHAN</p>
            <p>WORLDWIDE © 2026</p>
          </div>
        </div>
      </div>

      {/* --- TABS VIEW --- */}
      {/* Inspired by Image 3 (Staggered schedule list) */}
      <div className={`absolute inset-0 overflow-y-auto overflow-x-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pt-32 pb-48 px-8 md:px-24 ${activeView === 'tabs' ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
        <h2 className="text-4xl font-bold tracking-tighter text-white mb-16 border-b border-neutral-800 pb-4">OPEN SESSIONS : <span className="text-neutral-600">LOST</span></h2>
        <div className="space-y-8 flex flex-col items-start">
          {openTabs.map((tab) => (
            <div 
              key={tab.id} 
              className={`group flex items-end gap-6 cursor-pointer hover:text-white transition-all duration-300 ${tab.offset}`}
            >
              <span className="font-mono text-xs tracking-widest text-neutral-500 mb-1">{tab.label}</span>
              <span className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-300 group-hover:text-white group-hover:tracking-widest transition-all duration-500">
                {tab.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- HISTORY VIEW --- */}
      {/* Inspired by Image 1 (Center-aligned cast list) */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'history' ? 'opacity-100 scale-100 z-20' : 'opacity-0 scale-105 pointer-events-none'}`}>
        <div className="text-center space-y-2 max-h-[70vh] overflow-y-auto w-full px-4 scrollbar-hide">
          {historyData.map((item, i) => (
            <div key={i} className="text-lg md:text-2xl tracking-wide hover:scale-105 transition-transform cursor-pointer">
              <span className="text-neutral-600 font-medium mr-3">{item.role}</span>
              <span className="text-neutral-200 font-bold">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- BOOKMARKS VIEW --- */}
      {/* Minimalist grid view */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'bookmarks' ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-center">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="group cursor-pointer">
               <div className="w-24 h-24 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white group-hover:text-black transition-all duration-500">
                  <Globe size={32} strokeWidth={1} />
               </div>
               <p className="font-mono text-xs tracking-widest text-neutral-500 group-hover:text-white transition-colors">BKMK_0{i}</p>
             </div>
           ))}
        </div>
      </div>

      {/* --- SETTINGS VIEW --- */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'settings' ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none'}`}>
        <div className="w-full max-w-md p-8 border border-neutral-800 rounded-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
            <h3 className="text-xl font-bold tracking-widest">PREFERENCES</h3>
            <button onClick={() => setActiveView('main')} className="text-neutral-500 hover:text-white"><X size={20} /></button>
          </div>
          
          <div className="space-y-8">
            {/* Toggle for Search Bar Position */}
            <div className="flex justify-between items-center">
              <div className="font-mono text-sm tracking-widest text-neutral-400">SEARCH ALIGNMENT</div>
              <button 
                onClick={() => setSearchPosition(prev => prev === 'bottom' ? 'raised' : 'bottom')}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-neutral-700 hover:bg-white hover:text-black transition-colors"
              >
                {searchPosition === 'bottom' ? 'ZERO OFFSET' : 'RAISED (TASKBAR)'}
              </button>
            </div>

            {/* Visual display of active shortcuts */}
            <div className="pt-8 border-t border-neutral-800">
               <div className="font-mono text-sm tracking-widest text-neutral-400 mb-4">ACTIVE BINDS</div>
               <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-500">
                 <div>CTRL + K : SEARCH</div>
                 <div>CTRL + , : CONFIG</div>
                 <div>CTRL + H : HIST</div>
                 <div>CTRL + B : BKMK</div>
                 <div>ESC : CLOSE</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- GLOBAL SEARCH BAR --- */}
      {/* Positioned at the bottom based on user preference setting */}
      <div className={`absolute left-0 w-full flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 px-4 md:px-0
        ${searchPosition === 'bottom' ? 'bottom-0 pb-0' : 'bottom-12 pb-4'} 
        ${activeView === 'settings' ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}
      `}>
        <div className="w-full max-w-2xl relative group">
          {/* Animated focus indicator background */}
          <div className="absolute inset-0 bg-neutral-900/50 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative flex items-center bg-black border-b-2 border-neutral-800 group-focus-within:border-white transition-colors duration-500 px-4 py-4 md:py-6">
            <Search className="text-neutral-600 group-focus-within:text-white transition-colors duration-300 mr-4" size={24} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ENTER QUERY OR URL..."
              className="w-full bg-transparent outline-none text-xl md:text-2xl tracking-widest font-bold placeholder:text-neutral-700 text-white"
              spellCheck="false"
              autoComplete="off"
            />
            {/* Shortcut hint next to search bar */}
            <div className="hidden md:flex items-center gap-1 font-mono text-[10px] text-neutral-600 border border-neutral-800 px-2 py-1 rounded ml-4">
              <span>CTRL</span><span>+</span><span>K</span>
            </div>
          </div>
        </div>
      </div>

    </div>      
  );
}
