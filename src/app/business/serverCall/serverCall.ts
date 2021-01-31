import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { SystemInfo } from '../..//model/systemInfo';
import { TcpTestResult } from '../..//model/enums';
import { PeerConnectionDetails } from '../../model/peer-connection-details';


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

            this.logEvent('shutdown - call', null);
            this.serviceConnectionService.invoke<boolean>('Shutdown')
              .then(
                response => {
                  this.logEvent('shutdown - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('shutdown error : ' + reason);
              });
          });
      }

      callTestP2pPort(selectedPort:number, callback:boolean): Promise<TcpTestResult> {
        return new Promise<TcpTestResult>((resolve, reject) => {

            this.logEvent('TestP2pPort - call', null);
            this.serviceConnectionService.invoke<TcpTestResult>('TestP2pPort', selectedPort, callback)
              .then(
                response => {
                  this.logEvent('TestP2pPort - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('TestP2pPort error : ' + reason);
              });
          });
      }

      callAttemptWalletRescue(chainType: number): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent('AttemptWalletRescue - call', null);
            this.serviceConnectionService.invoke<boolean>('AttemptWalletRescue', chainType)
              .then(
                response => {
                  this.logEvent('AttemptWalletRescue - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('AttemptWalletRescue error : ' + reason);
              });
          });
      }
      

      callQuerySystemVersion() {
        return new Promise<SystemInfo>((resolve, reject) => {

            this.logEvent('QuerySystemInfo - call', null);


            this.serviceConnectionService.invoke<SystemInfo>('QuerySystemInfo')
              .then(
                response => {
                  this.logEvent('QuerySystemInfo - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QuerySystemInfo error : ' + reason);
              });
          });
      }

      callQueryTotalConnectedPeersCount() {
        return new Promise<number>((resolve, reject) => {

            this.logEvent('QueryTotalConnectedPeersCount - call', null);
            this.serviceConnectionService.invoke<number>('QueryTotalConnectedPeersCount')
              .then(
                response => {
                  this.logEvent('QueryTotalConnectedPeersCount - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryTotalConnectedPeersCount error : ' + reason);
              });
          });
      }
      callQueryPeerConnectionDetails() {
        return new Promise<Array<PeerConnectionDetails>>((resolve, reject) => {

            this.logEvent('QueryPeerConnectionDetails - call', null);
            this.serviceConnectionService.invoke<Array<PeerConnectionDetails>>('QueryPeerConnectionDetails')
              .then(
                response => {
                  this.logEvent('QueryPeerConnectionDetails - response length', response.length);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryPeerConnectionDetails error : ' + reason);
              });
          });
      }

      callQueryMiningPortConnectable(){
        return new Promise<boolean>((resolve, reject) => {

          this.logEvent('QueryMiningPortConnectable - call', null);
          this.serviceConnectionService.invoke<boolean>('QueryMiningPortConnectable')
            .then(
              response => {
                this.logEvent('QueryMiningPortConnectable - response', response);
                resolve(response);
              })
            .catch(reason => {
              reject('QueryMiningPortConnectable error : ' + reason);
            });
        });
      }

      callApiQuery(chainType: number, method:string, parameters:string) {
        return new Promise<string>((resolve, reject) => {

          let parametersArray = parameters.split(" "); 
          var filteredParametersArray = parametersArray.filter(function (value) {
            if(value){
              return true;
            }
            return false;
          });

          let finalParametersArray :Array<any> = [];
          for(let i:number = 0; i < filteredParametersArray.length; i++){
            let value = filteredParametersArray[i];

            if(value.startsWith('"') && value.endsWith('"')){
              finalParametersArray[i] = value;
            }
            else{
              finalParametersArray[i] = Number(value);
            }
          }
          
            this.logEvent(method + ' - call', { 'parameters': finalParametersArray });

            this.serviceConnectionService.invoke<string>(method, ...finalParametersArray).then(
                response => {
                  this.logEvent('completeLongRunningEvent - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('CompleteLongRunningEvent error : ' + reason);
              });
          });
      }

      callCompleteLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent('completeLongRunningEvent - call', { 'correlationId': correlationId });
            this.serviceConnectionService.invoke<boolean>('CompleteLongRunningEvent', correlationId)
              .then(
                response => {
                  this.logEvent('completeLongRunningEvent - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('CompleteLongRunningEvent error : ' + reason);
              });
          });
      }

      callRenewLongRunningEvent(correlationId: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent('renewLongRunningEvent - call', { 'correlationId': correlationId });
            this.serviceConnectionService.invoke<boolean>('RenewLongRunningEvent', correlationId)
              .then(
                response => {
                  this.logEvent('renewLongRunningEvent - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('RenewLongRunningEvent error : ' + reason);
              });
          });
      }


      callEnableConsoleMessages(enable:boolean): Promise<boolean> {
      return new Promise<boolean>((resolve, reject) => {

        this.logEvent('toggleServerMessages - call', { 'enable': enable });
        this.serviceConnectionService.invoke<boolean>('ToggleServerMessages', enable)
          .then(
            (response) => {
              this.logEvent('toggleServerMessages - response', response);
              resolve(response);
            })
          .catch(reason => {
            reject('toggleServerMessages error : ' + reason);
          });
      });
  }
}