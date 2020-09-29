import { DateTime } from 'luxon';

export enum ProcessType{
    Undefined = 0,
    WalletCreation = 1,
    SendingTransaction = 2,
    SyncingWallet = 3,
    SyncingBlockchain = 4
}

export enum SyncStatus{
    Unknown = -1,
    NotSynced = 0,
    ProbablySynced = 1,
    Synced = 2
}

export class SyncProcess{
    id:number;
    subject:string;
    stepsTotal:number;
    stepsDone:number;
    processType:ProcessType;

    static createNew(id:number = 0, subjet: string = '', processType:ProcessType = ProcessType.Undefined, stepsCount:number = 0): SyncProcess {
        var sync = new SyncProcess();
        sync.id = id !== 0 ? id : DateTime.local().millisecond * Math.random();
        sync.subject = subjet;
        sync.processType = processType;
        sync.stepsTotal = stepsCount;
        return sync;
      }
}

export const NO_SYNC = <SyncProcess>{
    id: 0,
    subject:'No sync',
    stepsTotal: 0,
    stepsDone:0,
    processType:ProcessType.Undefined
}

