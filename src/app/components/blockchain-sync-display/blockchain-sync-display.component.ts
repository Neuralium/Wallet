import { Component, OnInit, Input, OnDestroy, NgZone } from '@angular/core';
import { SyncStatusService } from '../../service/sync-status.service';
import { BlockchainService } from '../../service/blockchain.service';
import { SyncUpdate, NO_SYNC_UPDATE } from '../../model/sync-update';
import { SyncProcess, ProcessType, SyncStatus } from '../../model/syncProcess';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../../model/serverConnectionEvent';
import { BlockInfo } from '../../model/blockchain-info';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-blockchain-sync-display',
  templateUrl: './blockchain-sync-display.component.html',
  styleUrls: ['./blockchain-sync-display.component.scss']
})
export class BlockchainSyncDisplayComponent implements OnInit, OnDestroy {

  @Input() lightDisplay: boolean;

  unknownStatus: number = SyncStatus.Unknown;
  currentSyncStatusColor: string;
  currentSyncStatusTitle: string;
  currentSyncStatusPercentage: string;
  currentStatus: SyncStatus;
  currentBlockchainInfo: BlockInfo;
  toolTipText: string;

  currentSyncUpdateColor = 'primary';

  currentSyncUpdate: SyncUpdate = NO_SYNC_UPDATE;

  syncingList: Array<SyncProcess>;
  displaySyncList = false;

  unknownTitle: string;
  syncedTitle: string;
  notSyncedTitle: string;
  constructor(
    private syncStatusService: SyncStatusService,
    private translateService: TranslateService,
    private _ngZone: NgZone,
    private blockchainService: BlockchainService
  ) { }

