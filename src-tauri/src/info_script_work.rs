// use crate::get_info_windows::get_hwnd_by_title;

use std::collections::HashMap;

use serde_json;

use enigo::*;
use chrono::*;
use rand::Rng;

use winapi::shared::windef::HWND__;
use winapi::um::winuser::{GetForegroundWindow, SetForegroundWindow};

fn start_script(raw_hwnd: String, raw_commands: String) -> Result<String, serde_json::Error> {
  let hwnd_usize: usize = raw_hwnd.parse().unwrap();
  let hwnd_mut = hwnd_usize as *mut HWND__;
  let mut enigo = Enigo::new();
  let mut log: Vec<HashMap<String, String>> = Vec::new();

  let mut list_commands: Vec<serde_json::Value> = Vec::new();
  let json: serde_json::Value = serde_json::from_str(&raw_commands).unwrap();
  
  for index in 0..json.as_array().unwrap().len() -1 {
    list_commands.push(json.as_array().unwrap()[index].clone());
  }

  let previous_hwnd = unsafe { GetForegroundWindow() };

  // match get_hwnd_by_title("App Automation".to_string()) {
  //   Some(hwnd_app) => {
  //     unsafe { 
  //       while GetForegroundWindow() != hwnd_app {
  //         SetForegroundWindow(hwnd_app);
  //         std::thread::sleep(std::time::Duration::from_secs(1));
  //       }
  //     }
  //   },
  //   None => {}
  // }
  // std::thread::sleep(std::time::Duration::from_secs(1));

  let mut count_focus = 0;

  unsafe {
    while GetForegroundWindow() != hwnd_mut {
      count_focus += 1;
      SetForegroundWindow(hwnd_mut);
      std::thread::sleep(std::time::Duration::from_secs(1));
      if count_focus == 5 {
        log.push(
          HashMap::from([
            ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
            ("status".to_string(), "error".to_string()),
            ("text".to_string(), "The number of attempts to focus the specified window has been exceeded!".to_string())
          ])
        );

        std::thread::sleep(std::time::Duration::from_secs(1));

        while GetForegroundWindow() != previous_hwnd {
          SetForegroundWindow(previous_hwnd);
          std::thread::sleep(std::time::Duration::from_secs(1));
        }

        return serde_json::to_string(&log);
      }
    }
  }

  std::thread::sleep(std::time::Duration::from_secs(1));

  for (_index, command) in list_commands.iter().enumerate() {
    println!("{:#?}", command);
    if command.get("type").unwrap() == "keyboard" {
      let vec_keys = command.get("key").unwrap().as_array().unwrap();
      let key_data = &vec_keys[rand::thread_rng().gen_range(0..vec_keys.len())];
      let type_key = key_data.get("type").unwrap();
      if type_key == "letter" || type_key == "number" {
        let key = key_data.get("key").unwrap().as_str().unwrap().chars().into_iter().next().unwrap().to_lowercase().next().unwrap();
        let type_press = command.get("type_press").unwrap().as_str().unwrap();
        match type_press {
          "click" => enigo.key_click(Key::Layout(key)),
          "down" => enigo.key_down(Key::Layout(key)),
          "up" => enigo.key_up(Key::Layout(key)),
          _ => {
            log.push(
              HashMap::from([
                ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
                ("status".to_string(), "error".to_string()),
                ("text".to_string(), "This type of click was not found!".to_string())
              ])
            );
          }
        }
      } else if type_key == "button" {
        let name_key = key_data.get("key").unwrap().as_str().unwrap();
        let mut key_but: Key = Key::Space; 
        match name_key {
          "Space" => key_but = Key::Space,
          "Esc" => key_but = Key::Escape,
          "Ctrl" => key_but = Key::Control,
          "Shift" => key_but = Key::Shift,
          "Alt" => key_but = Key::Alt,
          "Enter" => key_but = Key::Return,
          "Tab" => key_but = Key::Tab,
          "Delete" => key_but = Key::Delete,
          "Home" => key_but = Key::Home,
          "PageUp" => key_but = Key::PageUp,
          "PageDown" => key_but = Key::PageDown,
          "End" => key_but = Key::End,
          _ => {
            log.push(
              HashMap::from([
                ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
                ("status".to_string(), "error".to_string()),
                ("text".to_string(), "No such key was found!".to_string())
              ])
            );
          }
        }
        let type_press = command.get("type_press").unwrap().as_str().unwrap();
        match type_press {
          "click" => enigo.key_click(key_but),
          "down" => enigo.key_down(key_but),
          "up" => enigo.key_up(key_but),
          _ => {
            log.push(
              HashMap::from([
                ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
                ("status".to_string(), "error".to_string()),
                ("text".to_string(), "This type of click was not found!".to_string())
              ])
            );
          }
        }
      }
    } else if command.get("type").unwrap() == "mouse" {
      let mut temp_but: MouseButton = MouseButton::Left;
      let button = command.get("button").unwrap().as_str().unwrap();
      match button {
        "left" => temp_but = MouseButton::Left,
        "right" => temp_but = MouseButton::Right,
        "middle" => temp_but = MouseButton::Middle,
        "scrollUp" => temp_but = MouseButton::ScrollUp,
        "scrollDown" => temp_but = MouseButton::ScrollDown,
        "scrollLeft" => temp_but = MouseButton::ScrollLeft,
        "scrollRight" => temp_but = MouseButton::ScrollRight,
        _ => {
          log.push(
            HashMap::from([
              ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
              ("status".to_string(), "error".to_string()),
              ("text".to_string(), "No such mouse key was found!".to_string())
            ])
          );
        },
      }
      let type_press = command.get("type_press").unwrap().as_str().unwrap();
      let move_dir = command.get("move_dir").unwrap().as_str().unwrap();
      let move_amount = command.get("move_amount").unwrap().as_i64().unwrap();
      match type_press {
        "click" => enigo.mouse_click(temp_but),
        "down" => enigo.mouse_down(temp_but),
        "up" => enigo.mouse_up(temp_but),
        "move" => {
          match move_dir {
            "x" => enigo.mouse_move_to(move_amount as i32, 0),
            "y" => enigo.mouse_move_to(0, move_amount as i32),
            _ => {
              log.push(
                HashMap::from([
                  ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
                  ("status".to_string(), "error".to_string()),
                  ("text".to_string(), "Invalid move_dir value!".to_string())
                ])
              );
            },
          }
        },
        _ => {
          log.push(
            HashMap::from([
              ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
              ("status".to_string(), "error".to_string()),
              ("text".to_string(), "Invalid type_press value!".to_string())
            ])
          );
        },
      }
    } else if command.get("type").unwrap() == "time" {
      let time = command.get("duration").unwrap().as_u64().unwrap();
      let type_duration = command.get("type_duration").unwrap().as_str().unwrap();
      match type_duration {
        "min" => std::thread::sleep(std::time::Duration::from_secs(time * 60)),
        "sec" => std::thread::sleep(std::time::Duration::from_secs(time)),
        "ms" => std::thread::sleep(std::time::Duration::from_millis(time)),
        _ => {
          log.push(
            HashMap::from([
              ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
              ("status".to_string(), "error".to_string()),
              ("text".to_string(), "This type of time has not been found!".to_string())
            ])
          );
        }
      }
    }
  }
  
  log.push(
    HashMap::from([
      ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
      ("status".to_string(), "success".to_string()),
      ("text".to_string(), "The script is completed!".to_string())
    ])
  );
  
  std::thread::sleep(std::time::Duration::from_secs(1));

  let mut count_focus = 0;

  unsafe {
    while GetForegroundWindow() != previous_hwnd {
      count_focus += 1;
      SetForegroundWindow(previous_hwnd);
      std::thread::sleep(std::time::Duration::from_secs(1));
      if count_focus == 5 {
        log.push(
          HashMap::from([
            ("time".to_string(), Local::now().time().format("%H:%M:%S").to_string()),
            ("status".to_string(), "error".to_string()),
            ("text".to_string(), "The number of attempts to focus the specified window has been exceeded!".to_string())
          ])
        );

        std::thread::sleep(std::time::Duration::from_secs(1));

        return serde_json::to_string(&log);
      }
    }
  }

  serde_json::to_string(&log)
}

#[tauri::command]
pub fn run_script(raw_hwnd: String, raw_commands: String) -> String {
	let data = start_script(raw_hwnd, raw_commands).unwrap();
	format!("{}", data)
}