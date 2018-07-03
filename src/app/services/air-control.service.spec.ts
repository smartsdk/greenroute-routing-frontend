import { TestBed, inject } from '@angular/core/testing';

import { AirControlService } from './air-control.service';

describe('AirControlService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AirControlService]
    });
  });

  it('should be created', inject([AirControlService], (service: AirControlService) => {
    expect(service).toBeTruthy();
  }));
});
