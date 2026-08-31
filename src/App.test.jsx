/**
 * App smoke/interaction suite (Vitest + jsdom + Testing Library).
 * ------------------------------------------------------------------
 * Behaviour under test (mirrors the user-facing spec):
 *   1. Initial render (hero + nav incl. HOME chip) with zero errors.
 *   2. Nav buttons switch views; HOME chip works from any view.
 *   3. Blank-area click → home on Tabs / History / Bookmarks / Settings.
 *   4. Settings: X, backdrop, sync toggle (dataset swap), dock toggle.
 *   5. Search submit (main = Google; filter views = first match).
 *   6. Autofocus on load + type-anywhere routing into the search bar.
 *   7. Universal keys: Ctrl+L/K, Ctrl+R / Ctrl+Shift+R, Ctrl+Tab,
 *      Alt+←/→, Ctrl+H / Ctrl+B / Ctrl+,, Esc (clear → close).
 *
 * Responsive layout is covered by static CSS review (clamp type,
 * 100dvh, safe-areas) — jsdom has no layout engine.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { setReloadImpl } from './utils.js';

/* jsdom lacks parts of the browser API the app touches lightly. */
const polyfill = () => {
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  }
  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }
};

/** Render the app with a fresh user + stubbed window.open / reload. */
const setup = () => {
  polyfill();
  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  // Inject reload location (jsdom's location.reload is non-configurable,
  // so we observe it through utils' injection point instead).
  const reloadSpy = vi.fn();
  setReloadImpl(reloadSpy);
  const user = userEvent.setup();
  return { user, openSpy, reloadSpy };
};

/** View visibility helper — inactive panels are aria-hidden. */
const expectView = (view, visible) => {
  const panel = screen.getByTestId(`view-${view}`);
  expect(panel.getAttribute('aria-hidden')).toBe(String(!visible));
};

/** The search/omnibox input (role=searchbox). */
const searchInput = () => screen.getByRole('textbox', { name: /search or enter url/i });

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  setReloadImpl(() => {}); // reset to no-op between tests
});

afterEach(() => {
  cleanup();
});

