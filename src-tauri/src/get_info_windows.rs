use serde_json;

use std::collections::HashMap;
use std::ffi::{c_void, OsString};
use std::iter::once;
use std::os::windows::ffi::{OsStrExt, OsStringExt};
use std::ptr;

use winapi::shared::minwindef::DWORD;
use winapi::shared::windef::HWND__;
use winapi::um::processthreadsapi::OpenProcess;
use winapi::um::winbase::QueryFullProcessImageNameW;
use winapi::um::winnt::PROCESS_QUERY_INFORMATION;
use winapi::um::winuser::{
	EnumWindows, GetWindowTextA, GetWindowTextLengthA, GetWindowThreadProcessId, IsWindowVisible,
};
use winapi::um::winver::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW};

type InfoMap = HashMap<String, String>;

// fn get_file_description(file_path: &str) -> Option<String> {
//     let wide_path: Vec<u16> = OsString::from(file_path).encode_wide().chain(once(0)).collect();

//     // Get file version info size
//     let size = unsafe { GetFileVersionInfoSizeW(wide_path.as_ptr(), ptr::null_mut()) };
//     if size == 0 {
//         return None;
//     }

//     let mut buffer: Vec<u8> = vec![0; size as usize];
//     let result = unsafe {
//         GetFileVersionInfoW(wide_path.as_ptr(), 0, size, buffer.as_mut_ptr() as *mut c_void)
//     };
//     if result == 0 {
//         return None;
//     }

//     let mut ptr: *mut c_void = ptr::null_mut();
//     let mut len: u32 = 0;
//     let query_result = unsafe {
//         VerQueryValueW(
//             buffer.as_ptr() as *const c_void,
//             OsString::from("\\VarFileInfo\\Translation").encode_wide().collect::<Vec<u16>>().as_ptr(),
//             &mut ptr,
//             &mut len,
//         )
//     };
//     println!("{:#?}", query_result);
//     println!("{:#?}", len);
//     println!("{:#?}", ptr);
//     if query_result == 0 {
//         return None;
//     }

//     if len % 4 != 0 {
//         return None;
//     }

//     let slice = unsafe { core::slice::from_raw_parts(ptr as *const u16, len as usize) };
//     let lang_and_code_page: Vec<u16> = slice.to_vec();
//     println!("{:#?}", lang_and_code_page);
//     let language = lang_and_code_page[0];
//     let code_page = lang_and_code_page[1];
//     let file_description_path = format!(
//         "\\StringFileInfo\\{:04X}{:04X}\\ProductName",
//         // "\\StringFileInfo\\{:04X}{:04X}\\FileDescription",
//         language, code_page
//     );

//     let mut ptr: *mut c_void = ptr::null_mut();
//     let mut len: u32 = 0;
//     let query_result = unsafe {
//         VerQueryValueW(
//             buffer.as_ptr() as *const c_void,
//             OsString::from(file_description_path).encode_wide().collect::<Vec<u16>>().as_ptr(),
//             &mut ptr,
//             &mut len,
//         )
//     };
//     println!("{:#?}", query_result);
//     println!("{:#?}", len);
//     if query_result == 0 {
//         return None;
//     }

//     if len == 0 {
//         return None;
//     }

//     println!("{:#?}", ptr);
//     let descr = unsafe { core::slice::from_raw_parts(ptr as *const u16, (len - 1) as usize) };
//     let descr = String::from_utf16(descr).unwrap();
//     println!("{:#?}", descr);

//     // let product_name_str = String::from_utf16_lossy(&ptr[..len as usize]);
//     // Some(product_name_str.into())
//     None
// }

fn get_process_path_from_hwnd(hwnd: *mut HWND__) -> Option<String> {
	let mut process_id: DWORD = 0;
	unsafe {
		// Get the process ID from the window handle
		GetWindowThreadProcessId(hwnd, &mut process_id);
	}

	if process_id != 0 {
		unsafe {
			let handle = OpenProcess(PROCESS_QUERY_INFORMATION, false as i32, process_id);
			if !handle.is_null() {
				let mut buffer: [u16; 4096] = [0; 4096];
				let mut buffer_size = buffer.len() as DWORD;
				if QueryFullProcessImageNameW(handle, 0, buffer.as_mut_ptr(), &mut buffer_size) != 0 {
					let os_str = OsString::from_wide(&buffer[..(buffer_size as usize)]);
					return Some(os_str.to_str().unwrap().to_string());
				}
			}
		}
	}

	None
}

fn get_list_windows() -> Vec<InfoMap> {
	let mut list_windows: Vec<InfoMap> = Vec::new();

	unsafe extern "system" fn enum_windows_proc(hwnd_mut: *mut HWND__, param: isize) -> i32 {
		let temp_list = param as *mut Vec<InfoMap>;

		if IsWindowVisible(hwnd_mut) != 0 {
			let mut info_map = HashMap::new();

			let title_length = GetWindowTextLengthA(hwnd_mut.clone());
			if title_length > 0 {
				let mut buffer = Vec::with_capacity((title_length + 1) as usize);
				GetWindowTextA(
					hwnd_mut.clone(),
					buffer.as_mut_ptr() as _,
					buffer.capacity() as _,
				);
				buffer.set_len(title_length as usize);
				info_map.insert(
					"title".to_string(),
					String::from_utf8_lossy(&buffer).into_owned(),
				);
				info_map.insert("hwnd".to_string(), (hwnd_mut as usize).to_string());

				if let Some(process_path) = get_process_path_from_hwnd(hwnd_mut) {
					info_map.insert(
						"exe_file".to_string(),
						process_path.clone().split("\\").last().unwrap().to_string(),
					);
				}
				(*temp_list).push(info_map);
			}
		}

		1
	}

	unsafe {
		let temp_list = &mut list_windows as *mut Vec<InfoMap>;
		EnumWindows(Some(enum_windows_proc), temp_list as isize);
	}

	list_windows
}


#[tauri::command]
pub fn get_windows() -> String {
	let data = get_list_windows();
	let json_string = serde_json::to_string(&data).unwrap();
	format!("{}", json_string)
}