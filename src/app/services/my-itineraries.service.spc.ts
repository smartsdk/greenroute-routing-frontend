import { TestBed, inject } from '@angular/core/testing';

import { MyItinerariesService } from './my-itineraries.service';

describe('VehiclePositionService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyItinerariesService]
    });
  });

  it('should be created', inject([MyItinerariesService], (service: MyItinerariesService) => {
    expect(service).toBeTruthy();
  }));
});
