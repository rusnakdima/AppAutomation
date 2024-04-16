/* system libraies */
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';

/* models */
import { AppInfo } from '@models/app-info';

/* services */
import { AppScriptsService } from '@services/app-scripts.service';

/* components */
import { INotify, WindowNotifyComponent } from '@views/shared/window-notify/window-notify.component'; 

@Component({
  selector: 'app-app-scripts',
  standalone: true,
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  imports: [CommonModule, WindowNotifyComponent],
  templateUrl: './app-scripts.component.html'
})
export class AppScriptsComponent implements OnInit {
  title: string = '';
  
  constructor(
    private appScriptsService: AppScriptsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  dataNotify: Subject<INotify> = new Subject();

  appInfo: AppInfo | null = null;
  listScripts: Array<string> = [];

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      this.appInfo = JSON.parse(params['appInfo']);
    });
    setTimeout(() => {
      this.getListScripts();
    }, 500);
  }

  getListScripts() {
    this.appScriptsService.getListScripts()
    .then((data: any) => {
      if (data && data != '') {
        const app_scripts = JSON.parse(data);
        if (app_scripts[this.appInfo!.exe_file]) {
          this.listScripts = app_scripts[this.appInfo!.exe_file];
        } else {
          this.dataNotify.next({status: 'error', text: "No scripts were found for this program!"});
        }
      }
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    });
  }

  startScript(name: string) {
    if (this.appInfo?.hwnd != '') {
      this.router.navigate(['list_apps/scripts/logger'], { queryParams: { appInfo: JSON.stringify(this.appInfo), nameScript: name } });
    } else {
      this.dataNotify.next({status: 'error', text: "The program is not running! The script cannot be run!"});
    }
  }

  modifyScript(name: string = '') {
    const data = {
      exeFile: this.appInfo?.exe_file,
      nameScript: name
    };
    this.router.navigate([`list_apps/scripts/modify`], { queryParams: { data: JSON.stringify(data) } });
  }

  deleteScript(name: string) {
    const scriptIndex = this.listScripts.indexOf(name);
    this.listScripts.splice(scriptIndex, 1);
    this.appScriptsService.deleteScript(this.appInfo!.exe_file, name)
    .then((data: any) => {
      this.dataNotify.next({status: 'success', text: data});
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    });
  }
}
