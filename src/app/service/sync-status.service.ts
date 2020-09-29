import { Injectable, OnDestroy } from '@angular/core';
import { SyncProcess, SyncStatus, ProcessType } from '../model/syncProcess';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { SyncUpdate, NO_SYNC_UPDATE } from '../model/sync-update';
import { CONNECTED, EventTypes } from '../model/serverConnectionEvent';
import { LogService } from './log.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { PeerConnectionDetails } from '../model/peer-connection-details';


@Injectable({
  providedIn: 'root'
})
export class SyncStatusService implements OnDestroy {
  blockchainId: number = 0;

  currentBlockchainSyncStatus: BehaviorSubject<SyncStatus> = new BehaviorSubject<SyncStatus>(SyncStatus.Unknown);
  currentWalletSyncStatus: BehaviorSubject<SyncStatus> = new BehaviorSubject<SyncStatus>(SyncStatus.Unknown);
  currentBlockchainSyncUpdate: BehaviorSubject<SyncUpdate> = new BehaviorSubject<SyncUpdate>(NO_SYNC_UPDATE);
  currentWalletSyncUpdate: BehaviorSubject<SyncUpdate> = new BehaviorSubject<SyncUpdate>(NO_SYNC_UPDATE);

  syncList: Array<SyncProcess> = [];
  peerConnectionDetails: Array<PeerConnectionDetails> = [];
  syncListObservable: BehaviorSubject<Array<SyncProcess>> = new BehaviorSubject<Array<SyncProcess>>(this.syncList);
  peerCountObservable: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  peerConnectionDetailsObservable: BehaviorSubject<Array<PeerConnectionDetails>> = new BehaviorSubject<Array<PeerConnectionDetails>>(this.peerConnectionDetails);


  walletSyncProcess: SyncProcess = null;
  blockchainSyncProcess: SyncProcess = null;



