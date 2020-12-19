import { Component, Input, Output, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ServerConnectionService } from '../../service/server-connection.service';
import { PortMappingStatus, PortMapping } from '../../model/port-mapping-status';


@Component({
  selector: 'app-tools-upnp',
  templateUrl: './upnp.component.html',
  styleUrls: ['./upnp.component.css']
})
export class UpnpComponent implements OnInit {

  status:PortMappingStatus;
  result:boolean = false;
  busy:boolean = false;

  displayedColumns: string[] = ['description', 'privateIp', 'publicPort', 'privatePort', 'expiration'];

  mappings: string 
  constructor(private serverConnectionService:ServerConnectionService) {
    this.status = {} as any;
   }

  ngOnInit(): void {
    this.refreshStatus();
  }

  configure(useUPnP:boolean, usePmP:boolean, natDeviceIndex:number){
    this.busy = true;
    this.serverConnectionService.callConfigurePortMappingMode(useUPnP, usePmP, natDeviceIndex).then(result => {
        this.result = result;
        this.busy = false;
        this.refreshStatus();
      }).catch(reason => {
        console.log(reason);
        this.result = false;
        this.busy = false;
      });
    
  }


  refreshStatus(){
    
    this.serverConnectionService.GetPortMappingStatus().then(status => {
        this.status = status;
        
      }).catch(reason => {
        console.log(reason);
        this.status = {} as any;
      });
  }

}
