import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BlockchainService } from '../..//service/blockchain.service';
import { WalletService } from '../..//service/wallet.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { Router } from '@angular/router';
import { NotificationService } from '../..//service/notification.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { NeuraliumService } from '../..//service/neuralium.service';
import { DialogResult } from '../..//config/dialog-result';
import { MiningService } from '../..//service/mining.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { NEURALIUM_BLOCKCHAIN } from '../..//model/blockchain';
import { NO_WALLET_ACCOUNT, WalletAccountStatus, WalletAccount } from '../..//model/walletAccount';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../..//model/total-neuralium';
import { MiningStatistics } from '../..//model/mining-statistics';
import { ConfirmDialogComponent, ConfirmDialogParameter} from '../..//dialogs/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime, Duration } from 'luxon';

@Component({
  selector: 'app-neuraliums',
  templateUrl: './neuraliums.component.html',
  styleUrls: ['./neuraliums.component.scss']
})
export class NeuraliumsComponent implements OnInit, OnDestroy {
  title = this.translateService.instant("neuralium.Title");
  icon = "fas fa-sign-out-alt";

  currentAccount: WalletAccount = NO_WALLET_ACCOUNT;

  neuraliumTotal: TotalNeuralium = NO_NEURALIUM_TOTAL;
  blockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;

  private miningStatistics: MiningStatistics = new MiningStatistics();
  private currentDifficulty: number = 0;

  private updateTimer: NodeJS.Timeout;
  disableClearcache:boolean = false;

  constructor(
    private translateService: TranslateService,
    private _ngZone: NgZone,
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private router: Router,
    private notificationService: NotificationService,
    private serverConnectionService: ServerConnectionService,
    private neuraliumService: NeuraliumService,
    private miningService: MiningService,
    public dialog: MatDialog) { }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  get currentRemainingTime(): Duration {
    return this.blockchainService.currentRemainingTime;
  }

  get remainingTimePercent():  Number {
    return this.blockchainService.remainingTimePercentVal;
  }


  get showRemainingTime(): boolean {
    return this.blockchainService.showRemainingTime;
  }

  queryStatistics = () => {
    // make sure we call it only once in a short delay of time. avoid duplicates
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    this.updateTimer = setTimeout(() => {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;

      // update mining statistics
      this.miningService.queryMiningStatistics().then(statistics => {


        this.miningStatistics.startedSession = statistics.startedSession;
        this.miningStatistics.blockStartedSession = statistics.blockStartedSession;
        this.miningStatistics.blocksProcessedSession = statistics.blocksProcessedSession;
        this.miningStatistics.blocksElectedSession = statistics.blocksElectedSession;
        this.miningStatistics.lastBlockElectedSession = statistics.lastBlockElectedSession;
        this.miningStatistics.percentElectedSession = statistics.percentElectedSession;
        this.miningStatistics.averageBountyPerBlockSession = statistics.averageBountyPerBlockSession;

        this.miningStatistics.totalBountiesSession = statistics.totalBountiesSession;
        this.miningStatistics.totalTipsSession = statistics.totalTipsSession;

        this.miningStatistics.blocksProcessedAggregate = statistics.blocksProcessedAggregate;
        this.miningStatistics.blocksElectedAggregate = statistics.blocksElectedAggregate;
        this.miningStatistics.lastBlockElectedAggregate = statistics.lastBlockElectedAggregate;
        this.miningStatistics.percentElectedAggregate = statistics.percentElectedAggregate;
        this.miningStatistics.averageBountyPerBlockAggregate = statistics.averageBountyPerBlockAggregate;
        this.miningStatistics.miningSessionsAggregate = statistics.miningSessionsAggregate;


        this.miningStatistics.totalBountiesAggregate = statistics.totalBountiesAggregate;
        this.miningStatistics.totalTipsAggregate = statistics.totalTipsAggregate;
        
      });
    }, 1000);
  }

