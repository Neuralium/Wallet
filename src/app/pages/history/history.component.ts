import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Transaction, NeuraliumTransaction, NO_TRANSACTION } from '../..//model/transaction';
import { TransactionsService } from '../..//service/transactions.service';
import { WalletService } from '../..//service/wallet.service';
import { NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { Router } from '@angular/router';
import { NotificationService } from '../..//service/notification.service';
import { MatTableDataSource } from '@angular/material/table';
import {  MatDialog } from '@angular/material/dialog';
import {   MatTabChangeEvent } from '@angular/material/tabs';
import {   PageEvent } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { TransactionDetailsDialogComponent } from '../..//dialogs/transaction-details-dialog/transaction-details-dialog.component';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


enum Tabs {
  All = 0,
  Sent = 1,
  Received = 2
}

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit, OnDestroy {

  constructor(
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private router: Router,
    private _ngZone: NgZone,
    private walletService: WalletService,
    private transactionsService: TransactionsService,
    private serverConnectionService: ServerConnectionService,
    public dialog: MatDialog) { }

  get count(): number {
    return this.filteredTransactions.length;
  }

  get dataSource() {
    let finalData: Transaction[] = [];
    if (this.pageEvent) {
      const startIndex = this.pageEvent.pageSize * this.pageEvent.pageIndex;
      const endIndex = startIndex + this.pageEvent.pageSize;
      finalData = this.filteredTransactions.slice(startIndex, endIndex);
    } else {
      const startIndex = 0;
      const endIndex = this.pageSize;
      finalData = this.filteredTransactions.slice(startIndex, endIndex);
    }

    const tableDataSource = new MatTableDataSource(finalData);
    tableDataSource.filter = this.filterValue.trim().toLowerCase();

    return tableDataSource;
  }
  title = this.translateService.instant('history.Title');
  icon = 'fas fa-list-ul';
  displayedColumns: string[] = ['local', 'status', 'id', 'source', 'recipient', 'version', 'date', 'action'];
  transactions: Transaction[] = [];
  currentTab: Tabs = Tabs.All;
  filterValue = '';

  pageSize = 5;
  pageEvent: PageEvent;

  private unsubscribe$ = new Subject<void>();

  filteredTransactions: Transaction[] = [];

  ngOnInit() {

    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {

      this._ngZone.run(() => {
        if (connected !== CONNECTED) {
          this.router.navigate(['/dashboard']);
        } else {
          this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
  
            this._ngZone.run(() => {
              if (!account || account === NO_WALLET_ACCOUNT) {
                const errorMessage = this.translateService.instant('account.PleaseImportOrCreateWalletAccount');
                const errorTitle = this.translateService.instant('account.NoAccount');
                this.notificationService.showError(errorMessage, errorTitle);
                this.router.navigate(['/']);
              } else {
                this.transactionsService.getTransactions().pipe(takeUntil(this.unsubscribe$)).subscribe(transactions => {
    
                  this._ngZone.run(() => {
                    transactions.sort((b, a) => {
                      if (a.date < b.date) { return -1; }
                      if (a.date > b.date) { return 1; }
                      return 0;
                    });
                    this.transactions = transactions;
                    this.setDatasource();
                  });
        
                  
                });
              }
            });
          });
  
          this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
            if (event.eventType === EventTypes.NeuraliumTimelineUpdated) {
              this.transactionsService.refreshTransactions();
          }
        });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  setDatasource() {
    // var filteredTransactions: Transaction[] = [];
    switch (this.currentTab) {
      case Tabs.All:
        this.filteredTransactions = this.transactions;
        break;

      case Tabs.Sent:
        this.filteredTransactions = this.transactions.filter(transaction => transaction.local);
        break;

      case Tabs.Received:
        this.filteredTransactions = this.transactions.filter(transaction => !transaction.local);
        break;

      default:
        break;
    }
    this.filteredTransactions = this.filteredTransactions.sort((a, b) => b.date.toMillis() - a.date.toMillis());

  }

  applyFilter(filterValue: string) {
    this.filterValue = filterValue;
    this.setDatasource();
  }

  showTransactionDetails(transactionId: string) {
    this.transactionsService.getTransactionDetails(transactionId).then(transaction => {
      if (transaction && transaction !== NO_TRANSACTION) {
        setTimeout(() =>
          this.dialog.open(TransactionDetailsDialogComponent, {
            width: '800px',
            data: transaction
          }));
      } else {
        this.notificationService.showWarn('Error');
      }
    });
  }

  tabChanged(event: MatTabChangeEvent) {
    this.currentTab = event.index;
    this.setDatasource();
  }
}
