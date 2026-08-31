//! SYS® Minimalist Browser — Tauri v2 desktop shell.
//!
//! Architecture: ONE native window with the React chrome (nav bar, tab
//! strip, search dock) as the main webview, plus one CHILD webview per
//! open browser tab (Tauri's multi-webview API, `feature = "unstable"`).
//! Content therefore renders INSIDE our UI — no new OS windows per
//! search — and every tab lifecycle (open/switch/close/navigate/reload)
//! is a native command the front-end calls through `src/native.js`.
//!
//! Live sync: every mutation emits a `tab://updated` event carrying the
//! full tab list, so the React tab strip + history stay in real time.

use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Mutex;

use serde::Serialize;
use tauri::{
    AppHandle, Emitter, Image, LogicalPosition, LogicalSize, Manager, State, Url, Webview,
    WebviewBuilder, WebviewUrl, WindowEvent,
};

/// Monotonic tab label counter — labels must be unique for the window's
/// lifetime, so we never reuse a number after a tab is closed.
static TAB_SEQ: AtomicUsize = AtomicUsize::new(0);

/// UI chrome height (nav bar + tab strip) and dock height in logical px.
/// The content webview is embedded between them so pages look framed by
/// the SYS® UI.
const CHROME_TOP: f64 = 100.0;
const DOCK_BOTTOM: f64 = 100.0;
const SIDE_MARGIN: f64 = 14.0;