  queryDifficulty = () => {
    if (this.miningService.isCurrentlyMining) {
      this.miningService.queryCurrentDifficulty().then(difficulty => {

        this.currentDifficulty = difficulty;

      });
    }
  }

  ngOnInit() {
    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      this._ngZone.run(() => {
        if (connected !== CONNECTED) {
          this.router.navigate(['/dashboard']);
        }
        else {
  
          this.blockchainService.getBlockchainInfo().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchainInfo => {
            this._ngZone.run(() => {
              this.blockchainInfo = blockchainInfo;
            });
          
          })
  
          try {
            this.blockchainService.selectedBlockchain.pipe(takeUntil(this.unsubscribe$)).subscribe(blockchain => {
  
              this._ngZone.run(() => {
                if (blockchain === NEURALIUM_BLOCKCHAIN && blockchain.menuConfig.showNeuralium) {
                  this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
    
                    this._ngZone.run(() => {
                      if (account && account !== NO_WALLET_ACCOUNT && account.isActive && account.status === WalletAccountStatus.Published) { // && account.status === WalletAccountStatus.Published
                        this.initialise(account);
                      }
                      else {
                        var text = this.translateService.instant('send.NoAccountOrAccountNotActiveOrNotPublished')
                        this.notificationService.showError(text);
                        this.router.navigate(["/"]);
                      }
                    });
                    
                  });
                }
                else {
                  var text = this.translateService.instant('send.BlockchainDoesNotAllowSend')
                  this.notificationService.showError(text);
                  this.router.navigate(["/"]);
                }
              });
              
            });
          } catch (error) {
            this.notificationService.showError(error, "Error");
          }
        }
      });
    });

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {

      if (event.eventType === EventTypes.NeuraliumMiningPrimeElected) {
        this.queryStatistics();
      }
      else if (event.eventType === EventTypes.MiningStarted) {
        this.queryStatistics();
        this.queryDifficulty();
      }
      else if (event.eventType === EventTypes.MiningEnded) {
        this.queryStatistics();
        this.queryDifficulty();
      }
      else if (event.eventType === EventTypes.ElectionContextCached) {
        this.currentDifficulty = event.message.difficulty;
      }
      else if (event.eventType === EventTypes.ElectionProcessingCompleted) {
        this.queryStatistics();
      }
    });

    if (this.miningService.isCurrentlyMining) {
      this.queryStatistics();
      this.queryDifficulty();
    }
  }

  refreshStatistics(event: Event) {
    this.queryStatistics();

    // so the panel does not open/close
    event.stopPropagation();
  }

  initialise(account: WalletAccount) {
    this.neuraliumService.getNeuraliumTotal().pipe(takeUntil(this.unsubscribe$)).subscribe(total => {
      
      this._ngZone.run(() => {
        this.neuraliumTotal = total
      });
    });

    this.currentAccount = account;

  }

  get hasCurrentAccount(): boolean {
    return this.currentAccount !== NO_WALLET_ACCOUNT;
  }

  neuraliumsSent(total: number) {
    this.translateService.get("send.SendingSuccess").subscribe(message => {
      this.notificationService.showSuccess(message);
    })
  }

  clearCachedCredentials(event){

    if(this.disableClearcache){
      return;
    }
    this.translateService.get("mining.ConfirmClearCachedCredentials").subscribe(confirmMessage => {

      const dialogParameters = new ConfirmDialogParameter();
      dialogParameters.message = confirmMessage;

      let dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '650px',
        data: dialogParameters
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult === DialogResult.Yes) {
          this.miningService.clearCachedCredentials().then(result => {

            let key:string = "CachedCredentialsFailed";

            if(result === true){
              key = "mining.CachedCredentialsCleared";
            }

            this.translateService.get(key).subscribe(clearedMessage => {
              alert(clearedMessage);
            });
          });

          // ensure we lock it our for a minute to prevent abuse
          this.disableClearcache = true;
          setTimeout(() => {
            this.disableClearcache = false;
          }, 1000 * 60);
        }
      });
    })

  }
}
