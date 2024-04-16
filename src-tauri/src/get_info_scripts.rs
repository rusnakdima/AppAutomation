use tauri::api::path;
use std::fs::{self, File};
use std::io::Read;
use std::io::Write;
use std::path::{Path, PathBuf};
use serde_json;

fn read_file(name_file: String) -> Result<(PathBuf, String), std::io::Error> {
  let document_folder = path::document_dir().expect("Failed to get document folder");
  let app_folder = document_folder.join("AppAutomation");
  if !Path::new(&app_folder).exists() {
    std::fs::create_dir_all(&app_folder).expect("Failed to create app folder");
  }

  let file_path = app_folder.join(&name_file);
  if !Path::new(&file_path).exists() {
    let mut data_file = File::create(&file_path).expect("Failed to create file");
    data_file.write("{}".as_bytes()).expect("Failed to write data to file");
  }

  let mut file = File::open(&file_path).unwrap();
  let mut contents = String::new();
  file.read_to_string(&mut contents).unwrap();

  Ok((file_path, contents))
}

fn get_list_scripts() -> Result<serde_json::Value, serde_json::Error> {
  let (_file_path, contents) = read_file("app_scripts.json".to_string()).unwrap();

  let json: serde_json::Value = serde_json::from_str(&contents).unwrap();

  Ok(json)
}

fn get_commands_script(name_script: String) -> String {
  let (_file_path, contents) = read_file(format!("{}.json", &name_script)).unwrap();

  contents
}

fn modify_script(exe_file: String, name_script: String, commands: String) -> String {
  let (file_path_app_scripts, contents) = read_file("app_scripts.json".to_string()).unwrap();

  let mut json: serde_json::Value = serde_json::from_str(&contents).unwrap();
  if !json[exe_file.clone()].as_array().unwrap_or(&vec![]).iter().any(|v| v == &serde_json::Value::String(name_script.clone())) {
    let mut scripts: Vec<serde_json::Value> = match json[exe_file.clone()].as_array() {
      Some(arr) => arr.clone(),
      None => Vec::new(),
    };
    scripts.push(serde_json::json!(name_script));
    json[exe_file.clone()] = serde_json::Value::Array(scripts);

    fs::write(&file_path_app_scripts, serde_json::to_string(&json).unwrap()).expect("Failed to write data to file");
  }

  let (file_path_script, contents) = read_file(format!("{}.json", &name_script)).unwrap();

  let mut json: serde_json::Value = serde_json::from_str(&contents).unwrap();
  json["commands"] = serde_json::json!(commands);
  fs::write(&file_path_script, serde_json::to_string(&json).unwrap()).expect("Failed to write data to file");

  format!("The data has been successfully changed!")
}

fn delete(exe_file: String, name_script: String) -> String {
  let (file_path_app_scripts, contents) = read_file("app_scripts.json".to_string()).unwrap();
  
  let mut json: serde_json::Value = serde_json::from_str(&contents).unwrap();

  if json[exe_file.clone()].as_array().unwrap_or(&vec![]).iter().any(|v| v == &serde_json::Value::String(name_script.clone())) {
    json[exe_file.clone()].as_array_mut().unwrap().retain(|v| v != &serde_json::Value::String(name_script.clone()));
    fs::write(&file_path_app_scripts, serde_json::to_string(&json).unwrap()).expect("Failed to write data to file");
  }

  let (file_path_script, _contents) = read_file(format!("{}.json", &name_script)).unwrap();
  fs::remove_file(&file_path_script).expect("Failed to delete file");

  format!("The script has been successfully deleted!")
}


#[tauri::command]
pub fn get_scripts() -> String {
  let data = get_list_scripts().unwrap();
  let json_string = serde_json::to_string(&data).unwrap();
  format!("{}", json_string)
}

#[tauri::command]
pub fn get_commands(name_script: String) -> String {
  let data = get_commands_script(name_script);
  format!("{}", data)
}

#[tauri::command]
pub fn create_script(exe_file: String, name_script: String, commands: String) -> String {
  let data = modify_script(exe_file, name_script, commands);
  format!("{}", data)
}

#[tauri::command]
pub fn delete_script(exe_file: String, name_script: String) -> String {
  let data = delete(exe_file, name_script);
  format!("{}", data)
}