import { TestBed } from '@angular/core/testing';

import { ListAppsService } from './list-apps.service';

describe('ListAppsService', () => {
  let service: ListAppsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListAppsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
