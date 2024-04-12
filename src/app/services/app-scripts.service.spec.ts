import { TestBed } from '@angular/core/testing';

import { AppScriptsService } from './app-scripts.service';

describe('AppScriptsService', () => {
  let service: AppScriptsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppScriptsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
