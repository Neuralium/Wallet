import { Component, OnInit, Inject, OnDestroy, Optional, NgZone } from '@angular/core';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletService } from '../..//service/wallet.service';
import { NotificationService } from '../..//service/notification.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventTypes } from '../..//model/serverConnectionEvent';
import { SyncStatusService } from '../..//service/sync-status.service';
import { TransactionsService } from '../..//service/transactions.service';
import { TranslateService } from '@ngx-translate/core';
import { AccountCanPublish, AccountPublicationModes, WalletAccountStatus } from '../..//model/walletAccount';

import { SyncStatus } from '../..//model/syncProcess';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

interface IDialogParameter {
  accountCode: string;
  confirmationCode: number;
}

@Component({
  selector: 'app-publish-account-dialog',
  templateUrl: './publish-account-dialog.component.html',
  styleUrls: ['./publish-account-dialog.component.scss']
})
export class PublishAccountDialogComponent implements OnInit, OnDestroy {

  constructor(
    private serverConnectionService: ServerConnectionService,
    private walletService: WalletService,
    private synStatusService: SyncStatusService,
    private transactionService: TransactionsService,
    private _ngZone: NgZone,
    private notificationService: NotificationService,
    private translateService: TranslateService,
    public dialogRef: MatDialogRef<PublishAccountDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public parameters: IDialogParameter) {

  }
  isAccountPublicationRunning: boolean = false;
  isAccountPublicationEnded: boolean = false;
  showCloseButton: boolean = true;
  accountPublicationStep: number;
  accountPublicationStepName: string = '';
  errorOccured: boolean = false;

  message: string = '';
  publicationMode: AccountPublicationModes = AccountPublicationModes.Unknown;
  AccountPublicationModes = AccountPublicationModes;

  isBlockchainSynced: boolean = false;
  canPublish: boolean = false;


  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

    // let's determine the mode we are using

    this.walletService.canPublishAccount().then(result => {

      if (!result.canPublish) {

        this.walletService.queryWalletAccountDetails(this.walletService.currentAccount).then(account => {

          this._ngZone.run(() => {
            if(account.status === WalletAccountStatus.Dispatching){
              // ok, here we retake an existing 
              this.startListeningToAccountPublicationEvents();
  
              this.isAccountPublicationRunning = true;
              this.showCloseButton = false;
            }
            else{
              this.translateService.get('accountPublication.CannotPublishAccount').subscribe((res: string) => {
                this.notificationService.showError(res);
                this.dialogRef.close();
              });
            }
          });
        });
      
      }

      this.publicationMode = result.publishMode;

    });

    this.transactionService.getCanSendTransactions().pipe(takeUntil(this.unsubscribe$)).subscribe(canSend => {
      this._ngZone.run(() => {
        this.canPublish = canSend;
      });
    });

    this.synStatusService.getCurrentBlockchainSyncStatus().pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus => {
      this._ngZone.run(() => {
        this.isBlockchainSynced = syncStatus === SyncStatus.Synced;
      });
    });
  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  startListeningToAccountPublicationEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      switch (event.eventType) {
        case EventTypes.AccountPublicationStarted:
          this.isAccountPublicationRunning = true;
          this.showCloseButton = false;
          break;
        case EventTypes.AccountPublicationStep:
          var step = event.message;
          this.accountPublicationStepName = step['stepName'];
          var stepIndex = step['stepIndex'];
          var stepTotal = step['stepTotal'];
          this.accountPublicationStep = stepIndex / stepTotal * 100;
          break;
        case EventTypes.AccountPublicationError:
          this.message = event.message;
          this.showCloseButton = true;
          this.errorOccured = true;
          break;
        case EventTypes.AccountPublicationMessage:
          this.message = event.message;
          break;
        case EventTypes.THSTrigger:

          break;
        case EventTypes.THSBegin:

          break;
        case EventTypes.THSRound:

          break;
        case EventTypes.THSIteration:

          break;
        case EventTypes.THSSolution:

          break;
        case EventTypes.AccountPublicationEnded:
          this.isAccountPublicationRunning = false;
          this.accountPublicationStepName = '';
          this.accountPublicationStep = 100;
          this.isAccountPublicationEnded = true;
          this.showCloseButton = true;
          break;
        default:
          // other events are not relevant
          break;
      }
    })
  }

  startPublishAccount() {
    this.startListeningToAccountPublicationEvents();
    this.walletService.publishAccount(this.parameters.accountCode);
    this.isAccountPublicationRunning = true;
  }

  close() {
    this.dialogRef.close();
  }

}
