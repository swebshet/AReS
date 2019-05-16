import { TestBed, inject } from '@angular/core/testing';

import { ExportsService } from './exports.service';

describe('ExportsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportsService]
    });
  });

  it('should be created', inject([ExportsService], (service: ExportsService) => {
    expect(service).toBeTruthy();
  }));
});
