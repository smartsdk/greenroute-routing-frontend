import { TestBed, inject } from '@angular/core/testing';

import { PoisService } from './pois.service';

describe ('PoisService', () => {
  beforeEach (() => {
    TestBed.configureTestingModule({
      providers: [PoisService]
    });
  });

  it ('should be created', inject([PoisService], (service: PoisService) => {
    expect (service).toBeTruthy();
  }));
});
