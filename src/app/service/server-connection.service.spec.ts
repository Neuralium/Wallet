import { TestBed } from '@angular/core/testing';

import { ServerConnectionService } from './server-connection.service';

describe('ServerConnectionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ServerConnectionService = TestBed.get(ServerConnectionService);
    expect(service).toBeTruthy();
  });
});
