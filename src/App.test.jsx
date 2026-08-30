/**
 * App smoke/interaction suite (Vitest + jsdom + Testing Library).
 * ------------------------------------------------------------------
 * Verifies, in a real DOM:
 *   1. Initial render (hero + nav) with zero console errors.
 *   2. All nav buttons switch views; Escape returns home.
 *   3. Settings: X / backdrop close, sync toggle swaps dataset size,
 *      dock-alignment toggle persists to localStorage.
 *   4. Search: main-view Enter opens Google; tab/history/bookmark
 *      filtering works; Enter in a filter view opens the first hit.
 *   5. Global shortcuts: Ctrl/Cmd+K (focus), Ctrl+H / Ctrl+,, / Ctrl+B.
 *
 * Responsive layout is additionally checked in the static CSS review
 * (fluid clamp() type, 100dvh, safe-areas) — jsdom has no layout
 * engine, so pixel overflow checks belong to a browser harness.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

/* jsdom lacks parts of the browser API the app touches lightly. */
const polyfill = () => {
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }
};

/** Render the app with a fresh user + stubbed window.open. */
const setup = () => {
  polyfill();
  const openSpy = vi
    .spyOn(window, 'open')
    .mockImplementation(() => null);
  const user = userEvent.setup();
  return { user, openSpy };
};

/** View visibility helper — inactive panels are aria-hidden. */
const expectView = (view, visible) => {
  const panel = screen.getByTestId(`view-${view}`);
  expect(panel.getAttribute('aria-hidden')).toBe(String(!visible));
};

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  cleanup();
});

describe('SYS® Minimalist Browser — interactions', () => {
  it('renders the hero and nav without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /SYS®/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Open sessions' })).toBeDefined();
    expectView('main', true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('navigates between all views via the nav buttons', async () => {
    const { user } = setup();
    render(<App />);

    // Tabs
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    expectView('tabs', true);
    expect(screen.getByText(/OPEN SESSIONS/)).toBeDefined();

    // History
    await user.click(screen.getByRole('button', { name: 'History' }));
    expectView('history', true);
    expectView('tabs', false);

    // Bookmarks
    await user.click(screen.getByRole('button', { name: 'Bookmarks' }));
    expectView('bookmarks', true);

    // Settings
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expectView('settings', true);
    expect(screen.getByRole('dialog', { name: 'Preferences' })).toBeDefined();

    // Escape returns home
    await user.keyboard('{Escape}');
    expectView('main', true);
    expectView('settings', false);
  });

  it('closes settings from the X button and the backdrop', async () => {
    const { user } = setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Close settings' }));
    expectView('settings', false);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    // Click the backdrop itself (dialog's parent section).
    const backdrop = screen.getByRole('dialog').parentElement;
    await user.click(backdrop);
    expectView('settings', false);
  });

  it('sync toggle switches between guest and synced datasets', async () => {
    const { user } = setup();
    render(<App />);

    // Guest profile → 2 sessions when synced off.
    // (Session rows expose aria-labels like "Open YOUTUBE MUSIC…";
    //  the nav button is "Open sessions" — lowercase, so excluded.)
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    let rows = screen.queryAllByRole('button', { name: /^Open [A-Z0-9]/ });
    expect(rows.length).toBe(2);

    // Enable sync from Settings.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: /CONNECT ACCOUNT/ }));
    expect(screen.getByText(/SYNCED VIA GOOGLE/)).toBeDefined();

    // Revisit tabs → 8 sessions.
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    rows = screen.queryAllByRole('button', { name: /^Open [A-Z0-9]/ });
    expect(rows.length).toBe(8);
  });

  it('persists the dock alignment toggle to localStorage', async () => {
    const { user } = setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const toggle = screen.getByRole('button', { name: /RAISED \(TASKBAR\)/ });
    await user.click(toggle);

    expect(screen.getByRole('button', { name: /ZERO OFFSET/ })).toBeDefined();
    expect(window.localStorage.getItem('sys.search-position')).toBe('"bottom"');
  });

  it('filters sessions, history and bookmarks by query', async () => {
    const { user } = setup();
    render(<App />);

    // Use the synced profile so filters have rich data to cut through.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: /CONNECT ACCOUNT/ }));
    await user.keyboard('{Escape}');

    // Tabs filter
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    await user.type(screen.getByRole('textbox', { name: /search/i }), 'react');
    expect(screen.queryByText('REACT JS DOCUMENTATION')).not.toBeNull();
    expect(screen.queryByText('YOUTUBE MUSIC - CURRENT PLAYLIST')).toBeNull();
    expect(screen.queryByText(/NO SESSIONS MATCHING/)).toBeNull();

    // History filter (switch = clears query, then type)
    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.type(screen.getByRole('textbox', { name: /search/i }), 'github');
    expect(screen.queryByText('github.com/trending')).not.toBeNull();
    expect(screen.queryByText('localhost:3000')).toBeNull();

    // Bookmarks filter
    await user.click(screen.getByRole('button', { name: 'Bookmarks' }));
    await user.type(screen.getByRole('textbox', { name: /search/i }), 'physics');
    expect(screen.queryByText('PHYSICS FORUMS')).not.toBeNull();
    expect(screen.queryByText('BPM MUSIC CATALOGUE')).toBeNull();
  });

  it('submits the main-view search to Google and clears the input', async () => {
    const { user, openSpy } = setup();
    render(<App />);

    const input = screen.getByRole('textbox', { name: /search/i });
    await user.type(input, 'how to build a browser');
    await user.keyboard('{Enter}');

    expect(openSpy).toHaveBeenCalledWith(
      'https://www.google.com/search?q=how%20to%20build%20a%20browser',
      '_blank',
      'noopener,noreferrer',
    );
    expect(input.value).toBe('');
  });

  it('Enter in a filter view opens the first matching result', async () => {
    const { user, openSpy } = setup();
    render(<App />);

    // History → filter to a URL-like entry → Enter opens it directly.
    await user.click(screen.getByRole('button', { name: 'History' }));
    const input = screen.getByRole('textbox', { name: /search/i });
    await user.type(input, 'localhost');
    await user.keyboard('{Enter}');

    expect(openSpy).toHaveBeenCalledWith(
      'https://localhost:3000',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('responds to global keyboard shortcuts (Ctrl/Cmd)', async () => {
    const { user } = setup();
    render(<App />);

    // Ctrl+H → history
    await user.keyboard('{Control>}h{/Control}');
    expectView('history', true);

    // Ctrl+, → settings
    await user.keyboard('{Control>},{/Control}');
    expectView('settings', true);

    // Ctrl+B → bookmarks (Settings closes via command switch)
    await user.keyboard('{Control>}b{/Control}');
    expectView('bookmarks', true);

    // Ctrl+K → focus the search dock (visible even in filter views)
    await user.keyboard('{Control>}k{/Control}');
    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: /search/i }),
    );

    // Cmd+K works too (macOS parity)
    await user.keyboard('{Meta>}k{/Meta}');
    expect(document.activeElement).toBe(
      screen.getByRole('textbox', { name: /search/i }),
    );
  });

  it('does not hijack Enter/Escape while typing in the search field', async () => {
    const { user } = setup();
    render(<App />);

    // Enter in the field submits (already covered) and Escape after
    // navigating to history keeps us there (no forced home).
    await user.click(screen.getByRole('button', { name: 'History' }));
    const input = screen.getByRole('textbox', { name: /search/i });
    await user.click(input);
    await user.keyboard('{Escape}');
    expectView('history', true);
  });
});
