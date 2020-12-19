import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MiningService } from '../..//service/mining.service';
import { ConfigService } from '../..//service/config.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from './../../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { IpMode } from '../../model/enums';
import { NotificationService } from '../..//service/notification.service';
import { WalletService } from '../..//service/wallet.service';
import { WalletAccount, WalletAccountType, WalletAccountVerification } from '../..//model/walletAccount';
import { MatDialog } from '@angular/material/dialog';
import { VerifyAccountDialogComponent } from '../..//dialogs/verify-account-dialog/verify-account-dialog.component';
import { DialogResult } from '../..//config/dialog-result';


interface Tiers {
  value: string;
  name: string;
}


@Component({
  selector: 'app-mining',
  templateUrl: './mining.component.html',
  styleUrls: ['./mining.component.scss']
})
export class MiningComponent implements OnInit, OnDestroy {

  delegateAccount: string;
  isMining: boolean;
  isConnectable: boolean;
  disableMiningButton = false;
  selectedStrategy: string;
  sortingMethod = 'OlderToNewer';
  tipSortingMethod = 'MostToLess';
  timeSortingMethod = 'NewerToOlder';
  sizeSortingMethod = 'LargerToSmaller';
  connectibleText = '';
  miningportalert = '';
  miningTierText = '';
  ipmodeText = '';
  currentAccount: WalletAccount;
  hideTierSelector:boolean = true;
  hideConnectable:boolean = true;
  hideMiningProtocol:boolean = true;

