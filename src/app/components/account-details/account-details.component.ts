import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { WalletAccount } from '../..//model/walletAccount';
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
    private syncService: SyncStatusService) { }
  @Input() account: WalletAccount;
  @Input() isCurrent: boolean;

  canPublish: boolean = false;
  correlatedText:string = '';

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

    let key:string = 'account.NotCorrelated';

    if(this.account.correlated === 1){
      key = 'account.PhoneVerified';
    }
    if(this.account.correlated === 2){
      key = 'account.EmailVerified';
    }
    if(this.account.correlated === 3){
      key = 'account.GateVerified';
    }
    if(this.account.correlated === 4){
      key = 'account.KYCVerified';
    }
    this.translateService.get(key).subscribe(text => {
      this.correlatedText = text;
    });

    this.syncService.getCurrentBlockchainSyncStatus().pipe(takeUntil(this.unsubscribe$)).subscribe(syncStatus => {
      this.canPublish = syncStatus === SyncStatus.Synced;
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
