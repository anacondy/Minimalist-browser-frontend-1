//! SYS® Minimalist Browser — Tauri v2 desktop shell.
//!
//! What this crate does:
//!   1. Hosts the React front-end (dist/ in release, Vite in dev).
//!   2. Exposes native "browser tab" commands to the front-end:
//!      every open session becomes a REAL Tauri webview window
//!      (a real tab) instead of a browser pop-up.
//!   3. Keeps the door open for deeper engine work (see ENGINE.md) —
//!      the front-end talks to this crate through the `native.js`
//!      bridge, so swapping WebKitGTK for Servo later only touches the
//!      Rust layer.

use std::sync::atomic::{AtomicUsize, Ordering};

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Monotonic counter → unique webview-window labels (tab-1, tab-2, …).
/// Window labels must be unique for the lifetime of the app.
static TAB_COUNTER: AtomicUsize = AtomicUsize::new(0);

/// Open a new browser tab (a real Tauri webview window) for `url`.
///
/// Called from the front-end bridge (`src/native.js`) whenever a
/// session / bookmark / history entry / search is opened. Returns the
/// window label so the caller can later close or navigate it.
#[tauri::command]
fn open_tab(app: AppHandle, url: String, title: Option<String>) -> Result<String, String> {
    let parsed =
        tauri::Url::parse(&url).map_err(|e| format!("invalid url `{url}`: {e}"))?;

    let n = TAB_COUNTER.fetch_add(1, Ordering::Relaxed) + 1;
    let label = format!("tab-{n}");

    WebviewWindowBuilder::new(&app, &label, WebviewUrl::External(parsed))
        .title(title.unwrap_or_else(|| "NEW SESSION".into()))
        .inner_size(1100.0, 720.0)
        .min_inner_size(360.0, 480.0)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(label)
}

/// Close a tab window (`label` is the value returned by `open_tab`).
#[tauri::command]
fn close_tab(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Navigate a tab window: `direction` = "back" | "forward".
/// Uses the WebView's own history (works for any page loaded in it).
#[tauri::command]
fn tab_navigate(app: AppHandle, label: String, direction: String) -> Result<(), String> {
    let script = match direction.as_str() {
        "back" => "history.back();",
        "forward" => "history.forward();",
        _ => return Err("direction must be `back` or `forward`".into()),
    };

    if let Some(window) = app.get_webview_window(&label) {
        window.eval(script).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Reload a tab window (soft refresh of the page inside that tab).
#[tauri::command]
fn tab_reload(app: AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.eval("location.reload();").map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Application entry point (also used by the iOS/Android mobile entry).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_tab,
            close_tab,
            tab_navigate,
            tab_reload
        ])
        .run(tauri::generate_context!())
        .expect("error while running SYS® browser");
}
