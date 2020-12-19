import { TestBed } from '@angular/core/testing';

import { UpnpService } from './upnp.service';

describe('UpnpService', () => {
  let service: UpnpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpnpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
