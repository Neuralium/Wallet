import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';

export class DebugCall extends CommonCall {

    private constructor(
      protected serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new DebugCall(serviceConnectionService, logService)
    }

    callRefillNeuraliums(accountCode: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("RefillNeuraliums - call", { 'accountCode': accountCode });
            this.serviceConnectionService.invoke<boolean>("RefillNeuraliums", accountCode)
              .then(
                response => {
                  this.logEvent("RefillNeuraliums - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("RefillNeuraliums error : " + reason);
              });
          });
      }
}