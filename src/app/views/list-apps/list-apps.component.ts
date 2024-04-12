/* system libraries */
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

/* services */
import { ListAppsService } from '@services/list-apps.service'; 

/* models */
import { AppInfo } from '@models/app-info'; 

/* components */
import { INotify, WindowNotifyComponent } from '@views/shared/window-notify/window-notify.component';
import { SearchComponent } from '@views/shared/fields/search/search.component'; 

@Component({
  selector: 'app-home',
  standalone: true,
  providers: [ListAppsService],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  imports: [CommonModule, SearchComponent, WindowNotifyComponent],
  templateUrl: './list-apps.component.html'
})
export class ListAppsComponent {
  title: string = '';

  constructor(
    private listAppsService: ListAppsService,
    private router: Router
  ) {}

  dataNotify: Subject<INotify> = new Subject();

  favorites: Array<AppInfo> = [];
  listApps: Array<AppInfo> = [];
  tempListApps: Array<AppInfo> = [];

  ngOnInit() {
    this.getListWindows();
  }

  getListWindows() {
    let elem = document.getElementById("refreshBut") as HTMLElement;
    if (elem != null) {
      elem.classList.add("animate-spin");
      setTimeout(() =>{
        elem.classList.remove("animate-spin");
      }, 2000);
    }

    this.listAppsService.getListWindows()
    .then((data: any) => {
      if (data) {
        this.listApps = JSON.parse(data);
        this.tempListApps = JSON.parse(data);
      } else {
        throw Error("Invalid request");
      }
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    });

    setTimeout(() => {
      if (localStorage['favorites']) {
        const favorLS = JSON.parse(localStorage['favorites']);
        let tempFavor: Array<AppInfo> = [];
        favorLS.forEach((favorite: any) => {
          let hwnd = '';
          let status = 'Not running';
          const app = this.tempListApps.find((item: AppInfo) => item.exe_file == favorite.exe_file);
          if (app) {
            status = 'Running';
            hwnd = app.hwnd;
          }
          tempFavor.push({
            title: favorite.title,
            exe_file: favorite.exe_file,
            hwnd: hwnd,
            status: status
          })
        });
        this.favorites = tempFavor;
      }
    }, 50);
  }

  setFavor(AppInfo: AppInfo) {
    const app = this.favorites.find(f => f.exe_file === AppInfo.exe_file);
    if (!app) {
      if (localStorage['favorites']) {
        let favorites: Array<any> = JSON.parse(localStorage['favorites']);
        favorites.push({'exe_file': AppInfo.exe_file, 'title': AppInfo.title});
        localStorage['favorites'] = JSON.stringify(favorites);
      } else {
        localStorage['favorites'] = JSON.stringify([{'exe_file': AppInfo.exe_file, 'title': AppInfo.title}]);
      }
      this.favorites.push({
        title: AppInfo.title,
        exe_file: AppInfo.exe_file,
        hwnd: AppInfo.hwnd,
        status: 'Running'
      });
    }
  }

  unsetFavor(exe_file: string) {
    if (localStorage['favorites']) {
      let favorLS: Array<any> = JSON.parse(localStorage['favorites']);
      favorLS.splice(favorLS.findIndex((app: any) => app.exe_file == exe_file), 1);
      localStorage['favorites'] = JSON.stringify(favorLS);
      this.favorites = favorLS;
    }
  }

  searchFunc(data: any) {
    this.listApps = data;
  }
  
  pageWithScipts(appInfo: AppInfo) {
    this.router.navigate(['list_apps/scripts'], { queryParams: { appInfo: JSON.stringify(appInfo) } });
  }
}
