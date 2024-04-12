/* system libraries */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './search.component.html'
})
export class SearchComponent {
  constructor() {}
  @Input() tempArray: Array<any> = [];
  @Output() array: EventEmitter<any> = new EventEmitter<any>();
  
  searchField: string = '';

  searchFunc() {
    const tempArr = this.searchField.split(" ");
    this.array.next(
      this.tempArray.filter((item: any) => {
        if (this.searchField !== '') {
          return tempArr.every((term: any) => {
            return Object.values(item).some((value: any) => {
              return String(value).toLowerCase().includes(term.toLowerCase());
            });
          });
        }
        return true;
      })
    );
  }
}
