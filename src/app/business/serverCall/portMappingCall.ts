import { CommonCall } from './commonCall';
import { LogService } from '../../service/log.service';
import { ServerConnectionService } from '../../service/server-connection.service';
import { PortMappingStatus } from '../../model/port-mapping-status';
import { assignObjectProperties } from '../../model/model-utils';

export class PortMappingCall extends CommonCall {

    private constructor(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new PortMappingCall(serviceConnectionService, logService)
    }

    GetPortMappingStatus(): Promise<PortMappingStatus> {
        return new Promise<PortMappingStatus>((resolve, reject) => {

            let action : string = 'GetPortMappingStatus';
            this.logEvent(action + ' - call', {  });
            this.serviceConnectionService.invoke<object>(action)
                .then(
                    response => {
                        this.logEvent(action + ' - response', response);
                        let instance:PortMappingStatus = {} as any;
                        assignObjectProperties(response, instance);
                        resolve(instance);
                    })
                .catch(reason => {
                    reject(action + ' error : ' + reason);
                });
            });
    }

    callConfigurePortMappingMode(useUPnP:boolean, usePmP:boolean, natDeviceIndex:number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let action : string = 'ConfigurePortMappingMode';
            this.logEvent(action + ' - call', {useUPnP, usePmP, natDeviceIndex});
            this.serviceConnectionService.invoke<boolean>(action, useUPnP, usePmP, natDeviceIndex)
                .then(
                    response => {
                        this.logEvent(action + ' - response', response);
                        resolve(response);
                    })
                .catch(reason => {
                    reject(action + ' error : ' + reason);
                });
            });
    }

   
}