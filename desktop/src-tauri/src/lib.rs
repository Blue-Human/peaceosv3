//! Phase A: a plain window shell around `@peaceos/web`'s built output.
//!
//! Deliberately empty of app logic. Evidence verification (integrity,
//! signatures, org identity, timestamp, custody, redactions) happens
//! entirely in the webview, in the same TypeScript `core`/`web` code the
//! browser portal uses — nothing here re-implements or touches it.

pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running the PeaceOS Verify desktop shell");
}
