import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from '../..//service/wallet.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { VerifyAccountDialogComponent } from '../..//dialogs/verify-account-dialog/verify-account-dialog.component';
import { AppointmentsDialogComponent } from '../..//dialogs/appointments-dialog/appointments-dialog.component';
import { AppointmentsService } from '../..//service/appointment.service';

import { WalletAccount, NO_WALLET_ACCOUNT, WalletAccountStatus } from '../..//model/walletAccount';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncStatus } from '../..//model/syncProcess';
import { OperatingModes } from '../..//model/enums';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WalletAccountAppointment, AppointmentStatus } from '../..//model/walletAccountAppointment';

@Component({
  selector: 'app-account-publication-status',
  templateUrl: './account-publication-status.component.html',
  styleUrls: ['./account-publication-status.component.scss']
})
export class AccountPublicationStatusComponent implements OnInit, OnDestroy {

  constructor(
    public dialog: MatDialog,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
    private appointmentsService: AppointmentsService,
    private _ngZone: NgZone,
    private syncService: SyncStatusService) { }

  get accountStatus(): WalletAccountStatus {
    if (this.account) {
      return this.account.status;
    }
    return WalletAccountStatus.Unknown;
  }

  get showAccountStatus(): boolean {
    return this.account !== NO_WALLET_ACCOUNT && this.account.status !== WalletAccountStatus.Published;
  }

  get canPublish(): boolean {
    return this.syncStatus === SyncStatus.Synced && this.operatingMode !== OperatingModes.Unknown;
  }

  account: WalletAccount = NO_WALLET_ACCOUNT;
  operatingMode: OperatingModes = OperatingModes.Unknown;
  syncStatus: SyncStatus = SyncStatus.Unknown;

  private WalletAccountStatus = WalletAccountStatus;

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {
    this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      this._ngZone.run(() => {
        this.account = account;
      });
      
    });

    this.walletService.currentAccountSubject.pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      if(account){
        this._ngZone.run(() => {
          this.refreshOperatingMode();
      });
      }
    });
    this.syncService.getCurrentBlockchainSyncStatus().pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus => {
      this._ngZone.run(() => {
        this.syncStatus = syncStatus;
      });
      
    });

    this.blockchainService.blockchainInfo.pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus => {
      this._ngZone.run(() => {
        this.refreshOperatingMode();
    });
    });
  }

  refreshOperatingMode(){
    this.blockchainService.getCurrentOperatingMode().then(mode => {
      this.operatingMode = mode;
    });
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  publishAccount() {
    setTimeout(() => {

      let dialogRef;
      if (this.operatingMode === OperatingModes.None) {

        if(this.accountStatus === WalletAccountStatus.Dispatching){
          dialogRef = this.dialog.open(PublishAccountDialogComponent, {
            width: '700px',
            data: this.account.accountCode
          });
        }
        else{
          dialogRef = this.dialog.open(VerifyAccountDialogComponent, {
            width: '600px',
            data: this.account.accountCode
          });
        }
      
      }
      if (this.operatingMode === OperatingModes.Appointment) {
        this.walletService.canPublishAccount().then(result => {

          if(result.canPublish){
            dialogRef = this.dialog.open(PublishAccountDialogComponent, {
              width: '700px',
              data: this.account.accountCode
            });
          }
          else{
            dialogRef = this.dialog.open(AppointmentsDialogComponent, {
              width: '700px',
              data: this.account.accountCode
            });
          }
        });
      }
      if (this.operatingMode === OperatingModes.Presenting) {
        dialogRef = this.dialog.open(PublishAccountDialogComponent, {
          width: '700px',
          data: this.account.accountCode
        });
      }
    });
  }
}