/// Dark theme injected into every content tab, so external pages render
/// in OUR black/mono aesthetic (and never flash white).
/// Invert + hue-rotate is the cheapest reliable dark-mode for arbitrary
/// sites; images are re-inverted so they keep their true colors.
const DARK_INIT_CSS: &str = r#"
(() => {
  const css = `
    html { filter: invert(1) hue-rotate(180deg) !important; background: #000 !important; }
    img, picture, video, canvas, svg, [style*="background-image"] {
      filter: invert(1) hue-rotate(180deg) !important;
    }
    body {
      font-family: ui-monospace, 'DejaVu Sans Mono', 'Noto Sans Mono', monospace !important;
      letter-spacing: 0.02em !important;
      line-height: 1.5 !important;
      background: #000 !important;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);
})();
"#;

/// One browser tab (a child webview inside the main window).
#[derive(Debug, Clone, Serialize)]
struct TabInfo {
    label: String,
    title: String,
    url: String,
    active: bool,
}

/// Registry of open tabs, kept behind a mutex (commands + events share it).
#[derive(Default)]
struct TabManager(Mutex<Vec<TabInfo>>);

impl TabManager {
    fn snapshot(&self) -> Vec<TabInfo> {
        self.0.lock().unwrap().clone()
    }

    fn update_url(&self, label: &str, url: &str) {
        let mut tabs = self.0.lock().unwrap();
        if let Some(tab) = tabs.iter_mut().find(|t| t.label == label) {
            tab.url = url.to_string();
        }
    }

    fn update_title(&self, label: &str, title: &str) {
        let mut tabs = self.0.lock().unwrap();
        if let Some(tab) = tabs.iter_mut().find(|t| t.label == label) {
            tab.title = title.to_string();
        }
    }

    fn set_active(&self, label: Option<&str>) {
        let mut tabs = self.0.lock().unwrap();
        for tab in tabs.iter_mut() {
            tab.active = Some(label) == Some(tab.label.as_str());
        }
    }
}

/// Push the current tab list to the React chrome (event `tab://updated`).
/// Delivered only to the `main` webview — remote tab pages never see it.
fn emit_tabs(app: &AppHandle) {
    let tabs = app.state::<TabManager>().snapshot();
    let _ = app.emit_to("main", "tab://updated", tabs);
}

/// Logical content-area bounds for the active tab.
fn content_bounds(
    window: &tauri::window::Window,
) -> (LogicalPosition<f64>, LogicalSize<f64>) {
    if let Ok(physical) = window.inner_size() {
        let scale = window.scale_factor().unwrap_or(1.0);
        let logical = physical.to_logical::<f64>(scale);
        let width = (logical.width - 2.0 * SIDE_MARGIN).max(120.0);
        let height = (logical.height - CHROME_TOP - DOCK_BOTTOM).max(120.0);
        return (
            LogicalPosition::new(SIDE_MARGIN, CHROME_TOP),
            LogicalSize::new(width, height),
        );
    }
    (
        LogicalPosition::new(SIDE_MARGIN, CHROME_TOP),
        LogicalSize::new(800.0, 480.0),
    )
}

/// Show only the active webview; park the rest off-screen (Webview has
/// no `set_visible`, so off-screen 1px boxes are the reliable switch).
fn relayout(app: &AppHandle) {
    let Some(win) = app.get_webview_window("main") else { return };
    let window = win.as_ref().window(); // underlying host Window
    let (pos, size) = content_bounds(&window);
    let tabs = app.state::<TabManager>().snapshot();

    for tab in tabs.iter() {
        let Some(webview) = app.get_webview(&tab.label) else { continue };
        if tab.active {
            let _ = webview.set_position(pos);
            let _ = webview.set_size(size);
        } else {
            // Park inactive tabs far off-screen (1px logical box).
            let _ = webview.set_position(LogicalPosition::new(-10000.0, -10000.0));
            let _ = webview.set_size(LogicalSize::new(1.0, 1.0));
        }
    }
}

/// Register a child webview (a real tab) inside the main window.
fn create_tab(app: &AppHandle, label: &str, url: Url, title: String) -> Result<Webview, String> {
    let win = app
        .get_webview_window("main")
        .ok_or("main window missing")?;
    let window = win.as_ref().window();

    // Live URL tracking → keeps React history fresh in real time.
    let app_nav = app.clone();
    let label_nav = label.to_string();
    // Live title tracking → tab strip labels update as pages load.
    let app_title = app.clone();
    let label_title = label.to_string();

    let builder = WebviewBuilder::new(label, WebviewUrl::External(url))
        .initialization_script(DARK_INIT_CSS)
        .on_navigation(move |url: &Url| {
            // Record navigation, push to the UI (history + tab strip).
            let url_str = url.to_string();
            app_nav.state::<TabManager>().update_url(&label_nav, &url_str);
            emit_tabs(&app_nav);
            true // allow the navigation
        })
        .on_document_title_changed(move |_webview, title: String| {
            app_title.state::<TabManager>().update_title(&label_title, &title);
            emit_tabs(&app_title);
        });

    // Add it parked, then relayout so the active one is placed correctly.
    let webview = window
        .add_child(
            builder,
            LogicalPosition::new(-10000.0, -10000.0),
            LogicalSize::new(1.0, 1.0),
        )
        .map_err(|e| e.to_string())?;
    Ok(webview)
}

/// Open a session in a tab.
/// `new_tab=false` reuses the active tab (real-browser address-bar
/// behaviour — one window, no tab explosion on repeated searches).
#[tauri::command]
fn open_tab(
    app: AppHandle,
    state: State<'_, TabManager>,
    url: String,
    title: Option<String>,
    new_tab: Option<bool>,
) -> Result<TabInfo, String> {
    let parsed: Url = url.parse().map_err(|e| format!("invalid url `{url}`: {e}"))?;
    let title = title.unwrap_or_else(|| "NEW SESSION".to_string());
    let new_tab = new_tab.unwrap_or(true);

    // Reuse the active tab when requested (no new tab per search).
    if !new_tab {
        let active = state
            .snapshot()
            .into_iter()
            .find(|t| t.active)
            .map(|t| t.label);
        if let Some(label) = active {
            if let Some(webview) = app.get_webview(&label) {
                webview.navigate(parsed).map_err(|e| e.to_string())?;
                state.update_url(&label, &webview.url().map(|u| u.to_string()).unwrap_or_default());
                let info = state
                    .snapshot()
                    .into_iter()
                    .find(|t| t.label == label)
                    .ok_or("tab lost")?;
                emit_tabs(&app);
                return Ok(info);
            }
        }
    }

    // Otherwise: new tab (child webview inside this same window).
    let n = TAB_SEQ.fetch_add(1, Ordering::Relaxed) + 1;
    let label = format!("tab-{n}");
    create_tab(&app, &label, parsed, title.clone())?;

    {
        let mut tabs = state.0.lock().unwrap();
        for tab in tabs.iter_mut() {
            tab.active = false;
        }
        tabs.push(TabInfo {
            label: label.clone(),
            title,
            url: String::new(),
            active: true,
        });
    }

    relayout(&app);
    emit_tabs(&app);
    Ok(state.snapshot().into_iter().find(|t| t.label == label).unwrap())
}

/// Switch the visible tab (`label == "home"` → show the chrome hero).
#[tauri::command]
fn switch_tab(app: AppHandle, state: State<'_, TabManager>, label: String) -> Result<(), String> {
    if label == "home" {
        state.set_active(None);
    } else if state.snapshot().iter().any(|t| t.label == label) {
        state.set_active(Some(&label));
    } else {
        return Err("unknown tab".into());
    }
    relayout(&app);
    emit_tabs(&app);
    Ok(())
}

/// Close a tab; falls back to the previous tab (or → HOME).
#[tauri::command]
fn close_tab(app: AppHandle, state: State<'_, TabManager>, label: String) -> Result<(), String> {
    let was_active = state.snapshot().iter().any(|t| t.label == label && t.active);
    if let Some(webview) = app.get_webview(&label) {
        let _ = webview.close();
    }
    {
        let mut tabs = state.0.lock().unwrap();
        tabs.retain(|t| t.label != label);
        if was_active {
            if let Some(last) = tabs.last() {
                for tab in tabs.iter_mut() {
                    tab.active = tab.label == last.label;
                }
            }
        }
    }
    relayout(&app);
    emit_tabs(&app);
    Ok(())
}

/// Navigate a tab: "back" | "forward" (webview page history).
#[tauri::command]
fn tab_navigate(app: AppHandle, label: String, direction: String) -> Result<(), String> {
    let script = match direction.as_str() {
        "back" => "history.back();",
        "forward" => "history.forward();",
        _ => return Err("direction must be `back` or `forward`".into()),
    };
    if let Some(webview) = app.get_webview(&label) {
        webview.eval(script).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Reload a tab's page (soft refresh).
#[tauri::command]
fn tab_reload(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(webview) = app.get_webview(&label) {
        webview.eval("location.reload();").map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Full tab list (also pushed via `tab://updated` after mutations).
#[tauri::command]
fn tabs_list(state: State<'_, TabManager>) -> Vec<TabInfo> {
    state.snapshot()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TabManager::default())
        .setup(|app| {
            // Window icon: bundle default is not picked up on Linux dev
            // runs; set the SYS® icon explicitly so the taskbar/dock
            // shows OUR logo (not the generic engine glyph).
            if let Some(win) = app.get_webview_window("main") {
                let icon = Image::from_bytes(include_bytes!("../icons/128x128.png"))?;
                let _ = win.set_icon(icon);
                // Re-layout embedded tabs whenever the window resizes.
                let handle = app.handle().clone();
                win.on_window_event(move |event| {
                    if matches!(event, WindowEvent::Resized(_)) {
                        relayout(&handle);
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_tab,
            switch_tab,
            close_tab,
            tab_navigate,
            tab_reload,
            tabs_list,
        ])
        .run(tauri::generate_context!())
        .expect("error while running SYS® browser");
}
