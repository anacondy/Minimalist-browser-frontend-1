// Build script — runs tauri-build so Tauri can embed assets, generate
// its schemas and (on Windows) the app icon resource.
fn main() {
    tauri_build::build()
}
