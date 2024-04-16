/* system libraries */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { invoke } from "@tauri-apps/api/tauri";

/* env */
import { environvent } from '@env/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  })
};

@Injectable({
  providedIn: 'root'
})
export class AboutService {
  constructor(
    private http: HttpClient
  ) { }

  nameProduct: string = environvent.nameProduct;

  getDate(version: string): Observable<any> {
    return this.http.get<any>(`https://api.github.com/repos/rusnakdima/${this.nameProduct}/releases/tags/v${version}`, httpOptions);
  }
  
  checkUpdate(): Observable<any> {
    return this.http.get<any>(`https://api.github.com/repos/rusnakdima/${this.nameProduct}/releases/latest`, httpOptions);
  }

  downloadUpdate(version: string) {
    return invoke("download_update", {"url": `https://github.com/rusnakdima/${this.nameProduct}/releases/download/${version}/app_automation.exe`, "fileName": "app_automation.exe"});
  }

  openFile(path: string) {
    return invoke("open_file", {'path': path});
  }
}
