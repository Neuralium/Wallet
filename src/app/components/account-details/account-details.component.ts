import { Component, OnInit, Input, OnDestroy, NgZone } from '@angular/core';
import { WalletAccount, WalletAccountVerification } from '../..//model/walletAccount';
import { MatDialog } from '@angular/material/dialog';
import { WalletService } from '../..//service/wallet.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { SyncStatusService } from '../..//service/sync-status.service';
import { SyncStatus } from '../..//model/syncProcess';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-account-details',
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss']
})
export class AccountDetailsComponent implements OnInit, OnDestroy {

  constructor(
    public dialog: MatDialog,
    private walletService: WalletService,
    private blockchainService: BlockchainService,
    private translateService: TranslateService,
 private _ngZone: NgZone,
    private syncService: SyncStatusService) { }
  @Input() account: WalletAccount;
  @Input() isCurrent: boolean;

  canPublish: boolean = false;
  correlatedText:string = '';
  correlatedStatusText:string = '';
  correlationExpirationText:string = '';

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

    let correlatedKey:string = 'account.NotVerified';
    let correlatedStatus:string = 'account.AccountVerificationNone';

    let testExpiration : boolean = false;

    if(this.account.verification === WalletAccountVerification.Appointment){
      correlatedKey = 'account.AppointmentVerified';
      testExpiration = true;
    }
    if(this.account.verification === WalletAccountVerification.SMS){
      correlatedKey = 'account.SMSVerified';
      testExpiration = true;
    }
    if(this.account.verification === WalletAccountVerification.Phone){
      correlatedKey = 'account.PhoneVerified';
    }
    if(this.account.verification === WalletAccountVerification.Email){
      correlatedKey = 'account.EmailVerified';
    }
    if(this.account.verification === WalletAccountVerification.Gate){
      correlatedKey = 'account.GateVerified';
    }
    if(this.account.verification === WalletAccountVerification.KYC){
      correlatedKey = 'account.KYCVerified';
    }
    if(this.account.verification === WalletAccountVerification.Expired){
      correlatedKey = 'account.VerificationExpired';
    }

    if(testExpiration){
      if(this.account.verificationExpired){
        correlatedStatus = 'account.AccountVerificationExpired';
      }
      else if(this.account.verificationExpiring){
        correlatedStatus = 'account.AccountVerificationExpiring';
      }
      else{
        correlatedStatus = 'account.AccountVerificationActive';
      }
    }

    this.translateService.get(correlatedStatus).subscribe(text => {
      this.correlatedStatusText = text;
    });

    this.translateService.get(correlatedKey).subscribe(text => {
      this.correlatedText = text;
    });

    this.syncService.getCurrentBlockchainSyncStatus().pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus => {
      this._ngZone.run(() => {
      this.canPublish = syncStatus === SyncStatus.Synced;
    });

    })
  }
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  

  publishAccount(accountCode: string) {
    if (this.canPublish) {
      setTimeout(() => {
        let dialogRef = this.dialog.open(PublishAccountDialogComponent, {
          width: '700px',
          data: accountCode
        });

        dialogRef.afterClosed().subscribe(() => {
          this.walletService.refreshWallet(this.blockchainService.currentBlockchain.id);
        })
      });
    }
  }

  setAccountAsCurrent(account: WalletAccount) {
    this.walletService.setCurrentAccount(account);
  }
}