  constructor(
    private logService: LogService,
    private serverConnectionService: ServerConnectionService
  ) {
    this.blockchainId = 0;
    this.clearSync();

    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      if (connected === CONNECTED) {
        this.getPeerCountFromServer();
        this.initialiseBlockchainSyncStatus();
      }
    });

    this.subscribeToEvents();
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }



  initialiseStatus(blockchainId: number) {
    this.blockchainId = blockchainId;
    this.initialiseWalletSyncStatus();
    this.initialiseBlockchainSyncStatus();
  }

  private initialiseWalletSyncStatus() {
    this.serverConnectionService.callIsWalletSynced(this.blockchainId)
      .then(isSynced => {
        if (isSynced) {
          this.currentWalletSyncStatus.next(SyncStatus.Synced);
        }
        else {
          this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
        }
      })
      .catch(err => {
        this.logService.logDebug("initialiseWalletSyncStatus error", err);
      })
  }

  private initialiseBlockchainSyncStatus() {
    if (this.blockchainId && this.blockchainId !== 0) {
      this.serverConnectionService.callQueryBlockchainSynced(this.blockchainId)
        .then(isSynced => {
          if (isSynced) {
            this.currentBlockchainSyncStatus.next(SyncStatus.Synced);
          }
          else {
            this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
          }
        })
        .catch(err => {
          this.logService.logDebug("initialiseBlockchainSyncStatus error", err);
        });
    }
  }

  private subscribeToEvents() {

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {

      let chainType: number;
      let currentBlockId: number;
      let blockHeight: number;
      let percentage: number;
      let estimatedTimeRemaining: string;
      let status: SyncStatus = SyncStatus.NotSynced;


      switch (event.eventType) {
        case EventTypes.WalletSyncStarted:
          chainType = event.message["chainType"];
          currentBlockId = event.message["currentBlockId"];
          blockHeight = event.message["blockHeight"];
          percentage = event.message["percentage"];

          this.walletSyncProcess = SyncProcess.createNew(event.correlationId, event.message, ProcessType.SyncingWallet);
          this.startSync(this.walletSyncProcess);
          this.currentWalletSyncUpdate.next(SyncUpdate.create(EventTypes.WalletSyncStarted, chainType, currentBlockId, blockHeight, percentage, ''));


          if (currentBlockId === blockHeight) {
            status = SyncStatus.Synced;
          }
          this.currentWalletSyncStatus.next(status);
          break;
        case EventTypes.WalletSyncEnded:
          chainType = event.message["chainType"];
          currentBlockId = event.message["currentBlockId"];
          blockHeight = event.message["blockHeight"];
          percentage = event.message["percentage"];

          this.endSync(this.walletSyncProcess);
          this.currentWalletSyncUpdate.next(SyncUpdate.create(EventTypes.WalletSyncEnded, chainType, currentBlockId, blockHeight, percentage, ''));

          if (currentBlockId === blockHeight) {
            status = SyncStatus.Synced;
          }
          this.currentWalletSyncStatus.next(status);
          break;
        case EventTypes.WalletSyncUpdate:
          chainType = event.message["chainType"];
          currentBlockId = event.message["currentBlockId"];
          blockHeight = event.message["blockHeight"];
          percentage = event.message["percentage"];

          estimatedTimeRemaining = event.message["estimatedTimeRemaining"];

          this.currentWalletSyncUpdate.next(SyncUpdate.create(EventTypes.WalletSyncUpdate, chainType, currentBlockId, blockHeight, percentage, estimatedTimeRemaining));
          if (currentBlockId === blockHeight) {
            status = SyncStatus.Synced;
          }

          this.currentWalletSyncStatus.next(status);
          break;
        case EventTypes.BlockchainSyncStarted:
          chainType = event.message["chainType"];
          currentBlockId = event.message["currentBlockId"];
          blockHeight = event.message["publicBlockHeight"];
          percentage = event.message["percentage"];

          this.blockchainSyncProcess = SyncProcess.createNew(event.correlationId, event.message, ProcessType.SyncingBlockchain);
          this.startSync(this.blockchainSyncProcess);
          this.currentBlockchainSyncUpdate.next(SyncUpdate.create(EventTypes.BlockchainSyncStarted, chainType, currentBlockId, blockHeight, percentage, ''));

          if (currentBlockId === blockHeight) {
            status = SyncStatus.Synced;
          }
          this.currentWalletSyncStatus.next(status);
          this.currentBlockchainSyncStatus.next(status);
          break;
        case EventTypes.BlockchainSyncEnded:
          chainType = event.message["chainType"];
          currentBlockId = event.message["currentBlockId"];
          blockHeight = event.message["publicBlockHeight"];
          percentage = event.message["percentage"];

          this.endSync(this.blockchainSyncProcess);
          this.currentBlockchainSyncUpdate.next(SyncUpdate.create(EventTypes.BlockchainSyncEnded, chainType, currentBlockId, blockHeight, percentage, ''));
          if (currentBlockId === blockHeight) {
            status = SyncStatus.Synced;
          }
          
          this.currentBlockchainSyncStatus.next(status);
          this.initialiseBlockchainSyncStatus();
          break;
        case EventTypes.BlockchainSyncUpdate:
          chainType = event.message["chainType"];
          currentBlockId = event.message["currentBlockId"];
          blockHeight = event.message["publicBlockHeight"];
          percentage = event.message["percentage"];

          estimatedTimeRemaining = event.message["estimatedTimeRemaining"];

          if (currentBlockId === blockHeight) {
            status = SyncStatus.Synced;
          }
          this.currentBlockchainSyncUpdate.next(SyncUpdate.create(EventTypes.BlockchainSyncUpdate, chainType, currentBlockId, blockHeight, percentage, estimatedTimeRemaining));

          this.currentBlockchainSyncStatus.next(status);
          break;
        case EventTypes.PeerTotalUpdated:
          this.getPeerCountFromServer();
        default:
          break;
      }
    });
  }

  private getPeerCountFromServer() {
    this.serverConnectionService.callQueryTotalConnectedPeersCount().then(total => {
      this.peerCountObservable.next(total);
    });

    this.serverConnectionService.callQueryPeerConnectionDetails().then(details => {
      this.peerConnectionDetails = details;
      this.peerConnectionDetailsObservable.next(this.peerConnectionDetails);
    });
  }

  refreshPeerCount() {
    this.getPeerCountFromServer();
  }

  getPeerCount(): Observable<number> {
    return this.peerCountObservable;
  }

  getPeerConnectionDetails(): Observable<Array<PeerConnectionDetails>> {
    return this.peerConnectionDetailsObservable;
  }

  private notifySyncing() {
    this.syncListObservable.next(this.syncList);
  }

  getCurrentBlockchainSyncStatus(): Observable<SyncStatus> {
    return this.currentBlockchainSyncStatus;
  }

  getCurrentWalletSyncStatus(): Observable<SyncStatus> {
    return this.currentWalletSyncStatus;
  }

  getCurrentBlockchainSyncUpdate(): Observable<SyncUpdate> {
    return this.currentBlockchainSyncUpdate;
  }

  getCurrentWalletSyncUpdate(): Observable<SyncUpdate> {
    return this.currentWalletSyncUpdate;
  }

  getSyncList(): Observable<Array<SyncProcess>> {
    return this.syncListObservable;
  }

  startSync(syncProcess: SyncProcess) {
    this.syncList.push(syncProcess);
    this.notifySyncing();
  }

  endSync(syncProcess: SyncProcess) {
    if (syncProcess) {
      this.endSyncWithId(syncProcess.id);
    }
  }

  endSyncWithId(id: number) {
    try {
      this.syncList = this.syncList.filter(item => item !== null && item.id !== id);
    }
    catch{ }
    this.notifySyncing();
  }

  clearSync() {
    this.syncList = [];
    this.notifySyncing();
    //this.updateWalletSyncStatusFromServer();
    //this.updateBlockchainSyncStatusFromServer();
  }
  /*
    updateWalletSyncStatusFromServer(){
      this.serverConnectionService.callQueryWalletSynced(this.blockchainService.currentBlockchain.id)
        .then(isSynced =>{
          if(isSynced){
            this.currentWalletSyncStatus.next(SyncStatus.Synced);
          }
          else{
            this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
          }
        })
        .catch((reason)=>{
          this.logService.logDebug("Wallet Sync error",reason);
          this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
        })
    }
  
    updateBlockchainSyncStatusFromServer(){
      this.serverConnectionService.callQueryBlockchainSynced(this.blockchainService.currentBlockchain.id)
        .then(isSynced =>{
          if(isSynced){
            this.currentBlockchainSyncStatus.next(SyncStatus.Synced);
          }
          else{
            this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
          }
        })
        .catch((reason)=>{
          this.logService.logDebug("Blockchain Sync error",reason);
          this.currentBlockchainSyncStatus.next(SyncStatus.NotSynced);
        })
    }
    */

  lauchTest(): any {
    this.walletSyncProcess = SyncProcess.createNew(1, "", ProcessType.SyncingWallet);
    this.startSync(this.walletSyncProcess);
    this.currentWalletSyncStatus.next(SyncStatus.NotSynced);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 1, 1, 5, 20, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 1000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 1, 2, 5, 40, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 2000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 1, 3, 5, 60, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 3000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 1, 4, 5, 80, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 4000);

    setTimeout(() => {
      this.currentWalletSyncUpdate.next(SyncUpdate.create(1, 1, 5, 5, 100, "2 days"));
      this.currentWalletSyncStatus.next(SyncStatus.NotSynced);
    }, 5000);

    setTimeout(() => {
      this.endSync(this.walletSyncProcess);
      this.currentWalletSyncUpdate.next(NO_SYNC_UPDATE);
      this.currentWalletSyncStatus.next(SyncStatus.Synced);
    }, 6000);
  }
}