  ngOnInit() {

    this.updateTitleTranslations();
    this.translateService.onLangChange.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
      this.updateTitleTranslations();
    });
    this.blockchainService.getBlockchainInfo().pipe(takeUntil(this.unsubscribe$)).subscribe((blockchainInfo) => {
      this._ngZone.run(() => {
      
        try {
          this.currentBlockchainInfo = blockchainInfo.blockInfo;
        } catch {}
      });
     
    });
    this.defineCurrentSyncStatus(SyncStatus.Unknown);

    this.syncStatusService.getCurrentBlockchainSyncStatus().pipe(takeUntil(this.unsubscribe$)).subscribe(status => {
      this._ngZone.run(() => {
        try {
          this.defineCurrentSyncStatus(status);
        } catch {}
      });

     
    });

    this.syncStatusService.getCurrentBlockchainSyncUpdate().pipe(takeUntil(this.unsubscribe$)).subscribe(update => {

      this._ngZone.run(() => {
        try {
          this.currentSyncUpdate = update;
          if (this.currentSyncUpdate.eventType === EventTypes.BlockchainSyncEnded && this.currentStatus !== SyncStatus.Synced) {
            // this is the better unknown option
            if (this.currentSyncUpdate.currentBlockId === this.currentSyncUpdate.blockHeight) {
              this.currentStatus = SyncStatus.Synced;
            }
            else if (this.currentSyncUpdate.currentBlockId === this.currentSyncUpdate.blockHeight) {
              this.currentStatus = SyncStatus.NotSynced;
            }
            this.defineCurrentSyncStatusTitle(this.currentStatus);
          }
          this.currentSyncUpdateColor = this.defineCurrentSyncUpdateColor(update.percentage);
          if (update.percentage < 100) {
            this.toolTipText = this.translateService.instant('sync.Syncing') + ' ' + this.translateService.instant('wallet.Wallet') + '... ' + update.percentage;
          }
        } catch {}
      });
      
    });

    this.syncStatusService.getSyncList().pipe(takeUntil(this.unsubscribe$)).subscribe(syncList => {
      this._ngZone.run(() => {
        this.syncingList = syncList;
      });
    });
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }

  updateTitleTranslations() {
    this.translateService.get('sync.Unknown').subscribe((res: string) => {
      this.unknownTitle = res;
    });
    this.translateService.get('sync.Synced').subscribe((res: string) => {
      this.syncedTitle = res;
    });
    this.translateService.get('sync.NotSynced').subscribe((res: string) => {
      this.notSyncedTitle = res;
    });

  }

  get currentBlockIdAdjusted(): string {
    let current = this.currentSyncUpdate.currentBlockId;

    if (current === 0 && this.currentBlockchainInfo.id !== 0) {
      current = this.currentBlockchainInfo.id;
    }

    return String(current);
  }

  get blockHeightAdjusted(): string {
    let current = this.currentSyncUpdate.blockHeight;

    if (current === 0 && this.currentBlockchainInfo.publicId !== 0) {
      current = this.currentBlockchainInfo.publicId;
    }

    return String(current);
  }

  get percentageAdjusted(): string {
    let current = this.currentSyncUpdate.percentage;

    let percent: number = 0;

    if (current === 0 && this.currentBlockchainInfo.publicId !== 0) {
      percent = (this.currentBlockchainInfo.id / this.currentBlockchainInfo.publicId);
    }

    if (current === 0 && percent !== 0) {
      current = percent;
    }
    if (current > 1) {
      // if we are not synced but we have 100%, our numbers are out of date. lets not show 100%, it would not be true.
      current = 1;
    }
    return String((current * 100).toFixed(2));
  }

  get isSyncing(): boolean {
    return this.syncingList && this.syncingList.filter(process => process.processType === ProcessType.SyncingBlockchain).length > 0 || this.showSyncUpdate();
  }

  showSyncUpdate(): boolean {
    return this.currentSyncUpdate !== NO_SYNC_UPDATE && this.currentSyncUpdate.eventType !== EventTypes.BlockchainSyncEnded;
  }

  defineCurrentSyncStatus(status: SyncStatus) {
    this.currentStatus = status;
    this.currentSyncStatusPercentage = this.defineCurrentSyncStatusPercentage(status);
    this.currentSyncStatusColor = this.defineCurrentSyncStatusColor(status);
    this.defineCurrentSyncStatusTitle(status);
  }

  defineCurrentSyncStatusColor(status: SyncStatus): string {
    switch (status) {
      case SyncStatus.Synced:
        return 'primary';
      default:
        return 'warn';
    }
  }

  defineCurrentSyncStatusPercentage(status: SyncStatus): string {
    switch (status) {
      case SyncStatus.Unknown:
        return '';
      case SyncStatus.Synced:
        return '100%';
      default:

        if (this.currentBlockchainInfo.publicId === 0) {
          return '';
        }

        let percent: number = (this.currentBlockchainInfo.id / this.currentBlockchainInfo.publicId) * 100;

        if (percent === 100) {
          // if we are not synced but we have 100%, our numbers are out of date. lets not show 100%, it would not be true.
          return '';
        }
        if (percent > 100) {
          // if we are not synced but we have 100%, our numbers are out of date. lets not show 100%, it would not be true.
          percent = 100;
        }
        return String(percent.toFixed(2)) + '%';
    }
  }

  defineCurrentSyncStatusTitle(status: SyncStatus): void {

    this.currentSyncStatusTitle = this.unknownTitle;
    if (status === SyncStatus.Unknown) {

    } else if (status === SyncStatus.Synced) {
      this.currentSyncStatusTitle = this.syncedTitle;
    } else {
      this.currentSyncStatusTitle = this.notSyncedTitle;
    }
  }

  defineCurrentSyncUpdateColor(percentage: number): string {

    this.currentSyncStatusPercentage = '';
    if (this.isSyncing === true) {
      this.currentSyncStatusPercentage = String(percentage);
    }

    if (percentage > 75) {
      return 'primary';
    } else if (percentage > 25) {
      return 'accent';
    } else {
      return 'warn';
    }
  }

}
