/* system libraries */
import { CommonModule, Location } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  title: string = '';

  constructor(
    private router: Router,
    private location: Location
  ) {}

  themeVal: string = '';
  backButton: boolean = false;

  ngOnInit() {
    this.setTitleRoute();
    this.themeVal = (localStorage.getItem('theme') != null) ? localStorage.getItem('theme')! : '';
  }
  
  setTitleRoute() {
    setInterval(() => {
      const endPos: number = (this.router.url.indexOf('?') > -1) ? this.router.url.indexOf('?') : this.router.url.length;
      const urlParam = this.router.config.find(x => x.path === this.router.url.slice(1, endPos));
      if (this.router.url.slice(1, endPos).split('/').length > 1) {
        this.backButton = true;
      } else {
        this.backButton = false;
      }
      if (urlParam) {
        this.title = urlParam["title"]!.toString();
      } else {
        this.title = "Not Found";
      }
    }, 100);
  }

  back() {
    this.location.back();
  }

  setTheme(theme: string) {
    document.querySelector('html')!.setAttribute("class", theme);
    localStorage.setItem('theme', theme);
    this.themeVal = theme;
  }
}
