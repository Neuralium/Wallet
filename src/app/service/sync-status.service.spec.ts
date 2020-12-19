import { TestBed } from '@angular/core/testing';

import { SyncStatusService } from './sync-status.service';

describe('SyncStatusService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SyncStatusService = TestBed.get(SyncStatusService);
    expect(service).toBeTruthy();
  });
});
