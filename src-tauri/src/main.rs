// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod download_update;
mod open_file;
mod get_info_windows;
mod get_info_scripts;
mod info_script_work;

use tauri::Manager;
use download_update::download_update;
use open_file::open_file;
use get_info_windows::get_windows;
use get_info_scripts::get_scripts;
use get_info_scripts::get_commands;
use get_info_scripts::create_script;
use get_info_scripts::delete_script;
use info_script_work::run_script;


fn main() {
	tauri::Builder::default()
		.setup(|app| {
			let _ = app.get_window("main").unwrap();
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![download_update, open_file, get_windows, get_scripts, get_commands, create_script, delete_script, run_script])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
