import { CommonCall } from './commonCall';
import { LogService } from '../../service/log.service';
import { ServerConnectionService } from '../../service/server-connection.service';
import { assignObjectProperties } from '../../model/model-utils';

export class AppSettingsCall extends CommonCall {

    private constructor(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new AppSettingsCall(serviceConnectionService, logService)
    }

 
    callReadAppSetting(name:string): Promise<object> {
        return new Promise<object>((resolve, reject) => {

            let action : string = 'ReadAppSetting';
            this.logEvent(action + ' - call', {name});
            this.serviceConnectionService.invoke<object>(action, name)
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

    callWriteAppSetting(name:string, newValue:string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let action : string = 'WriteAppSetting';
            this.logEvent(action + ' - call', {name, newValue});
            this.serviceConnectionService.invoke<boolean>(action, name, JSON.stringify(newValue))
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


    callReadAppSettingDomain(name:string)
    {
        return new Promise<object>((resolve, reject) => {

            let action : string = 'ReadAppSettingDomain';
            this.logEvent(action + ' - call', {name});
            this.serviceConnectionService.invoke<object>(action, name)
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