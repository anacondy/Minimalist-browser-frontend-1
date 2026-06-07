import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, History, Bookmark, Layers, X, Globe, User, LogOut } from 'lucide-react';

// Main App Component
export default function App() {
  // State to manage the current active view (main, tabs, history, bookmarks, settings)
  const [activeView, setActiveView] = useState('main');
  
  // State to manage the search bar position ('bottom' or 'raised')
  const [searchPosition, setSearchPosition] = useState('raised');
  
  // State to store the user's search query in real-time
  const [searchQuery, setSearchQuery] = useState('');
  
  // State to simulate being connected to a Google/Chrome account
  const [isAccountSynced, setIsAccountSynced] = useState(false);
  
  // State for real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Reference to the search input element for programmatic focus (Ctrl+K)
  const searchInputRef = useRef(null);

  // --- MOCK DATA FOR GUEST (DISCONNECTED) STATE ---
  const defaultTabs = [
    { id: 1, label: '01/MAIN', title: 'YOUTUBE MUSIC - CURRENT PLAYLIST', offset: 'ml-0' },
    { id: 2, label: '02/DOCS', title: 'PHYSICS SEMESTER NOTES', offset: 'ml-12' },
  ];

  const defaultHistory = [
    { role: 'downloading', name: 'physics_video_lecture.mov', isActive: true },
    { role: 'visited', name: 'localhost:3000' },
    { role: 'searched', name: 'minimalist brutalist web design' },
  ];

  const defaultBookmarks = [
    { id: 1, title: 'BPM MUSIC CATALOGUE', url: 'bpmmusic.io' },
    { id: 2, title: 'REACT JS DOCS', url: 'react.dev' },
  ];

  // --- MOCK DATA FOR SYNCED (CONNECTED) STATE ---
  // Larger datasets to demonstrate smooth, glitch-free scrolling
  const syncedTabs = [
    { id: 1, label: '01/MAIN', title: 'YOUTUBE MUSIC - CURRENT PLAYLIST', offset: 'ml-0' },
    { id: 2, label: '02/DOCS', title: 'PHYSICS SEMESTER NOTES', offset: 'ml-12' },
    { id: 3, label: '03/CODE', title: 'REACT JS DOCUMENTATION', offset: 'ml-24' },
    { id: 4, label: '04/DATA', title: 'STATISTICS RESEARCH PAPER', offset: 'ml-16' },
    { id: 5, label: '05/SYS',  title: 'SS JAIN SUBODH PORTAL', offset: 'ml-4' },
    { id: 6, label: '06/SRCH', title: 'GITHUB REPOSITORIES', offset: 'ml-20' },
    { id: 7, label: '07/NET',  title: 'STACK OVERFLOW THREADS', offset: 'ml-32' },
    { id: 8, label: '08/DES',  title: 'FIGMA - MINIMAL BROWSER UI', offset: 'ml-8' },
  ];

  const syncedHistory = [
    { role: 'downloading', name: 'physics_video_lecture.mov', isActive: true },
    { role: 'visited', name: 'localhost:3000' },
    { role: 'searched', name: 'how to build custom browser engine' },
    { role: 'played', name: 'youtube music - lofi hip hop' },
    { role: 'read', name: 'advanced physics kinematics' },
    { role: 'downloaded', name: 'statistics_dataset_2025.csv' },
    { role: 'visited', name: 'github.com/trending' },
    { role: 'searched', name: 'minimalist brutalist web design' },
    { role: 'visited', name: 'ssjain subodh college student portal' },
    { role: 'read', name: 'understanding p-values in statistics' },
    { role: 'played', name: 'youtube music - synthwave mix' },
    { role: 'searched', name: 'react lucide icons implementation' },
    { role: 'visited', name: 'tailwindcss.com/docs' },
  ];

  const syncedBookmarks = [
    { id: 1, title: 'SS JAIN SUBODH PORTAL', url: 'subodh.edu' },
    { id: 2, title: 'YOUTUBE MUSIC', url: 'music.youtube.com' },
    { id: 3, title: 'PHYSICS FORUMS', url: 'physicsforums.com' },
    { id: 4, title: 'STATISTICS DATASETS', url: 'kaggle.com' },
    { id: 5, title: 'GITHUB - BROWSER EXTENSION GUIDE', url: 'github.com' },
    { id: 6, title: 'REACT DOCUMENTATION', url: 'react.dev' },
    { id: 7, title: 'TAILWIND COMPONENTS', url: 'tailwindui.com' },
    { id: 8, title: 'BPM MUSIC CATALOGUE', url: 'bpmmusic.io' },
  ];

  // Determine which data to use based on connection state
  const currentTabs = isAccountSynced ? syncedTabs : defaultTabs;
  const currentHistory = isAccountSynced ? syncedHistory : defaultHistory;
  const currentBookmarks = isAccountSynced ? syncedBookmarks : defaultBookmarks;

  // --- REAL-TIME SEARCH FILTERING ---
  // These variables automatically update whenever searchQuery or activeView changes
  const filteredTabs = currentTabs.filter(tab => tab.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredHistory = currentHistory.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.role.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredBookmarks = currentBookmarks.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()));

  // Effect to update the real-time clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Effect hook to handle all global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus Search (Ctrl + K)
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // We do NOT change the activeView here anymore, so the user can filter the current view
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      // Open Settings (Ctrl + ,)
      else if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setActiveView('settings');
        setSearchQuery(''); // Clear search when changing views
      }
      // Open History (Ctrl + H)
      else if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setActiveView('history');
        setSearchQuery('');
      }
      // Open Bookmarks (Ctrl + B)
      else if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setActiveView('bookmarks');
        setSearchQuery('');
      }
      // Escape to return to main view
      else if (e.key === 'Escape') {
        setActiveView('main');
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Effect to autofocus search bar on initial load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Function to handle pressing Enter in the search bar
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      // Contextual routing: If in main view, do a real web search
      if (activeView === 'main') {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank');
        setSearchQuery('');
      } 
      // If in history/bookmarks, maybe pressing enter opens the first filtered result
      // For now, we will just let it filter visually on screen.
    }
  };

  // Reusable Navigation component
  const TopNav = () => (
    <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-start z-50 mix-blend-difference text-neutral-400 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em]">
      <div className="flex flex-col gap-1">
        {/* Tapping this text acts as a Home button to return to the SYS page */}
        <button 
          onClick={() => { setActiveView('main'); setSearchQuery(''); }} 
          className="text-left hover:text-white transition-colors font-bold tracking-[0.3em]"
        >
          BPM® BROWSER V1.0
        </button>
        <div className="flex gap-2">
          <span>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span className="text-neutral-500">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <div className="flex gap-3 md:gap-6">
        <button onClick={() => {setActiveView('tabs'); setSearchQuery('');}} className={`hover:text-white transition-colors duration-300 flex items-center gap-2 ${activeView === 'tabs' ? 'text-white' : ''}`}>
          <Layers size={14} /> <span className="hidden md:inline">Tabs</span>
        </button>
        <button onClick={() => {setActiveView('history'); setSearchQuery('');}} className={`hover:text-white transition-colors duration-300 flex items-center gap-2 ${activeView === 'history' ? 'text-white' : ''}`}>
          <History size={14} /> <span className="hidden md:inline">Hist</span>
        </button>
        <button onClick={() => {setActiveView('bookmarks'); setSearchQuery('');}} className={`hover:text-white transition-colors duration-300 flex items-center gap-2 ${activeView === 'bookmarks' ? 'text-white' : ''}`}>
          <Bookmark size={14} /> <span className="hidden md:inline">Bkmk</span>
        </button>
        <button onClick={() => {setActiveView('settings'); setSearchQuery('');}} className={`hover:text-white transition-colors duration-300 flex items-center gap-2 ${activeView === 'settings' ? 'text-white' : ''}`}>
          <Settings size={14} /> <span className="hidden md:inline">Cfg</span>
        </button>
      </div>
    </div>
  );

  return (
    // Main Container: Strict black background
    <div className="min-h-screen bg-black text-neutral-200 font-sans overflow-hidden relative selection:bg-white selection:text-black">
      
      {/* CSS to hide ugly white default scrollbars entirely across the app */}
      <style>
        {`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}
      </style>

      <TopNav />

      {/* --- MAIN SEARCH VIEW --- */}
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
      {/* Scrollable container with 'no-scrollbar' */}
      <div className={`no-scrollbar absolute inset-0 overflow-y-auto overflow-x-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pt-32 pb-48 px-8 md:px-24 ${activeView === 'tabs' ? 'opacity-100 translate-x-0 z-20' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
        <h2 className="text-4xl font-bold tracking-tighter text-white mb-16 border-b border-neutral-800 pb-4">
          {searchQuery ? 'FILTERING SESSIONS' : 'OPEN SESSIONS'} : <span className="text-neutral-600">LOST</span>
        </h2>
        <div className="space-y-8 flex flex-col items-start min-h-max pb-32">
          {filteredTabs.length === 0 ? (
             <p className="font-mono text-neutral-500 tracking-widest">NO SESSIONS MATCHING QUERY.</p>
          ) : (
            filteredTabs.map((tab) => (
              <div key={tab.id} className={`group flex items-end gap-6 cursor-pointer hover:text-white transition-all duration-300 ${tab.offset}`}>
                <span className="font-mono text-xs tracking-widest text-neutral-500 mb-1">{tab.label}</span>
                <span className="text-2xl md:text-4xl font-bold tracking-tight text-neutral-300 group-hover:text-white group-hover:tracking-widest transition-all duration-500">
                  {tab.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- HISTORY VIEW --- */}
      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pt-24 pb-32 ${activeView === 'history' ? 'opacity-100 scale-100 z-20' : 'opacity-0 scale-105 pointer-events-none'}`}>
        {/* The scrollable area is bounded so it doesn't glitch the main page */}
        <div className="no-scrollbar text-center space-y-4 max-h-[60vh] overflow-y-auto w-full px-4 pb-12">
          {filteredHistory.length === 0 ? (
             <p className="font-mono text-neutral-500 tracking-widest mt-20">NO HISTORY FOUND.</p>
          ) : (
            filteredHistory.map((item, i) => (
              <div key={i} className={`text-lg md:text-2xl tracking-wide hover:scale-105 transition-all cursor-pointer py-1 ${item.isActive ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}>
                <span className={`${item.isActive ? 'text-green-600' : 'text-neutral-600'} font-medium mr-3`}>{item.role}</span>
                <span className="font-bold">{item.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- BOOKMARKS VIEW --- */}
      <div className={`absolute inset-0 flex flex-col items-center pt-32 pb-32 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'bookmarks' ? 'opacity-100 translate-y-0 z-20' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
        <div className="no-scrollbar w-full max-w-4xl px-8 overflow-y-auto max-h-[70vh] pb-24">
          {filteredBookmarks.length === 0 ? (
             <p className="text-center font-mono text-neutral-500 tracking-widest mt-20">NO BOOKMARKS FOUND.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredBookmarks.map(item => (
                <div key={item.id} className="group cursor-pointer flex items-center gap-6 p-4 border border-transparent hover:border-neutral-800 transition-all rounded-xl">
                  <div className="w-16 h-16 shrink-0 border border-neutral-800 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-500">
                      <Globe size={20} strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col text-left">
                    <p className="font-bold text-lg md:text-xl tracking-tight text-neutral-300 group-hover:text-white transition-colors">{item.title}</p>
                    <p className="font-mono text-xs tracking-widest text-neutral-600 mt-1">{item.url}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- SETTINGS VIEW --- */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${activeView === 'settings' ? 'opacity-100 z-40' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setActiveView('main')} // Click outside modal to close it
      >
        <div 
          className="w-full max-w-md p-6 md:p-8 border border-neutral-800 rounded-2xl bg-black/50"
          onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
        >
          <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
            <h3 className="text-xl font-bold tracking-widest text-white">PREFERENCES</h3>
            <button 
              onClick={(e) => { e.stopPropagation(); setActiveView('main'); }} 
              className="text-neutral-500 hover:text-white transition-colors p-2 -mr-2"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-8">
            {/* Account Synchronization Mock Toggle */}
            <div className="flex flex-col gap-4">
               <div className="font-mono text-sm tracking-widest text-neutral-400">DATA SYNC</div>
               {isAccountSynced ? (
                 <button 
                    onClick={() => setIsAccountSynced(false)}
                    className="flex items-center justify-between w-full p-4 border border-green-900/50 bg-green-950/20 hover:bg-black transition-colors rounded"
                 >
                    <div className="flex items-center gap-3 text-green-500">
                      <User size={18} />
                      <span className="text-sm font-bold tracking-wider">SYNCED VIA GOOGLE</span>
                    </div>
                    <LogOut size={16} className="text-neutral-500" />
                 </button>
               ) : (
                 <button 
                    onClick={() => setIsAccountSynced(true)}
                    className="flex items-center justify-center gap-3 w-full p-4 border border-neutral-800 hover:border-white hover:bg-white hover:text-black transition-all rounded text-neutral-300"
                 >
                    <User size={18} />
                    <span className="text-sm font-bold tracking-wider">CONNECT ACCOUNT</span>
                 </button>
               )}
               <p className="font-mono text-[10px] text-neutral-600 tracking-widest">
                 {isAccountSynced ? "REAL BOOKMARKS & HISTORY LOADED." : "SHOWING PREFIXED GUEST DATA."}
               </p>
            </div>

            {/* Toggle for Search Bar Position */}
            <div className="flex justify-between items-center pt-6 border-t border-neutral-800">
              <div className="font-mono text-sm tracking-widest text-neutral-400">SEARCH ALIGNMENT</div>
              <button 
                onClick={() => setSearchPosition(prev => prev === 'bottom' ? 'raised' : 'bottom')}
                className="text-xs font-bold uppercase tracking-widest px-4 py-2 border border-neutral-700 hover:bg-white hover:text-black transition-colors rounded"
              >
                {searchPosition === 'bottom' ? 'ZERO OFFSET' : 'RAISED (TASKBAR)'}
              </button>
            </div>

            {/* Visual display of active shortcuts */}
            <div className="pt-6 border-t border-neutral-800">
               <div className="font-mono text-sm tracking-widest text-neutral-400 mb-4">ACTIVE BINDS</div>
               <div className="grid grid-cols-2 gap-4 text-xs font-mono text-neutral-500">
                 <div>CTRL + K : FOCUS</div>
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
      <div className={`absolute left-0 w-full flex justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 px-4 md:px-0
        ${searchPosition === 'bottom' ? 'bottom-0 pb-0' : 'bottom-12 pb-4'} 
        ${activeView === 'settings' ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}
      `}>
        <div className="w-full max-w-2xl relative group bg-black">
          {/* Animated focus indicator background */}
          <div className="absolute inset-0 bg-neutral-900/50 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="relative flex items-center bg-black border-b-2 border-neutral-800 group-focus-within:border-white transition-colors duration-500 px-4 py-4 md:py-6">
            <Search className="text-neutral-600 group-focus-within:text-white transition-colors duration-300 mr-4" size={24} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit} 
              // Placeholder changes text depending on what view you are in!
              placeholder={
                activeView === 'history' ? "FILTER HISTORY..." : 
                activeView === 'bookmarks' ? "SEARCH BOOKMARKS..." : 
                activeView === 'tabs' ? "FIND SESSION..." : 
                "ENTER QUERY OR URL..."
              }
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
