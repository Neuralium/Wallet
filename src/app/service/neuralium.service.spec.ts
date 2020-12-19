import { TestBed } from '@angular/core/testing';

import { NeuraliumService } from './neuralium.service';

describe('NeuraliumService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NeuraliumService = TestBed.get(NeuraliumService);
    expect(service).toBeTruthy();
  });
});
