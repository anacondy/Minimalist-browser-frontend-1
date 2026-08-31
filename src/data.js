/**
 * Mock persistence layer.
 * ------------------------------------------------------------------
 * Two datasets simulate "guest" vs "synced" browser profiles:
 *  - GUEST: small, prefix-only data (no account connected).
 *  - SYNCED: rich, realistic data (account connected).
 *
 * Consumers: <TabsView />, <HistoryView />, <BookmarksView />.
 * The objects are frozen at module load so accidental mutation in a
 * component cannot corrupt state or cause re-render surprises.
 */

export const GUEST_DATA = Object.freeze({
  tabs: Object.freeze([
    { id: 1, label: '01/MAIN', title: 'YOUTUBE MUSIC - CURRENT PLAYLIST', offset: 0, url: 'https://music.youtube.com/' },
    { id: 2, label: '02/DOCS', title: 'PHYSICS SEMESTER NOTES', offset: 3, url: 'https://www.google.com/search?q=physics+semester+notes' },
  ]),
  history: Object.freeze([
    { id: 1, role: 'downloading', name: 'physics_video_lecture.mov', isActive: true },
    { id: 2, role: 'visited', name: 'localhost:3000', isActive: false },
    { id: 3, role: 'searched', name: 'minimalist brutalist web design', isActive: false },
  ]),
  bookmarks: Object.freeze([
    { id: 1, title: 'BPM MUSIC CATALOGUE', url: 'bpmmusic.io' },
    { id: 2, title: 'REACT JS DOCS', url: 'react.dev' },
  ]),
});

export const SYNCED_DATA = Object.freeze({
  tabs: Object.freeze([
    { id: 1, label: '01/MAIN', title: 'YOUTUBE MUSIC - CURRENT PLAYLIST', offset: 0, url: 'https://music.youtube.com/' },
    { id: 2, label: '02/DOCS', title: 'PHYSICS SEMESTER NOTES', offset: 3, url: 'https://www.google.com/search?q=physics+semester+notes' },
    { id: 3, label: '03/CODE', title: 'REACT JS DOCUMENTATION', offset: 6, url: 'https://react.dev/' },
    { id: 4, label: '04/DATA', title: 'STATISTICS RESEARCH PAPER', offset: 4, url: 'https://www.google.com/search?q=statistics+research+paper' },
    { id: 5, label: '05/SYS', title: 'SS JAIN SUBODH PORTAL', offset: 1, url: 'https://subodh.edu/' },
    { id: 6, label: '06/SRCH', title: 'GITHUB REPOSITORIES', offset: 5, url: 'https://github.com/' },
    { id: 7, label: '07/NET', title: 'STACK OVERFLOW THREADS', offset: 8, url: 'https://stackoverflow.com/' },
    { id: 8, label: '08/DES', title: 'FIGMA - MINIMAL BROWSER UI', offset: 2, url: 'https://www.figma.com/' },
  ]),
  history: Object.freeze([
    { id: 1, role: 'downloading', name: 'physics_video_lecture.mov', isActive: true },
    { id: 2, role: 'visited', name: 'localhost:3000', isActive: false },
    { id: 3, role: 'searched', name: 'how to build custom browser engine', isActive: false },
    { id: 4, role: 'played', name: 'youtube music - lofi hip hop', isActive: false },
    { id: 5, role: 'read', name: 'advanced physics kinematics', isActive: false },
    { id: 6, role: 'downloaded', name: 'statistics_dataset_2025.csv', isActive: false },
    { id: 7, role: 'visited', name: 'github.com/trending', isActive: false },
    { id: 8, role: 'searched', name: 'minimalist brutalist web design', isActive: false },
    { id: 9, role: 'visited', name: 'ssjain subodh college student portal', isActive: false },
    { id: 10, role: 'read', name: 'understanding p-values in statistics', isActive: false },
    { id: 11, role: 'played', name: 'youtube music - synthwave mix', isActive: false },
    { id: 12, role: 'searched', name: 'react lucide icons implementation', isActive: false },
    { id: 13, role: 'visited', name: 'tailwindcss.com/docs', isActive: false },
  ]),
  bookmarks: Object.freeze([
    { id: 1, title: 'SS JAIN SUBODH PORTAL', url: 'https://subodh.edu' },
    { id: 2, title: 'YOUTUBE MUSIC', url: 'https://music.youtube.com' },
    { id: 3, title: 'PHYSICS FORUMS', url: 'https://physicsforums.com' },
    { id: 4, title: 'STATISTICS DATASETS', url: 'https://kaggle.com' },
    { id: 5, title: 'GITHUB - BROWSER EXTENSION GUIDE', url: 'https://github.com' },
    { id: 6, title: 'REACT DOCUMENTATION', url: 'https://react.dev' },
    { id: 7, title: 'TAILWIND COMPONENTS', url: 'https://tailwindui.com' },
    { id: 8, title: 'BPM MUSIC CATALOGUE', url: 'https://bpmmusic.io' },
  ]),
});
