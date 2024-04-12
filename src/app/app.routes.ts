/* system libraries */
import { Routes } from "@angular/router";

/* components */
// import { HomeComponent } from "./views/home/home.component";
import { ListAppsComponent } from "@views/list-apps/list-apps.component"; 
import { AppScriptsComponent } from "@views/app-scripts/app-scripts.component"; 
import { AboutComponent } from "@views/about/about.component"; 
import { AppScriptFormComponent } from "@views/app-script-form/app-script-form.component"; 
import { ScriptLogComponent } from "@views/script-log/script-log.component";

export const routes: Routes = [
  { path: '', redirectTo: '/list_apps', title: 'Home', pathMatch: 'full' },
  { path: 'home', redirectTo: '/list_apps', title: 'Home', pathMatch: 'full' },
  { path: 'list_apps', component: ListAppsComponent, title: 'List Apps' },
  { path: 'list_apps/scripts', component: AppScriptsComponent, title: 'List Scripts' },
  { path: 'list_apps/scripts/modify', component: AppScriptFormComponent, title: 'Manage script' },
  { path: 'list_apps/scripts/logger', component: ScriptLogComponent, title: 'Script logger' },
  { path: 'about', component: AboutComponent, title: 'About' },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];
