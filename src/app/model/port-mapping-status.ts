import { DateTime } from 'luxon';

export interface PortMapping{
    publicIp:string;
    privateIp:string;
    publicPort:number;
    privatePort:number;
    description:string;
    expiration:DateTime;
}
export interface PortMappingStatus {
    usePmP:boolean;
    useUPnP:boolean;
    deviceIndex:number;
    discoveredDevicesNames:Array<string>;
    publicIp:string;
    privateIp:string;
    portMappings:Array<PortMapping>;
}