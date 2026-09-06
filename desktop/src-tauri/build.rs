fn main() {
    // Registers our two app-defined commands with Tauri's ACL so the
    // frontend is allowed to invoke them (see capabilities/default.json,
    // which references the "allow-update-organizations-registry" and
    // "allow-load-local-registry-state" permissions this autogenerates).
    // Without this, Tauri's IPC layer rejects the calls outright.
    let result = tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(
            tauri_build::AppManifest::new()
                .commands(&["update_organizations_registry", "load_local_registry_state"]),
        ),
    );
    if let Err(error) = result {
        panic!("failed to run tauri-build: {error:#}");
    }
}
