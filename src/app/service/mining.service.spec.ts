import { TestBed } from '@angular/core/testing';

import { MiningService } from './mining.service';

describe('MiningService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MiningService = TestBed.get(MiningService);
    expect(service).toBeTruthy();
  });
});
