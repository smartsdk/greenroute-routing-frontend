import { TestBed, inject } from '@angular/core/testing';

import { PollenService } from './pollen.service';

describe('PollenService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PollenService]
    });
  });

  it('should be created', inject([PollenService], (service: PollenService) => {
    expect(service).toBeTruthy();
  }));
});
