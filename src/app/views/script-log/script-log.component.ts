/* system libraries */
import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppInfo } from '@models/app-info';
import { Subject } from 'rxjs';

/* services */
import { AppScriptsService } from '@services/app-scripts.service';

/* components */
import { INotify, WindowNotifyComponent } from '@views/shared/window-notify/window-notify.component';

interface Log {
  'time': string;
  'status': string;
  'text': string;
}

@Component({
  selector: 'app-script-log',
  standalone: true,
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  imports: [CommonModule, WindowNotifyComponent],
  templateUrl: './script-log.component.html'
})
export class ScriptLogComponent implements OnInit, OnDestroy {
  title: string = '';

  constructor(
    private appScriptsService: AppScriptsService,
    private route: ActivatedRoute
  ) {}

  dataNotify: Subject<INotify> = new Subject();

  appInfo: AppInfo | null = null;
  nameScript: string = '';
  status: string = 'Not Running';
  rawCommands: string = '';
  loggerData: Array<Log> = [];

  interval: any;

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      this.appInfo = JSON.parse(params['appInfo']);
      this.nameScript = params['nameScript'];
    });
    setTimeout(() => {
      this.getCommandsScript();
    }, 500);
  }

  ngOnDestroy(): void {
    this.stop();
  }

  getCommandsScript() {
    this.appScriptsService.getCommandsScript(this.nameScript)
    .then((data: any) => {
      this.rawCommands = JSON.parse(data)["commands"];
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    })
  }
  
  start() {
    if (this.rawCommands != '') {
      if (this.interval) {
        clearInterval(this.interval);
      }
      const listCommands: Array<any> = JSON.parse(this.rawCommands);
      const lastCommand: {[key: string]: any} = listCommands[listCommands.length -1];
      let timeInterval = 0;
      if (lastCommand['type'] == "time") {
        if (lastCommand['type_duration'] == "min") {
          timeInterval = lastCommand['duration'] * 60 * 1000;
        } else if (lastCommand['type_duration'] == "sec") {
          timeInterval = lastCommand['duration'] * 1000;
        } else if (lastCommand['type_duration'] == "ms") {
          timeInterval = lastCommand['duration'];
        }
      }

      this.sendCommands();

      if (timeInterval > 100) {
        this.interval = setInterval(() => {
          this.sendCommands();
        }, timeInterval);
      }
    } else {
      this.stop();
    }
  }

  sendCommands() {
    this.status = 'Running';
    const time = new Date().toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.loggerData.unshift({time: time, status: "success", "text": "Starting script!"});
    this.appScriptsService.startScript(this.appInfo!.hwnd, this.rawCommands)
    .then((data: any) => {
      const parseData: Array<Log> = JSON.parse(data);
      parseData.forEach((record: Log) => {
        this.loggerData.unshift(record);
      });
      if (this.interval) {
        this.status = 'Wait';
      } else {
        this.status = 'Not Running';
      }
    })
    .catch((err: any) => {
      console.error(err);
      this.dataNotify.next({status: 'error', text: err});
    });
  }

  stop() {
    this.status = 'Not Running';
    clearInterval(this.interval);
  }
}