  constructor(public miningService: MiningService,
    private configService: ConfigService,
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private _ngZone: NgZone,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    public dialog: MatDialog) {

      this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
        if (connected === CONNECTED) {
            this.getMiningPortConnectableFromServer();
        }
       });
    }


    
    get showVerify(): boolean {
      if(!this.currentAccount){
        return false;
      }
      return this.miningService.selectedTier === 3 && this.currentAccount.verification === WalletAccountVerification.None;
    }
    private unsubscribe$ = new Subject<void>();


    ngOnDestroy(): void {
         this.unsubscribe$.next();
         this.unsubscribe$.complete();
       }
   
  ngOnInit() {

  
    this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      this._ngZone.run(() => {
        this.currentAccount = account;

      if(account.accountType === WalletAccountType.User){
        this.hideTierSelector = true;
        this.hideConnectable = true;
        this.hideMiningProtocol = true;
        this.miningService.SelectedTier = 3;
      }
      else{
        this.hideTierSelector = true;
        this.hideConnectable = false;
        this.hideMiningProtocol = false;
        this.miningService.SelectedTier = 1;
      }
      });
      
    });

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {

      this._ngZone.run(() => {
        if (event.eventType === EventTypes.MiningStarted) {
          this.miningService.updateChainStatus();
          this.queryIpMode();
        }
        if (event.eventType === EventTypes.MiningEnded) {
          this.miningService.updateChainStatus();
          this.ipmodeText = '';
        }
        if (event.eventType === EventTypes.Error) {
          this.notificationService.showError(event.message.message, 'Start Mining');
          this.disableMiningButton = false;
        }
      });

      
    });

    this.miningService.isMining.pipe(takeUntil(this.unsubscribe$)).subscribe(mining => {
      this._ngZone.run(() => {
        this.isMining = mining;
      this.disableMiningButton = false;
      });
    });

    this.miningService.isConnectable.pipe(takeUntil(this.unsubscribe$)).subscribe(connectable => {
      this._ngZone.run(() => {
        this.IsConnectible = connectable;
      });

     
    });

    this.miningService.miningTier.pipe(takeUntil(this.unsubscribe$)).subscribe(miningTier => {
      this._ngZone.run(() => {
        this.miningTierText = '';


        let tierKey = 'mining.NotMining';
        if(this.isMining){
          if(miningTier === 1){
            tierKey = 'mining.FirstTier';
          }
          else if(miningTier === 2){
            tierKey = 'mining.SecondTier';
          }
          else if (miningTier === 3){
            tierKey = 'mining.ThirdTier';
          }
          else if (miningTier === 4){
            tierKey = 'mining.Fourth';
          }
        }
        
        this.translateService.get(tierKey).subscribe(text => {
          this.miningTierText = text;
        });
      });
    });

    this.delegateAccount = this.configService.delegateAccount;

    if (this.miningService.isCurrentlyMining) {
      this.queryIpMode();
    }
  }

  queryIpMode(){
    // wait a few seconds before we query. there is a delay between the event mining and the protocol known
    setTimeout(() => {
      this.miningService.callQueryMiningIPMode().then(ipmode => {
        const mode:number = ipmode;
        this.ipmodeText = '';
        if(ipmode === IpMode.IPv4){
  
          this.ipmodeText = 'Ipv4';
        }
        if(ipmode === IpMode.IPv6){
          this.ipmodeText = 'Ipv6';
        }
        if(ipmode === IpMode.Both){
          this.ipmodeText = 'Ipv4 & Ipv6';
        }
      });

    }, 3000);
    
  }
  private getMiningPortConnectableFromServer() {
    this.serverConnectionService.callQueryMiningPortConnectable().then(connectable => {
      this.IsConnectible = connectable;
    });
  }

  get IsConnectible(): boolean {
    return this.isConnectable;
  }
  set IsConnectible(value: boolean) {
      this.isConnectable = value;

      const port = AppConfig.p2pPort;

      this.translateService.get((this.isConnectable ? 'mining.PortConnectable' : 'mining.PortNotConnectable')).subscribe(text => {
        this.connectibleText = text.replace('33888', port);
      });

    
      // if (this.isConnectable === false) {
      //   this.translateService.get('mining.Miningportalert').subscribe(text => {
      //     this.miningportalert = text.replace('33888', port);
      //   });
      // } else {
      //   this.miningportalert = '';
      // }
  }

  toggleMining() {
    if (this.isMining === true) {
      this.stopMining();
    } else {
      this.startMining();
    }
  }

  startMining() {
    if(this.isConnectable === false && (this.miningService.SelectedTier === 1 || this.miningService.SelectedTier === 2)){
      //TODO: add this to mainnet
      // this.translateService.get('mining.PortNotConnectableCantMine').subscribe(message => {
      //   alert(message);
      // });
      
      // return;
    }
    this.disableMiningButton = true;
    this.miningService.startMining(this.miningService.SelectedTier);
  }

  stopMining() {
    this.disableMiningButton = false;
    this.miningService.stopMining();
  }

  save() {
    this.configService.delegateAccount = this.delegateAccount;
    this.configService.saveSettings();
  }

  showSortingOrder(): boolean {

    return this.selectedStrategy === 'CreationTimeStrategy' || this.selectedStrategy === 'TransactionSizeStrategy';

  }

  showTimeSortingOrder(): boolean {

    return this.selectedStrategy === 'HighestTipStrategy';

  }

  showTipSortingOrder(): boolean {

    return this.selectedStrategy === 'HighestTipStrategy';

  }

  showSizeSortingOrder(): boolean {

    return this.selectedStrategy === 'TransactionSizeStrategy';

  }

  verifyDialogOpen:boolean = false;
  verifyAccount(event){
    setTimeout(() => {
      const dialogRef = this.dialog.open(VerifyAccountDialogComponent, {
        width: '850px'
      });
      dialogRef.afterClosed().subscribe(dialogResult => {
        this.verifyDialogOpen = false;
        if (dialogResult === DialogResult.Cancel) {
          
        }
        else if (dialogResult === DialogResult.WalletCreated) {
          // setTimeout(() => {
          //   this.walletService.refreshWallet(this.blockchainService.getCurrentBlockchain().id);
          // }, 100);
        }
        else if (dialogResult !== "") {
         
        }
      });
    });
  }
}
