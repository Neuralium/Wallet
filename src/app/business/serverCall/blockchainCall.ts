import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { BlockchainInfo, BlockInfo, DigestInfo } from '../..//model/blockchain-info';
import { WalletAccountStatus } from '../..//model/walletAccount';
import { ChainStatus, WalletInfo } from '../..//model/blockchain';
import { OperatingModes } from '../..//model/enums';

import { DateTime } from 'luxon';

export class BlockchainCall extends CommonCall {

    private constructor(
      protected serviceConnectionService: ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService);
    }

    static create(
      serviceConnectionService: ServerConnectionService,
        logService: LogService) {
        return new BlockchainCall(serviceConnectionService, logService);
    }

    callSetPuzzleAnswers(chainType: number, answers: Array<number>) {
      return new Promise<void>((resolve, reject) => {

        this.logEvent('SetPuzzleAnswers - call', { chainType, answers });
        this.serviceConnectionService.invoke<void>('SetPuzzleAnswers', chainType, answers)
          .then(
            () => {
              resolve();
            })
          .catch(reason => {
            reject('SetPuzzleAnswers error : ' + reason);
          });
    });
    }

    callQueryBlockChainInfo(chainType: number) {
        return new Promise<BlockchainInfo>((resolve, reject) => {

            this.logEvent('QueryBlockChainInfo - call', { chainType });
            this.serviceConnectionService.invoke<BlockchainInfo>('QueryBlockChainInfo', chainType)
              .then(
                account => {
                  this.logEvent('QueryBlockChainInfo - response', account);
                  const blockId: number = account['blockId'];
                  const blockHash: string = account['blockHash'];
                  const publicBlockId: number = <WalletAccountStatus>account['publicBlockId'];
                  const blockTimestamp:  DateTime =  DateTime.fromISO(account['blockTimestamp']).toUTC();
                  const blockLifespan: number = account['blockLifespan'];
                  const digestId: number = account['digestId'];
                  const digestHash: string = account['digestHash'];
                  const digestBlockId: number = account['digestBlockId'];
                  const digestTimestamp:  DateTime =  DateTime.fromISO(account['digestTimestamp']).toUTC();
                  const publicDigestId: number = account['publicDigestId'];

                  const blockInfo = BlockInfo.create(blockId, blockTimestamp, blockHash, publicBlockId, blockLifespan);
                  const digestInfo = DigestInfo.create(digestId, digestBlockId, digestTimestamp, digestHash, publicDigestId);

                  const blockchainInfo = BlockchainInfo.create(blockInfo, digestInfo);
                  resolve(blockchainInfo);
                })
              .catch(reason => {
                reject('QueryBlockChainInfo error : ' + reason);
              });
        });
      }

      callQuerySupportedChains() {
        return new Promise<Array<object>>((resolve, reject) => {

            this.logEvent('querySupportedChains - call', null);
            this.serviceConnectionService.invoke<Array<object>>('QuerySupportedChains')
              .then(
                response => {
                  this.logEvent('querySupportedChains - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QuerySupportedChains error : ' + reason);
              });
          });
      }

      callQueryChainStatus(chainType: number) {
        return new Promise<ChainStatus>((resolve, reject) => {

            this.logEvent('queryChainStatus - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<ChainStatus>('QueryChainStatus', chainType)
              .then(
                response => {
                  this.logEvent('queryChainStatus - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryChainStatus error : ' + reason + '. chain type parameters: ' + chainType);
              });
          });
      }

      callQueryBlock(chainType: number, blockId: number) {
        return new Promise<string>((resolve, reject) => {

          this.logEvent('queryBlock - call', { 'chainType': chainType, 'blockId' : blockId });
          this.serviceConnectionService.invoke<string>('QueryBlock', chainType, blockId)
            .then(
              response => {
                this.logEvent('queryBlock - response', response);
                resolve(response);
              })
            .catch(reason => {
              reject('QueryBlock error : ' + reason + '. chain type parameters: ' + chainType + 'blockId: ' + blockId);
            });
        });
      }

      callGetCurrentOperatingMode(chainType: number): Promise<OperatingModes> {
        return new Promise<OperatingModes>((resolve, reject) => {

          this.logEvent('GetCurrentOperatingMode - call', { 'chainType': chainType });
          this.serviceConnectionService.invoke<OperatingModes>('GetCurrentOperatingMode', chainType)
            .then(
              response => {
                this.logEvent('GetCurrentOperatingMode - response', response);
                resolve(response);
              })
            .catch(reason => {
              reject('GetCurrentOperatingMode error : ' + reason + '. chain type parameters: ' + chainType);
            });
        });
      }

      callQueryWalletInfo(chainType: number) {
        return new Promise<WalletInfo>((resolve, reject) => {

            this.logEvent('queryWalletInfo - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<WalletInfo>('QueryWalletInfo', chainType)
              .then(
                response => {
                  this.logEvent('queryWalletInfo - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryWalletInfo error : ' + reason + '. chain type parameters: ' + chainType);
              });
          });
      }

      callQueryBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {

            this.logEvent('QueryBlockchainSynced - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>('QueryBlockchainSynced', chainType)
              .then(
                response => {
                  this.logEvent('QueryBlockchainSynced - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryBlockchainSynced error : ' + reason);
              });
          });
      }

      callQueryBlockHeight(chainType: number) {
        return new Promise<number>((resolve, reject) => {

            this.logEvent('queryBlockHeight - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<number>('QueryBlockHeight', chainType)
              .then(
                response => {
                  this.logEvent('queryBlockHeight - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('QueryBlockHeight error : ' + reason);
              });
          });
      }

      callIsBlockchainSynced(chainType: number) {
        return new Promise<boolean>((resolve, reject) => {
            this.logEvent('isBlockchainSynced - call', { 'chainType': chainType });
            this.serviceConnectionService.invoke<boolean>('IsBlockchainSynced', chainType)
              .then(
                response => {
                  this.logEvent('isBlockchainSynced - response', response);
                  resolve(response);
                })
              .catch(reason => {
                reject('isBlockchainSynced error : ' + reason);
              });
          });
      }
}
