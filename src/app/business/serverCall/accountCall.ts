import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';

export class AccountCall extends CommonCall {

    private constructor(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new AccountCall(serviceConnectionService, logService)
    }

    callSetActiveAccount(chainType: number, accountCode: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("SetActiveAccount - call", { chainType, accountCode });
            this.serviceConnectionService.invoke<boolean>("SetActiveAccount", chainType, accountCode)
              .then(
                response => {
                  this.logEvent("setActiveAccount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("setActiveAccount error : " + reason);
              });
          });

      }

      callPublishAccount(chainType: number, accountUuId: string) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("publishAccount - call", { 'chainType': chainType, 'accountUuId': accountUuId });
            this.serviceConnectionService.invoke<number>("PublishAccount", chainType, accountUuId)
              .then(
                response => {
                  this.logEvent("publishAccount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("publishAccount error : " + reason);
              });
          });
      }
}