import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BlockchainService } from '../..//service/blockchain.service';
import { WalletService } from '../..//service/wallet.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { TranslateService } from '@ngx-translate/core';
import { AppointmentPuzzleTestDialogComponent } from '../..//dialogs/appointment-puzzle-test-dialog/appointment-puzzle-test-dialog.component';



import { TcpTestResult } from '../..//model/enums';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime, Duration } from 'luxon';

@Component({
  selector: 'app-tools-utilities',
  templateUrl: './utilities.component.html',
  styleUrls: ['./utilities.component.scss']
})
export class UtilitiesComponent implements OnInit, OnDestroy {


  testingPort: boolean = false;
  selectedPort: number = 1;

  private timer: NodeJS.Timeout;
  testPerformed: boolean = false;
  callback: boolean = false;
  resultConnected: boolean = false;
  resultCallbackAttempted: boolean = false;
  resultCallbackSucceeded: boolean = false;
  seconds: number = 60 * 3;
  remainingTimePercent: number = 0;
  remainingSeconds: number = 0;

  constructor(
    private serverConnection: ServerConnectionService,
    private translateService: TranslateService,
    private blockchainService: BlockchainService,
    private walletService: WalletService,
    public dialog: MatDialog,
    private _ngZone: NgZone) { }

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  testP2pPort() {

    if (this.testingPort === false) {
      this.testingPort = true;
      this.testPerformed = false;

      this.serverConnection.callTestP2pPort(this.selectedPort, this.callback).then(result => {

        this.resultConnected = (result & TcpTestResult.Connected) !== 0;
        this.resultCallbackAttempted = (result & TcpTestResult.CallbackAttempted) !== 0;
        this.resultCallbackSucceeded = (result & TcpTestResult.CallbackSucceeded) !== 0;

        if (this.resultConnected) {
          this.testPerformed = true;
          // ensure we lock it our for a minute to prevent abuse
          if (this.timer) {
            clearTimeout(this.timer);
          }

          this.nextTry = DateTime.local().plus(Duration.fromMillis(1000 * this.seconds));
          this.updateRemainingTime();
        }
        else {
          this.testingPort = false;
        }

      }).catch(error => {
        this.testingPort = false;
      });
    }
  }

  rescueSuccess : boolean = false;
  rescueFailed : boolean = false;

  rescueWallet(){
    this.rescueSuccess = false;
    this.rescueFailed = false;

    this.serverConnection.callAttemptWalletRescue(this.blockchainService.currentBlockchain.id).then(result => {

      if(result){
        this.rescueSuccess = true;
      }
      else{
        this.rescueFailed = true;
      }
    });
  }

  resetWalletIndex(){

    this.walletService.resetWalletIndex().then(result => {

      alert(result);
    });
  }

  testAppointmentPuzzle(){
    const dialogRef = this.dialog.open(AppointmentPuzzleTestDialogComponent, {
      width: '600px',
      height: '600px'
    });
  }

  nextTry: DateTime;

  updateRemainingTime() {

    this.timer = setTimeout(() => {
      this._ngZone.run(() => {

        const now = DateTime.local();

        if (!this.nextTry || this.nextTry < now) {
          this.nextTry = null;
          this.testingPort = false;
          clearTimeout(this.timer);
        }

        const delta = this.nextTry.diff(now).shiftTo('seconds');

        this.remainingSeconds = Math.trunc(delta.seconds);
        this.remainingTimePercent = delta.seconds / this.seconds * 100;

        if (this.remainingTimePercent === 0) {
          clearTimeout(this.timer);
        }
        else {
          this.updateRemainingTime();
        }
      });
    }, 1000);
  }
}
