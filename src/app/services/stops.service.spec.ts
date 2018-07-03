import { TestBed, inject } from '@angular/core/testing';

import { StopsService } from './stops.service';

describe('StopsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StopsService]
    });
  });

  it('should be created', inject([StopsService], (service: StopsService) => {
    expect(service).toBeTruthy();
  }));
});
