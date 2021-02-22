import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { BlockchainService } from '../..//service/blockchain.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { WalletAccount, NO_WALLET_ACCOUNT } from '../..//model/walletAccount';
import { WalletService } from '../..//service/wallet.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { DateTime, Duration } from 'luxon';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MatDialog } from '@angular/material/dialog';

import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { AppointmentsDialogComponent } from '../..//dialogs/appointments-dialog/appointments-dialog.component';
import { SMSDialogComponent } from '../..//dialogs/sms-dialog/sms-dialog.component';
import { VerifyAccountDialogComponent } from '../..//dialogs/verify-account-dialog/verify-account-dialog.component';
import { THSDialogComponent } from '../..//dialogs/THS-dialog/THS-dialog.component';

import { AppointmentPuzzleDialogComponent } from '../..//dialogs/appointment-puzzle-dialog/appointment-puzzle-dialog.component';
import {PeerConnectionDetails} from '../../model/peer-connection-details';
import { LogService } from '../../service/log.service';
import { AppointmentsService, PuzzleStatus, IPuzzleDetails } from '../..//service/appointment.service';

@Component({
  selector: 'app-blockchain-info',
  templateUrl: './blockchain-info.component.html',
  styleUrls: ['./blockchain-info.component.scss']
})
export class BlockchainInfoComponent implements OnInit, OnDestroy {


  constructor(
    public dialog: MatDialog,
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    private syncService: SyncStatusService,
    private serverConnection: ServerConnectionService,
    private appointmentsService: AppointmentsService,
    private _ngZone: NgZone,
    private logService: LogService) 
    { 
      this.JSON = JSON;
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
  blockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;
  account: WalletAccount = NO_WALLET_ACCOUNT;
  peerCount: number = 0;
  mobilePeerCount: number = 0;
  peerConnectionDetails: Array<PeerConnectionDetails> = [];
  peerConnectionDetailsShowConnected = true;
  peerConnectionDetailsShowFullNode = true;
  systemReleaseVersion = '';
  systemBlockchainVersion = '';
  JSON = JSON;

  displayedColumns: string[] = ['ip', 'connectable', 'connected', 'type', /*'state', */ 'score', 'latency (ms)', 'KB/s (in)', 'KB/s (out)','MB (in)', 'MB (out)'];

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

    this.serverConnection.serverConnection.pipe(takeUntil(this.unsubscribe$)).subscribe((connected) => {
      if (connected === true) {
        this.blockchainService.getBlockchainInfo().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchainInfo => {
          this._ngZone.run(() => {
            this.blockchainInfo = blockchainInfo;
          });

          
        });

        this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
          this._ngZone.run(() => {
            this.account = account;
          });

          
        });

        this.syncService.getPeerCount().pipe(takeUntil(this.unsubscribe$)).subscribe(count => {
          this._ngZone.run(() => {
            this.peerCount = count;
          });

          
        });

        this.syncService.getPeerConnectionDetails().pipe(takeUntil(this.unsubscribe$)).subscribe(details => {

          this._ngZone.run(() => {
            this.peerConnectionDetails = details;
          this.mobilePeerCount = details.filter(d => d.isConnected && d.type == "Mobile").length
          });

        });

        this.serverConnection.callQuerySystemVersion().then(version => {

          this._ngZone.run(() => {
            this.systemReleaseVersion = version.releaseVersion;
            this.systemBlockchainVersion = version.blockchainVersion;
          });

        });
      }
    });

  }

  filterPeerConnectionDetails(details: PeerConnectionDetails[]): PeerConnectionDetails[] {
    details.sort((a, b) => {
      return ((b.stats != null && a.stats != null)?(b.stats.metric - a.stats.metric):0) + 1e6 * ((+b.isConnected) - (+a.isConnected))
        + (+b.isConnectable) - (+a.isConnectable);
    }); // the unary + operator converts its operand into a number.
    return details.filter(details => (this.peerConnectionDetailsShowConnected ? details.isConnected : true) 
    && (this.peerConnectionDetailsShowFullNode ? details.type == "FullNode" : true)).slice(0, details.length > 10 ? 10 : details.length);
  }

  displayColumn(column: string, details: PeerConnectionDetails): string {

    function checkStats(details:PeerConnectionDetails, f:Function):string
    {
      if(details.stats == null)
        return "N/A"
        
      return f(details.stats);
    }
    
    switch(column)
    {
      case 'ip': 
      return (details.iPMode == 2? ('['+details.ip+']'):details.ip) + ":" + details.port;
      case 'connectable':   return details.isConnectable.toString();
      case 'connected':     return details.isConnected.toString();
      case 'latency (ms)':  return checkStats(details, stats => (1000 * stats.latency).toFixed(2)); break;
      case 'score':         return checkStats(details, stats =>  stats.metric.toExponential(3)); break;
      case 'KB/s (in)':     return checkStats(details, stats =>  stats.inputKBps.toFixed(3)); break;
      case 'KB/s (out)':    return checkStats(details, stats =>  stats.outputKBps.toFixed(3)); break;
      case 'MB (in)':       return checkStats(details, stats =>  stats.inputMB.toFixed(3)); break;
      case 'MB (out)':      return checkStats(details, stats =>  stats.outputMB.toFixed(3)); break;
      default: return details[column];
    }
  }
  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  test() {
    const dialogRef = this.dialog.open(AppointmentsDialogComponent, {
      width: '700px'
    });
  }

  test2() {
    const dialogRef = this.dialog.open(PublishAccountDialogComponent, {
      width: '700px'
    });
  }

  test3() {
    const dialogRef = this.dialog.open(THSDialogComponent, {
      width: '950px'
    });
  }

  test4() {
    const dialogRef =  this.dialog.open(VerifyAccountDialogComponent, {
      width: '700px'
    });
  }
}
