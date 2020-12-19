import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { WalletService } from '../../service/wallet.service';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../../model/walletAccount';
import {  WalletLoadStatus } from '../../model/wallet';
import { ServerConnectionService } from '../../service/server-connection.service';
import { BlockchainService } from '../../service/blockchain.service';
import { NotificationService } from '../../service/notification.service';

import { NO_BLOCKCHAIN } from '../../model/blockchain';
import { MatDialog } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { AskOrCreateWalletDialogComponent } from '../../dialogs/ask-or-create-wallet-dialog/ask-or-create-wallet-dialog.component';
import { CreateWalletProcessDialogComponent } from '../../dialogs/create-wallet-process-dialog/create-wallet-process-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { PublishAccountDialogComponent } from '../../dialogs/publish-account-dialog/publish-account-dialog.component';
import { CONNECTED } from '../..//model/serverConnectionEvent';
import { SyncStatusService } from '../..//service/sync-status.service';
import { EventTypes } from '../../model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';



@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  title = this.translateService.instant("dashboard.Title");
  icon = "fas fa-wallet";

  walletAccounts: Array<WalletAccount> = [];
  currentAccount: WalletAccount;

  private walletDialogOpen: boolean = false;
  private createLoadDialogOpen: boolean = false;

  constructor(
    private translateService: TranslateService,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private _ngZone: NgZone,
    private syncStatusService: SyncStatusService,
    private notificationService: NotificationService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      if (connected === CONNECTED) {
        this._ngZone.run(() => {
          this.initialise();
        });

       
      }
    })
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initialise() {
    this.blockchainService.getSelectedBlockchain().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchain => {
      if (blockchain !== NO_BLOCKCHAIN) {
        this._ngZone.run(() => {
          let currentBlockchainId = this.blockchainService.getCurrentBlockchain().id;
        this.tryInitialiseWallet(currentBlockchainId).then(() => {
          this.syncStatusService.initialiseStatus(blockchain.id);
        });
        });
      }
    });
  }

  tryInitialiseWallet(blockchainId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.walletService.getWallet().pipe(takeUntil(this.unsubscribe$)).subscribe(wallet => {

        if (blockchainId !== 0) {
          if (!wallet.isLoaded) {

            this.blockchainService.updateChainStatus().then(chainStatus => {

              if(chainStatus.walletInfo.walletExists && chainStatus.walletInfo.walletFullyCreated){
                this.walletService.loadWallet(blockchainId).then(isLoaded => {

                  let key:string = 'wallet.WalletLoaded';
                  if(isLoaded === false){
                    key = 'wallet.WalletLoadFailed';
                  }
                  this.translateService.get(key).subscribe((res: string) => {
                    this.notificationService.showSuccess(res);
                  });
                  
                  if (isLoaded === false) {
                    this.askCreateOrCopyWallet();
                  }
                  else {
                    this.walletService.refreshWallet(blockchainId);
                  }
                });
              }
              else{
                this.askCreateOrCopyWallet();
              }
            });
          }
          else {
            this.walletAccounts = wallet.accounts;
            this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
              this.currentAccount = account;
            });
          }
        }
      })
      resolve(true);
    });
  }

  isCurrentAccount(walletAccount: WalletAccount) {
    return this.currentAccount !== NO_WALLET_ACCOUNT && this.currentAccount.accountId === walletAccount.accountId;
  }

  get hasAccount(): boolean {
    return this.walletAccounts && this.walletAccounts.length > 0;
  }

  get hasCurrentAccount(): boolean {
    return this.walletAccounts && this.walletAccounts.length > 0 && this.currentAccount !== NO_WALLET_ACCOUNT;
  }

  get hasMoreThanOneAccount(): boolean {
    return this.walletAccounts && this.walletAccounts.length > 1;
  }





  askCreateOrCopyWallet() {
    if (!this.walletDialogOpen && !this.createLoadDialogOpen) {
      this.createLoadDialogOpen = true;
      setTimeout(() => {
        if (!this.walletDialogOpen) {

          const dialogRef = this.dialog.open(AskOrCreateWalletDialogComponent, {
            width: '450px'
          });
          dialogRef.afterClosed().subscribe(dialogResult => {
            this.createLoadDialogOpen = false;
            if (dialogResult === DialogResult.CreateWallet) {
              setTimeout(() => {
                this.showCreateWalletDialog();
              }, 1000);
            }
            else {
              this.initialise();
            }
          })
        }
      });
    }
  }


  showCreateWalletDialog() {

    if (!this.walletDialogOpen) {
      this.walletDialogOpen = true;
      setTimeout(() => {
        const dialogRef = this.dialog.open(CreateWalletProcessDialogComponent, {
          width: '750px'
        });
        dialogRef.afterClosed().subscribe(dialogResult => {
          this.walletDialogOpen = false;
          if (dialogResult === DialogResult.Cancel) {
            this.initialise();
          }
          else if (dialogResult === DialogResult.WalletCreated) {
            setTimeout(() => {
              this.walletService.refreshWallet(this.blockchainService.getCurrentBlockchain().id);
            }, 100);
          }
          else if (dialogResult !== "") {
            this.publishAccount(dialogResult);
          }
        });
      });
    }
  }


  publishAccount(accountCode: string) {
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