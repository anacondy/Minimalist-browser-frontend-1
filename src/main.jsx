/**
 * Entry point — mounts the React application.
 * ------------------------------------------------------------------
 * Imports the global stylesheet (Tailwind v4) and renders <App /> into
 * #root. StrictMode is enabled in dev to surface side-effect bugs; it
 * is stripped automatically in production builds.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

// Defensive guard so a misconfigured host still shows a helpful message
// instead of a silent white page.
if (!rootElement) {
  throw new Error('FATAL: #root element was not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
