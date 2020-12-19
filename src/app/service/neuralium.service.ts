import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { BlockchainService } from './blockchain.service';
import { ServerConnectionService } from './server-connection.service';
import { WalletService } from './wallet.service';
import { BlockChain, NEURALIUM_BLOCKCHAIN } from '../model/blockchain';
import { NO_WALLET_ACCOUNT, WalletAccountStatus } from '../model/walletAccount';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../model/total-neuralium';
import { CONNECTED, EventTypes, ServerConnectionEvent } from '../model/serverConnectionEvent';
import { TimelineDay, TimelineHeader } from '../model/timeline';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';


@Injectable({
  providedIn: 'root'
})
export class NeuraliumService implements OnDestroy {

  selectedDate: DateTime;
  
  constructor(
    private blockchainService: BlockchainService,
    private serverConnectionService: ServerConnectionService,
    private _ngZone: NgZone,
    private walletService: WalletService
  ) {

    this.selectedDate = DateTime.local();

    this.blockchainService.getSelectedBlockchain().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchain => {
      this._ngZone.run(() => {
        this.displayNeuraliums(blockchain);
      });
     
    });

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      this._ngZone.run(() => {
        this.manageEvent(event);
      });

      
    });

    this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      this._ngZone.run(() => {
        this.accountUUid = account.accountCode;
      if (account !== NO_WALLET_ACCOUNT && account.isActive) {
        this.initialiseTimeline();
      }
      });

      
    });

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      this._ngZone.run(() => {
        if (event.eventType === EventTypes.AccountTotalUpdated) {
          if (this.walletService.isCurrentAccountSet) {
            this.updateNeuraliumsTotal(this.walletService.currentAccount.accountCode);
          }
        }
      });

      
    });
  }

  get neuraliumTimelineHeader(): Observable<TimelineHeader> {
    return this.timelineHeaderSet;
  }

  get neuraliumTimeline(): Observable<TimelineDay> {
    return this.timelineSet;
  }

  private unsubscribe$ = new Subject<void>();
  private showNeuraliumTotal: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private neuraliumTotal: BehaviorSubject<TotalNeuralium> = new BehaviorSubject<TotalNeuralium>(NO_NEURALIUM_TOTAL);

  private accountUUid: string;  
  private timelineHeaderSet: BehaviorSubject<TimelineHeader> = new BehaviorSubject<TimelineHeader>(null);
  private timelineSet: BehaviorSubject<TimelineDay> = new BehaviorSubject<TimelineDay>(null);

  updateTimer: NodeJS.Timeout;

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get timelineHeader(): TimelineHeader{
    return this.timelineHeaderSet.value;
  }

  get timeline(): TimelineDay{
    return this.timelineSet.value;
  }
  manageEvent(event: ServerConnectionEvent) {
    if (event.eventType === EventTypes.MiningPrimeElected
      || event.eventType === EventTypes.NeuraliumMiningPrimeElected
      || event.eventType === EventTypes.TransactionConfirmed
      || event.eventType === EventTypes.TransactionReceived
      || event.eventType === EventTypes.TransactionSent
      || event.eventType === EventTypes.TransactionCreated
      || event.eventType === EventTypes.NeuraliumTimelineUpdated) {

        // make sure we buffer multiple events in sequence and update only once so we dont update too often.
        if (this.updateTimer) {
          clearTimeout(this.updateTimer);
          this.updateTimer = null;
        }
        this.updateTimer = setTimeout(() => {
          clearTimeout(this.updateTimer);
          this.updateTimer = null;

          this.getMiningTimelineSection(true);
        }, 1000);

    }
  }

  getNeuraliumTotal(): Observable<TotalNeuralium> {
    return this.neuraliumTotal;
  }

  getShowNeuraliumTotal(): Observable<boolean> {
    return this.showNeuraliumTotal;
  }

  private updateNeuraliumsTotal(accountCode: any) {
    this.serverConnectionService.callQueryAccountTotalNeuraliums(accountCode).then(totalNeuralium => {
      this.neuraliumTotal.next(totalNeuralium);
    });
  }

  private displayNeuraliums(blockchain: BlockChain) {
    if (blockchain === NEURALIUM_BLOCKCHAIN && blockchain.menuConfig.showDashboard) {
      this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
        if (account && account !== NO_WALLET_ACCOUNT && account.isActive && account.status === WalletAccountStatus.Published) {// && account.isActive && account.status === WalletAccountStatus.Published

          this.updateNeuraliumsTotal(account.accountCode);
          this.showNeuraliumTotal.next(true);
        } else {
          this.showNeuraliumTotal.next(false);
        }
      });
    }
  }


  initialiseTimeline(): Promise<TimelineHeader> {

      const response = this.serverConnectionService.callQueryNeuraliumTimelineHeader(this.accountUUid);
      response.then(header => {
        this.timelineHeaderSet.next(header);
        this.getMiningTimelineSection(false);
      });

      return response;
  }

  lastDay:DateTime|null = null;

  public getMiningTimelineSection(getMissingHeader: boolean) {

    let now = DateTime.local();

    if(!getMissingHeader && (!this.lastDay || (now.day !== this.lastDay.day || now.month !== this.lastDay.month || now.year !== this.lastDay.year))){
      // the day just changed, so lets ensure a refresh of dates
      getMissingHeader = true;
      this.selectedDate = now;
      this.lastDay = now;
    }

    if(this.timelineHeader.days.length > 0){
      let firstDay = this.timelineHeader.days[0];

      
    }

    if (!this.timelineHeader || getMissingHeader) {
      // we dont have a proper header, lets query it again
      const promise = this.initialiseTimeline();
      promise.then(header => {
        if (!this.timelineHeader){
        }
        else{
        }
        this.getMiningTimelineSection(false);
      });
    } else {
      this.serverConnectionService.callQueryNeuraliumTimelineSection(this.accountUUid, this.selectedDate).then(timelineDay => {
        this.timelineSet.next(timelineDay);
      });
    }
  }
}
