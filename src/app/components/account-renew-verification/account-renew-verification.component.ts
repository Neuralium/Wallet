import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from '../..//service/wallet.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { VerifyAccountDialogComponent } from '../..//dialogs/verify-account-dialog/verify-account-dialog.component';
import { AppointmentsDialogComponent } from '../..//dialogs/appointments-dialog/appointments-dialog.component';
import { AppointmentsService, IVerificationCompletedDetails } from '../..//service/appointment.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { EventTypes } from '../..//model/serverConnectionEvent';

import { WalletAccount, NO_WALLET_ACCOUNT, WalletAccountStatus } from '../..//model/walletAccount';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncStatus } from '../..//model/syncProcess';
import { OperatingModes } from '../..//model/enums';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../..//service/notification.service';


import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { WalletAccountAppointment, AppointmentStatus } from '../..//model/walletAccountAppointment';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-account-renew-verification',
  templateUrl: './account-renew-verification.component.html',
  styleUrls: ['./account-renew-verification.component.scss']
})
export class AccountRenewVerificationComponent implements OnInit, OnDestroy {

  constructor(
    public dialog: MatDialog,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
    private serverConnectionService: ServerConnectionService,
    private appointmentsService: AppointmentsService,
    private _ngZone: NgZone,
    private notificationService: NotificationService,
    private translateService: TranslateService) { }

    operatingMode: OperatingModes = OperatingModes.Unknown;



  get showRenewAccount(): boolean {
    return this.account !== NO_WALLET_ACCOUNT && this.account.status === WalletAccountStatus.Published && (this.account.verificationExpired || this.account.verificationExpiring  || this.expiring || this.expired);
  }

  account: WalletAccount = NO_WALLET_ACCOUNT;

  private unsubscribe$ = new Subject<void>();
  private timer : NodeJS.Timeout;

  expired :boolean = false;
  expiring :boolean = false;
  
  ngOnInit() {
    this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      this._ngZone.run(() => {
        this.account = account;

      this.startCheckExpired();
      });

      
    });

    this.blockchainService.blockchainInfo.pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus => {
      this._ngZone.run(() => {
        this.refreshOperatingMode();
      });

      
    });

    this.serverConnectionService.eventNotifier.subscribe(event => {
      if (!event.isNeuralium) {
          return;
      }

      switch (event.eventType) {


          case EventTypes.AppointmentVerificationCompleted:

            const verificationresult = <IVerificationCompletedDetails>(event.message);

            if (verificationresult.verified) {
                this.translateService.get('appointments.VerificationRenewRequestCompleted').subscribe((res: string) => {
                    this.notificationService.showSuccess(res);
                });
            } else {
                this.translateService.get('appointments.VerificationRenewRequestRejected').subscribe((res: string) => {
                    this.notificationService.showError(res);
                });
            }
            this.walletService.reloadCurrentAccount(this.account);
              break;
            }
          });


  }

  refreshOperatingMode(){
    this.blockchainService.getCurrentOperatingMode().then(mode => {
      this.operatingMode = mode;
    });
  }

  startCheckExpired(){

    this._ngZone.run(() => {
      this.expired = false;
      this.expiring = false;
      if(this.account && this.account !== NO_WALLET_ACCOUNT){

        const now = DateTime.utc();
        this.expired = this.account.verificationExpiration && this.account.verificationExpiration < now;
        this.expiring = this.account.verificationExpirationWarning && this.account.verificationExpirationWarning < now;
      }

      if(this.timer){
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.timer = setTimeout(() => {
        this.startCheckExpired();
      }, 1000 * 60 * 60);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  renewAccountVerification() {
    setTimeout(() => {

      let dialogRef;
      dialogRef = this.dialog.open(AppointmentsDialogComponent, {
        width: '700px',
        data: this.account.accountCode
      });
    });
  }
}
