import { Injectable } from '@angular/core';
import { ServerConnectionService } from './server-connection.service';
@Injectable({
  providedIn: 'root'
})
export class UpnpService {

  constructor(private serverConnectionService: ServerConnectionService) { }

  GetProtMappingstatus() {
    this.serverConnectionService.GetPortMappingStatus();
  }
}
