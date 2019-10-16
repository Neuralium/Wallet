import { CommonCall } from "./commonCall";
import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';
import { SystemInfo } from "../..//model/systemInfo";

export class ServerCall extends CommonCall {

    private constructor(
      protected serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService)
    }

    static create(
      serviceConnectionService : ServerConnectionService,
        logService: LogService) {
        return new ServerCall(serviceConnectionService, logService)
    }

    callServerShutdown(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("shutdown - call", null);
            this.serviceConnectionService.invoke<boolean>("Shutdown")
              .then(
                response => {
                  this.logEvent("shutdown - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("shutdown error : " + reason);
              });
          });
      }

      callQuerySystemVersion() {
        return new Promise<SystemInfo>((resolve, reject) => {

            this.logEvent("QuerySystemInfo - call", null);


            this.serviceConnectionService.invoke<SystemInfo>("QuerySystemInfo")
              .then(
                response => {
                  this.logEvent("QuerySystemInfo - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QuerySystemInfo error : " + reason);
              });
          });
      }

      callQueryTotalConnectedPeersCount() {
        return new Promise<number>((resolve, reject) => {

            this.logEvent("QueryTotalConnectedPeersCount - call", null);
            this.serviceConnectionService.invoke<number>("QueryTotalConnectedPeersCount")
              .then(
                response => {
                  this.logEvent("QueryTotalConnectedPeersCount - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("QueryTotalConnectedPeersCount error : " + reason);
              });
          });
      }

      callQueryMiningPortConnectable(){
        return new Promise<boolean>((resolve, reject) => {

          this.logEvent("QueryMiningPortConnectable - call", null);
          this.serviceConnectionService.invoke<boolean>("QueryMiningPortConnectable")
            .then(
              response => {
                this.logEvent("QueryMiningPortConnectable - response", response);
                resolve(response);
              })
            .catch(reason => {
              reject("QueryMiningPortConnectable error : " + reason);
            });
        });
      }

      callCompleteLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("completeLongRunningEvent - call", { 'correlationId': correlationId });
            this.serviceConnectionService.invoke<boolean>("CompleteLongRunningEvent", correlationId)
              .then(
                response => {
                  this.logEvent("completeLongRunningEvent - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("CompleteLongRunningEvent error : " + reason);
              });
          });
      }

      callRenewLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent("renewLongRunningEvent - call", { 'correlationId': correlationId });
            this.serviceConnectionService.invoke<boolean>("RenewLongRunningEvent", correlationId)
              .then(
                response => {
                  this.logEvent("renewLongRunningEvent - response", response);
                  resolve(response);
                })
              .catch(reason => {
                reject("RenewLongRunningEvent error : " + reason);
              });
          });
      }
}