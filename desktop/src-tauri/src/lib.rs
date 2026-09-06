//! A window shell around `@peaceos/web`'s built output, plus (Phase B) one
//! explicit, user-triggered action to update the local copy of the public
//! organizations registry.
//!
//! Evidence verification (integrity, signatures, org identity, timestamp,
//! custody, redactions) happens entirely in the webview, in the same
//! TypeScript `core`/`web` code the browser portal uses — nothing here
//! re-implements or touches it. The only network I/O anywhere in this crate
//! lives in `registry_update`, and only runs when the frontend explicitly
//! invokes `update_organizations_registry`.

mod registry_update;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            registry_update::update_organizations_registry,
            registry_update::load_local_registry_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running the PeaceOS Verify desktop shell");
}