describe('SYS® Minimalist Browser — interactions', () => {
  it('renders the hero, HOME chip and nav without console errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: /SYS®/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Open sessions' })).toBeDefined();
    expectView('main', true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('autofocuses the search bar on load', async () => {
    const { user } = setup();
    render(<App />);
    // user-event's setup() simulates an initial "user" context, so give
    // the focus effect a microtask to settle before asserting.
    await waitFor(() => expect(document.activeElement).toBe(searchInput()));
    expect(user).toBeDefined();
  });

  it('navigates between all views via nav buttons', async () => {
    const { user } = setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    expectView('tabs', true);

    await user.click(screen.getByRole('button', { name: 'History' }));
    expectView('history', true);
    expectView('tabs', false);

    await user.click(screen.getByRole('button', { name: 'Bookmarks' }));
    expectView('bookmarks', true);

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expectView('settings', true);
    expect(screen.getByRole('dialog', { name: 'Preferences' })).toBeDefined();

    // Esc returns home
    await user.keyboard('{Escape}');
    expectView('main', true);
    expectView('settings', false);
  });

  it('HOME (left of TABS in the nav) returns home from every view', async () => {
    const { user } = setup();
    render(<App />);

    // HOME renders to the left of TABS in the nav cluster.
    const homeBtn = screen.getByRole('button', { name: 'Home' });
    const tabsBtn = screen.getByRole('button', { name: 'Open sessions' });
    expect(homeBtn.compareDocumentPosition(tabsBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const views = [
      ['Open sessions', 'tabs'],
      ['History', 'history'],
      ['Bookmarks', 'bookmarks'],
      ['Settings', 'settings'],
    ];
    for (const [name, view] of views) {
      await user.click(screen.getByRole('button', { name }));
      expectView(view, true);
      await user.click(homeBtn);
      expectView('main', true);
    }
  });

  it('blank-area click on any panel returns home (items still work)', async () => {
    const { user } = setup();
    render(<App />);

    // Tabs — click the panel surface (not a session row).
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    await user.click(screen.getByTestId('surface-tabs'));
    expectView('main', true);

    // History — click the panel surface.
    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.click(screen.getByTestId('surface-history'));
    expectView('main', true);

    // Bookmarks — click the panel surface.
    await user.click(screen.getByRole('button', { name: 'Bookmarks' }));
    await user.click(screen.getByTestId('surface-bookmarks'));
    expectView('main', true);

    // Settings — backdrop click (dialog's parent).
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    const backdrop = screen.getByRole('dialog').parentElement;
    await user.click(backdrop);
    expectView('main', true);
  });

  it('closes settings from the X and toggles the sync dataset', async () => {
    const { user } = setup();
    render(<App />);

    // X close
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: 'Close settings' }));
    expectView('settings', false);

    // Sync toggle: guest (2 tabs) → synced (8 tabs).
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: /CONNECT ACCOUNT/ }));
    expect(screen.getByText(/SYNCED VIA GOOGLE/)).toBeDefined();

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    const rows = screen.queryAllByRole('button', { name: /^Open [A-Z0-9]/ });
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

    // Synced profile gives the filters real data to cut through.
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await user.click(screen.getByRole('button', { name: /CONNECT ACCOUNT/ }));
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    await user.type(searchInput(), 'react');
    expect(screen.queryByText('REACT JS DOCUMENTATION')).not.toBeNull();
    expect(screen.queryByText('YOUTUBE MUSIC - CURRENT PLAYLIST')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.type(searchInput(), 'github');
    expect(screen.queryByText('github.com/trending')).not.toBeNull();
    expect(screen.queryByText('localhost:3000')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Bookmarks' }));
    await user.type(searchInput(), 'physics');
    expect(screen.queryByText('PHYSICS FORUMS')).not.toBeNull();
    expect(screen.queryByText('BPM MUSIC CATALOGUE')).toBeNull();
  });

  it('types anywhere — printable keys land in the search bar', async () => {
    const { user } = setup();
    render(<App />);

    // Blur the input deliberately, then type — chars must be captured.
    searchInput().blur();
    expect(document.activeElement).not.toBe(searchInput());
    await user.keyboard('hello world');

    await waitFor(() => {
      expect(searchInput().value).toBe('hello world');
      expect(document.activeElement).toBe(searchInput());
    });

    // Filtering reacts to the captured query (tabs view owns it).
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    expect(searchInput().value).toBe(''); // view switch clears query
  });

  it('submits the main-view search to Google and clears the input', async () => {
    const { user, openSpy } = setup();
    render(<App />);

    const input = searchInput();
    await user.type(input, 'how to build a browser');
    await user.keyboard('{Enter}');

    expect(openSpy).toHaveBeenCalledWith(
      'https://lite.duckduckgo.com/lite/?q=how%20to%20build%20a%20browser',
      '_blank',
      'noopener,noreferrer',
    );
    expect(input.value).toBe('');
  });

  it('Enter in a filter view opens the first matching result', async () => {
    const { user, openSpy } = setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.type(searchInput(), 'localhost');
    await user.keyboard('{Enter}');

    expect(openSpy).toHaveBeenCalledWith(
      'https://localhost:3000',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('universal keys: Ctrl+L focus and Ctrl+K focus', async () => {
    const { user } = setup();
    render(<App />);

    // Ctrl+L focuses the dock even when another view is open
    // (focus is applied on the next frame — await it).
    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.keyboard('{Control>}l{/Control}');
    await waitFor(() => expect(document.activeElement).toBe(searchInput()));

    // Ctrl+K focuses the dock (any view).
    await user.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(document.activeElement).toBe(searchInput()));
  });

  it('Ctrl+Tab switches OPEN TABS — never the panels', async () => {
    const { user } = setup();
    render(<App />);

    const tab1 = screen.getByRole('tab', { name: /Switch to YOUTUBE MUSIC/ });
    const tab2 = screen.getByRole('tab', { name: /Switch to PHYSICS SEMESTER/ });
    expect(tab1.getAttribute('aria-selected')).toBe('true');
    expect(tab2.getAttribute('aria-selected')).toBe('false');

    // Ctrl+Tab → next open tab; the active VIEW must not change (main).
    await user.keyboard('{Control>}{Tab}');
    expect(tab2.getAttribute('aria-selected')).toBe('true');
    expect(tab1.getAttribute('aria-selected')).toBe('false');
    expectView('main', true); // panels untouched

    // Ctrl+Shift+Tab → previous tab.
    await user.keyboard('{Control>}{Shift>}{Tab}{/Shift}{/Control}');
    expect(tab1.getAttribute('aria-selected')).toBe('true');

    // Wraps: Ctrl+Shift+Tab from the first tab lands on the last one.
    await user.keyboard('{Control>}{Shift>}{Tab}{/Shift}{/Control}');
    expect(tab2.getAttribute('aria-selected')).toBe('true');

    // And Ctrl+Tab from the last tab wraps to the first.
    await user.keyboard('{Control>}{Tab}');
    expect(tab1.getAttribute('aria-selected')).toBe('true');
  });

  it('clicking a tab in the strip activates it', async () => {
    const { user } = setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /Switch to PHYSICS SEMESTER/ }));
    expect(
      screen.getByRole('tab', { name: /Switch to PHYSICS SEMESTER/ }).getAttribute('aria-selected'),
    ).toBe('true');
    // Panel still on home — the tab bar is chrome, not a panel switch.
    expectView('main', true);
  });

  it('universal keys: Alt+←/→ back/forward navigation', async () => {
    const { user } = setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.click(screen.getByRole('button', { name: 'Bookmarks' }));
    expectView('bookmarks', true);

    // Back: bookmarks → history → main.
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expectView('history', true);
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expectView('main', true);
    // No-op at the bottom of the stack.
    await user.keyboard('{Alt>}{ArrowLeft}{/Alt}');
    expectView('main', true);

    // Forward: main → history → bookmarks.
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expectView('history', true);
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expectView('bookmarks', true);
  });

  it('universal keys: Ctrl+R soft refresh, Ctrl+Shift+R hard refresh', async () => {
    const { user, reloadSpy } = setup();
    render(<App />);

    // Soft refresh: stays on the current view, filters clear.
    await user.click(screen.getByRole('button', { name: 'Open sessions' }));
    await user.type(searchInput(), 'zzz-nonexistent');
    expect(screen.queryByText(/NO SESSIONS MATCHING/)).not.toBeNull();

    await user.keyboard('{Control>}r{/Control}');
    expectView('tabs', true); // still here
    expect(searchInput().value).toBe('');
    expect(reloadSpy).not.toHaveBeenCalled();

    // Hard refresh: full page reload.
    await user.keyboard('{Control>}{Shift>}r{/Shift}{/Control}');
    expect(reloadSpy).toHaveBeenCalled();
  });

  it('universal keys: Ctrl+H / Ctrl+B / Ctrl+, and Esc clears-then-closes', async () => {
    const { user } = setup();
    render(<App />);

    await user.keyboard('{Control>}h{/Control}');
    expectView('history', true);
    await user.keyboard('{Control>}b{/Control}');
    expectView('bookmarks', true);
    await user.keyboard('{Control>},{/Control}');
    expectView('settings', true);

    // Esc (field has no text) → close to home.
    await user.keyboard('{Escape}');
    expectView('main', true);

    // Esc with text in the field clears first, closes on second Esc.
    await user.click(screen.getByRole('button', { name: 'History' }));
    await user.type(searchInput(), 'deep query');
    await user.keyboard('{Escape}');
    expect(searchInput().value).toBe('');
    expectView('history', true); // still open
    await user.keyboard('{Escape}');
    expectView('main', true);
  });
});
