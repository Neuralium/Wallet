import { CommonCall } from './commonCall';
import { LogService } from '../../service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';

export class PassphrasesCall extends CommonCall {

    private constructor(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
        serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new PassphrasesCall(serviceConnectionService, logService)
    }

    callEnterWalletPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string, setKeysToo: boolean): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let action : string = 'EnterWalletPassphrase';
            this.logEvent(action + ' - call', { correlationId, chainType, keyCorrelationCode, passphrase });
            this.serviceConnectionService.invoke<boolean>(action, correlationId, chainType, keyCorrelationCode, passphrase, setKeysToo)
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

    callEnterKeyPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let action : string = 'EnterKeyPassphrase';
                this.logEvent(action + ' - call', { correlationId, chainType, keyCorrelationCode, passphrase });
                this.serviceConnectionService.invoke<boolean>(action, correlationId, chainType, keyCorrelationCode, passphrase)
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

    callWalletKeyFileCopied(correlationId: number, chainType: number, keyCorrelationCode: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            let action:string = 'WalletKeyFileCopied';
            this.logEvent(action + ' - call', { correlationId, chainType, keyCorrelationCode });
            this.serviceConnectionService.invoke<boolean>(action, correlationId, chainType, keyCorrelationCode)
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