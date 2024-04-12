/* system libraries */
import { Injectable } from '@angular/core';
import { invoke } from "@tauri-apps/api/tauri";

@Injectable({
  providedIn: 'root'
})
export class ListAppsService {
  constructor() { }

  getListWindows() {
    return invoke("get_windows");
  }
}
