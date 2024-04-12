#[tauri::command]
pub fn open_file(path: String) -> String {
    if let Err(err) = opener::open(path) {
        eprintln!("Failed to open file: {}", err);
    }
    format!("")
}