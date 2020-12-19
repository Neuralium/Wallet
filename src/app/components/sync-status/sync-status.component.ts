import { Component, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncProcess, ProcessType, SyncStatus } from '../..//model/syncProcess';
import { SyncUpdate, NO_SYNC_UPDATE } from '../..//model/sync-update';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { MatDialog } from '@angular/material/dialog';
import { ServerConnectionDialogComponent } from '../..//dialogs/server-connection-dialog/server-connection-dialog.component';
import { CONNECTED } from '../..//model/serverConnectionEvent';
import { ConfigService } from '../..//service/config.service';
import { WalletSyncDisplayComponent } from '../../components/wallet-sync-display/wallet-sync-display.component';
import { BlockchainSyncDisplayComponent } from '../../components/blockchain-sync-display/blockchain-sync-display.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.css']
})
export class SyncStatusComponent implements OnInit, OnDestroy {

  @ViewChild('walletSync', { static: false }) private walletSync: WalletSyncDisplayComponent;
  @ViewChild('blockchainSync', { static: false }) private blockchainSync: BlockchainSyncDisplayComponent;

  peersImage: string;
  peersCount: number = 0;

  notSynced: string;
  probablyNotSynced: string;
  synced: string;

  currentWalletSyncStatusColor: string;
  currentBlockchainSyncStatusColor: string;

  currentWalletSyncUpdateColor: string = "primary";
  currentBlockchainSyncUpdateColor: string = "primary";

  currentWalletSyncUpdate: SyncUpdate = NO_SYNC_UPDATE;
  currentBlockchainSyncUpdate: SyncUpdate = NO_SYNC_UPDATE;

  syncingList: Array<SyncProcess>;
  displaySyncList: boolean = false;

  serverNotConnected: boolean = true;
  currentServerConnectionStatusColor: string = "warn";

  constructor(
    private syncStatusService: SyncStatusService,
    private _ngZone: NgZone,
    private serverConnectionService: ServerConnectionService,
    private configService: ConfigService,
    public dialog: MatDialog) {

  }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      this._ngZone.run(() => {
        if (connected !== CONNECTED) {
          if (this.configService.isServerPathValid()) {
            this.showServerConnectionDialog(false);
            this.serverConnectionService.tryConnectToServer();
            this.serverNotConnected = true;
            this.currentServerConnectionStatusColor = "warn";
          }
        }
        else {
          this.serverNotConnected = false;
          this.currentServerConnectionStatusColor = "primary";
        }
      });

      
    })

    this.syncStatusService.getSyncList().pipe(takeUntil(this.unsubscribe$)).subscribe(syncList => {
      this._ngZone.run(() => {
        this.syncingList = syncList;
      });

    });

    this.syncStatusService.getPeerCount().pipe(takeUntil(this.unsubscribe$)).subscribe(count => {
      this._ngZone.run(() => {
        this.peersCount = count;
        let basePath = "./assets/img/";
        if (count >= 4) {
          this.peersImage = basePath + "pp5.png";
        }
        else if (count === 3) {
          this.peersImage = basePath + "pp4.png";
        }
        else if (count === 2) {
          this.peersImage = basePath + "pp3.png";
        }
        else if (count === 1) {
          this.peersImage = basePath + "pp2.png";
        }
        else if (count === 0) {
          this.peersImage = basePath + "pp1.png";
        }
      });

    })
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get isSyncingWallet(): boolean {
    return this.walletSync.isSyncing;
  }

  get isSyncingBlockchain(): boolean {
    return this.blockchainSync.isSyncing;
  }


  get isSyncing(): boolean {
    return this.isSyncingBlockchain || this.isSyncingWallet;
  }
  
  showServerConnectionDialog(manualyOpened: boolean) {
    setTimeout(() => {
      let dialogRef = this.dialog.open(ServerConnectionDialogComponent, {
        width: '350px',
        data: manualyOpened
      });
    });
  }
}
