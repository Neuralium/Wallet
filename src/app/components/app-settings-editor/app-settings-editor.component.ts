import { Component, Input, Output, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ServerConnectionService } from '../../service/server-connection.service';

@Component({
  selector: 'app-tools-app-settings-editor',
  templateUrl: './app-settings-editor.component.html',
  styleUrls: ['./app-settings-editor.component.css']
})

export class AppSettingsEditor implements OnInit {

  readValue:string = "";
  writeSuccess:boolean = false;

  settings:object = {} as any;
  settingsDomain:object = {} as any;

  displayedColumns: string[] = ['name', 'value'];
  
  hiddenNames:string[] = [
    "NeuraliumChainConfiguration",
    "SerializationType",
    "HubsGossipDNS",
    "PortTestDns",
    "HubsWebAddress",
    "PortTestIpOverride",
    "UndocumentedDebugConfigurations",
    "DeleteBlocksAfterDays",
    "MemoryLimitCheckMode",
    "TotalUsableMemory",
    "MemoryLimitWarning",
    "MemoryLimit",
    "P2PEnabled"
  ];

  constructor(private serverConnectionService:ServerConnectionService) {
  }

  forceRefresh(){
    
  }
  ngOnInit(): void {
    this.refresh();
  }
  
  refresh(): void{
    this.readSetting("*");
    this.readSettingDomain("*");
  }
  getPropertyNames():string[] {
    if(this.settings)
      return Object.keys(this.settings).filter(name => !this.hiddenNames.includes(name));
    return [];
  }

  getPropertyType(name:string):string{
    
    return (name in this.settingsDomain) ? this.settingsDomain[name]["first"] : "undefined";
  }

  getPropertyDomain(name:string):string[]{    
      return (name in this.settingsDomain) ? this.settingsDomain[name]["second"] : [];

  }

  writeSetting(name:string, newValue:object){
   
    this.serverConnectionService.callWriteAppSetting(name, JSON.stringify(newValue)).then(result => {
        this.writeSuccess = result;
      }).catch(reason => {
        console.log(reason);
        this.writeSuccess = false;
        
      });

      if(!this.writeSuccess)
      {
        this.serverConnectionService.callReadAppSetting(name).then(result => {
          this.settings[name] = result;
        }).catch(reason => {
          console.log(reason);
        });
      }
    
  }
  readSetting(name:string){
    this.serverConnectionService.callReadAppSetting(name).then(result => {
      if(result != undefined)
        this.settings = result;
      else
        throw "call to ReadAppSetting(" + name + ") returned 'undefined'"
      }).catch(reason => {
        console.log(reason);
        this.settings = {} as any;
      });
    
  }

  readSettingDomain(name:string){
    this.serverConnectionService.callReadAppSettingDomain(name).then(result => {
        if(result != undefined)
          this.settingsDomain = result["second"];
        else
          throw "call to ReadAppSettingDomain(" + name + ") returned 'undefined'"

      }).catch(reason => {
        console.log(reason);
        this.settingsDomain = {} as any;
      });
    
  }


}
