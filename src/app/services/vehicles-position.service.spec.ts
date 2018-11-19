import { TestBed, inject } from '@angular/core/testing';

import { VehiclePositionService } from './vehicles-position.service';

describe('VehiclePositionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehiclePositionService]
    });
  });

  it('should be created', inject([VehiclePositionService], (service: VehiclePositionService) => {
    expect(service).toBeTruthy();
  }));
});
