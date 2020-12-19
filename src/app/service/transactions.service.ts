import { Injectable, OnDestroy,NgZone } from '@angular/core';
import { Transaction, NO_TRANSACTION } from '../model/transaction';
import { BehaviorSubject, Observable } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { CONNECTED } from '../model/serverConnectionEvent';
import { WalletService } from './wallet.service';
import { BlockchainService } from './blockchain.service';
import { EventTypes } from '../model/serverConnectionEvent';
import { NotificationService } from './notification.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class TransactionsService implements OnDestroy {
  transactions: Array<Transaction> = [];
  observableTransactions: BehaviorSubject<Array<Transaction>> = new BehaviorSubject<Array<Transaction>>(this.transactions);
  blockchainId: number;
  walletId: number;
  accountId: string;

  minRequiredPeerCount = 0;
  canSendTransaction = false;
  canSendTransactionObservable: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.canSendTransaction);

  constructor(
    private serverConnectionService: ServerConnectionService,
    private walletService: WalletService,
 private _ngZone: NgZone,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private translateService: TranslateService) {

      this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
        if (connected === CONNECTED) {
          this._ngZone.run(() => {
            this.updateChainStatus();
          });

          
        }
      });

    this.blockchainService.getSelectedBlockchain().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchain => {
      this._ngZone.run(() => {
        this.blockchainId = blockchain.id;
      this.updateChainStatus();
      });

      
    });


    this.walletService.getWallet().pipe(takeUntil(this.unsubscribe$)).subscribe(wallet => {
      this._ngZone.run(() => {
        if (wallet.accounts && wallet.accounts.length > 0) {
          this.accountId = wallet.accounts.filter(account => account.isActive)[0].accountCode;
        } else {
          this.accountId = undefined;
        }
        this.refreshTransactions();
      });

      
    });

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      if (event.eventType === EventTypes.TransactionSent
        || event.eventType === EventTypes.TransactionConfirmed
        || event.eventType === EventTypes.TransactionReceived
        || event.eventType === EventTypes.TransactionRefused
        || event.eventType === EventTypes.TransactionError) {
          this._ngZone.run(() => {
            this.refreshTransactions();
          });
      }

      if (event.eventType === EventTypes.TransactionMessage) {
        this.notificationService.showInfo(event.message);
      }

      if (event.eventType === EventTypes.TransactionError) {


        this.translateService.get('send.TransactionError').subscribe((res: string) => {
          this.notificationService.showError(res + event.message.errorCodes.join(','));
        });

      }

      if (event.eventType === EventTypes.PeerTotalUpdated) {
        this._ngZone.run(() => {
          this.updateCanSendTransaction();
        });

        
      }
    });
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  
  updateChainStatus() {
    this.blockchainService.updateChainStatus().then(chainStatus => {
      if (chainStatus) {
        this._ngZone.run(() => {
          this.minRequiredPeerCount = chainStatus['minRequiredPeerCount'];
          this.updateCanSendTransaction();
        });

        
      }
    });
  }

  updateCanSendTransaction() {
    this.serverConnectionService.callQueryTotalConnectedPeersCount().then(total => {
      this._ngZone.run(() => {
        this.canSendTransaction = total >= this.minRequiredPeerCount;
        this.canSendTransactionObservable.next(this.canSendTransaction);
      });

    });
  }

  getCanSendTransactions(): Observable<boolean> {
    return this.canSendTransactionObservable;
  }

  getTransactions(): Observable<Transaction[]> {
    return this.observableTransactions;
  }

  getTransactionDetails(transactionId: string) {
    return this.serverConnectionService.callQueryTransationHistoryDetails(this.blockchainId, this.accountId, transactionId);
  }

  saveTransaction(targetAccountId: string, amount: number, tip: number, note: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (!this.canSendTransaction) {
        reject('Can\'t send transaction. Not enough peer. Need at least ' + this.minRequiredPeerCount + ' peer.');
      } else {

        if (!note) {
          note = '';
        }
        this.serverConnectionService.callSendNeuraliums(targetAccountId, amount, tip, note).then(() => {
          this._ngZone.run(() => {
            this.refreshTransactions();
            resolve(true);
          });
        
        }).catch(reason => {
          reject('Transaction not sent : ' + reason);
        });
      }
    });
  }

  refreshTransactions() {
    if (this.blockchainId !== 0 && this.accountId !== undefined) {
      this.serverConnectionService.callQueryWalletTransactionHistory(this.blockchainId, this.accountId)
        .then(transactions => {
          this._ngZone.run(() => {
            this.transactions = transactions;
            this.observableTransactions.next(this.transactions);
          });
         
        });
    }
  }
}
