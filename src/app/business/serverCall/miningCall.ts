import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { MiningStatistics } from '../..//model/mining-statistics';
import { MiningHistory } from '../..//model/mining-history';
import { EventTypes } from '../..//model/serverConnectionEvent';
import { IpMode } from '../..//model/enums';
import { DateTime } from 'luxon';

export class MiningCall extends CommonCall {

  private constructor(
    protected serviceConnectionService: ServerConnectionService,
    logService: LogService) {
    super(serviceConnectionService, logService);
  }

  static create(
    serviceConnectionService: ServerConnectionService,
    logService: LogService) {
    return new MiningCall(serviceConnectionService, logService);
  }

  callStartMining(chainType: number, tier:number, delegateAccountId: string) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('StartMining - call', { 'chainType': chainType, 'delegateAccountId': delegateAccountId, 'tier' : tier });
      this.serviceConnectionService.invoke<boolean>('StartMining', chainType, delegateAccountId, tier)
        .then(
          response => {
            this.logEvent('StartMining - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('StartMining error : ' + reason);
        });
    });
  }

  callStopMining(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('StopMining - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<boolean>('StopMining', chainType)
        .then(
          response => {
            this.logEvent('StopMining - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('StopMining error : ' + reason);
        });
    });
  }

  callIsMiningEnabled(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('IsMiningEnabled - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<boolean>('IsMiningEnabled', chainType)
        .then(
          response => {
            this.logEvent('IsMiningEnabled - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('IsMiningEnabled error : ' + reason);
        });
    });
  }

  callQueryMiningHistory(chainType: number, page: number, pageSize: number, maxLevel: number) {
    return new Promise<Array<MiningHistory>>((resolve, reject) => {

      this.logEvent('QueryMiningHistory - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<Array<object>>('QueryMiningHistory', chainType, page, pageSize, maxLevel)
        .then(
          response => {
            this.logEvent('QueryMiningHistory - response', response);
            const miningHistoryList = new Array<MiningHistory>();
            response.forEach(miningHistory => {
              try {
                const blockId = <number>miningHistory['blockId'];
                const transactionIds = <Array<string>>miningHistory['transactionIds'];
                const bountyShare = <number>miningHistory['bountyShare'];
                const transactionTips = <number>miningHistory['transactionTips'];

                const message = <EventTypes>miningHistory['message'];
                const timestamp = DateTime.fromISO(miningHistory['timestamp']).toUTC();
                const level = <number>miningHistory['level'];
                const parameters = <Array<Object>>miningHistory['parameters'];

                miningHistoryList.push(MiningHistory.create(blockId, message, timestamp, level, parameters, transactionIds, bountyShare, transactionTips));
              } catch (error) {
                this.logEvent('Cannot use mining hitory data.', miningHistory);
              }
            });
            resolve(miningHistoryList);
          })
        .catch(reason => {
          reject('QueryMiningHistory error : ' + reason);
        });
    });
  }


  callQueryMiningStatistics(chainType: number) {
    return new Promise<MiningStatistics>((resolve, reject) => {

      this.logEvent('QueryMiningStatistics - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<object>('QueryMiningStatistics', chainType)
        .then(
          response => {
            this.logEvent('QueryMiningStatistics - response', response);
            let miningStatistic = new MiningStatistics();
            try {

              if ((<any>response).sessionObj) {
                let startDate = (<any>response).sessionObj.start;
                if (startDate) {
                  miningStatistic.startedSession = DateTime.fromISO(startDate).toUTC();
                }
                miningStatistic.blockStartedSession = <number>((<any>response).sessionObj.blockStarted);
                miningStatistic.blocksProcessedSession = <number>((<any>response).sessionObj.blocksProcessed);
                miningStatistic.blocksElectedSession = <number>((<any>response).sessionObj.blocksElected);
                miningStatistic.lastBlockElectedSession = <number>((<any>response).sessionObj.lastBlockElected);
                miningStatistic.percentElectedSession = <number>((<any>response).sessionObj.percentElected);
                miningStatistic.averageBountyPerBlockSession = <number>((<any>response).sessionObj.averageBountyPerBlock);

                miningStatistic.totalBountiesSession = <number>((<any>response).sessionObj.totalBounties);
                miningStatistic.totalTipsSession = <number>((<any>response).sessionObj.totalTips);
              }

              if ((<any>response).aggregateObj) {
                miningStatistic.blocksProcessedAggregate = <number>((<any>response).aggregateObj.blocksProcessed);
                miningStatistic.blocksElectedAggregate = <number>((<any>response).aggregateObj.blocksElected);
                miningStatistic.lastBlockElectedAggregate = <number>((<any>response).aggregateObj.lastBlockElected);
                miningStatistic.percentElectedAggregate = <number>((<any>response).aggregateObj.percentElected);
                miningStatistic.miningSessionsAggregate = <number>((<any>response).aggregateObj.miningSessions);
                miningStatistic.averageBountyPerBlockAggregate = <number>((<any>response).aggregateObj.averageBountyPerBlock);

                miningStatistic.totalBountiesAggregate = <number>((<any>response).aggregateObj.totalBounties);
                miningStatistic.totalTipsAggregate = <number>((<any>response).aggregateObj.totalTips);
              }

            } catch (error) {
              this.logEvent('Cannot use mining statistic data.', miningStatistic);
            }

            resolve(miningStatistic);
          })
        .catch(reason => {
          reject('QueryMiningStatistics error : ' + reason);
        });
    });
  }

  callClearCachedCredentials(chainType: number) {
    return new Promise<Boolean>((resolve, reject) => {

      this.logEvent('ClearCachedCredentials - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<Boolean>('ClearCachedCredentials', chainType)
        .then(
          response => {
            this.logEvent('ClearCachedCredentials - response', response);
            
            resolve(response);
          })
        .catch(reason => {
          reject('ClearCachedCredentials error : ' + reason);
        });
    });
  }


  callQueryCurrentDifficulty(chainType: number) {
    return new Promise<number>((resolve, reject) => {

      this.logEvent('QueryCurrentDifficulty - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<number>('QueryCurrentDifficulty', chainType)
        .then(
          difficulty => {
            this.logEvent('QueryCurrentDifficulty - response', difficulty);

            resolve(difficulty);
          })
        .catch(reason => {
          reject('QueryCurrentDifficulty error : ' + reason);
        });
    });
  }

  callQueryMiningIPMode(chainType: number) {
    return new Promise<IpMode>((resolve, reject) => {

      this.logEvent('GetMiningRegistrationIpMode - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<number>('GetMiningRegistrationIpMode', chainType)
        .then(
          response => {
            this.logEvent('GetMiningRegistrationIpMode - response', response);

            let ipMode:IpMode = response;
            resolve(ipMode);
          })
        .catch(reason => {
          reject('GetMiningRegistrationIpMode error : ' + reason);
        });
    });
  }


}
