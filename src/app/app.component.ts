/* system libraries */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

/* components */
import { HeaderComponent } from '@views/shared/header/header.component'; 

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    const theme = (localStorage.getItem('theme') != null) ? localStorage.getItem('theme')! : '';
    document.querySelector('html')!.setAttribute("class", theme);
  }
}
