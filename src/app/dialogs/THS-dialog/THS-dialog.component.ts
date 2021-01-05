import { Component, OnInit, ChangeDetectorRef, OnDestroy, Optional, Inject, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { NotificationService } from '../../service/notification.service';
import { SyncStatusService } from '../../service/sync-status.service';
import { BlockchainService } from '../../service/blockchain.service';
import { ServerConnectionService } from '../../service/server-connection.service';
import { WalletService } from '../../service/wallet.service';
import { WalletCreation, Wallet } from '../../model/wallet';
import { SyncProcess, NO_SYNC, ProcessType } from '../../model/syncProcess';
import { DialogResult } from '../../config/dialog-result';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../../model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { DateTime, Duration } from 'luxon';
import { MatTableDataSource } from '@angular/material/table';


class Solution {
  nonce: number = 0;
  solution: number = 0;
  index: number = 0;
}

class THSBegin {
  difficulty: number = 1;
  targetNonce: number = 1;

  startingNonce: number = 1;
  startingTotalNonce: number = 1;
  startingRound: number = 1;

  targetTotalDuration: Duration;
  estimatedIterationTime: Duration;
  estimatedRemainingTime: Duration;
  nonces: Array<number> = [];
  solutions: Array<number> = [];
}
class THSRound {
  round: number = 1;
  totalNonce: number = 1;
  lastNonce: number = 0;
  lastSolution: number = 0;
}

class THSIteration {

  chainType: number = 0;
  nonces: Array<number> = [];
  elapsed: Duration;
  estimatedIterationTime: Duration;
  estimatedRemainingTime: Duration;
  benchmarkSpeedRatio: number;
}


class THSSolution {
  chainType: number = 0;
  nonces: Array<number> = [];
  solutions: Array<number> = [];
  difficulty: number = 1;
}


@Component({
  selector: 'app-ths-dialog',
  templateUrl: './THS-dialog.component.html',
  styleUrls: ['./THS-dialog.component.css']
})
export class THSDialogComponent implements OnInit, OnDestroy {


  constructor(
    private translateService: TranslateService,
    private _ngZone: NgZone,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private syncStatusService: SyncStatusService,
    public dialogRef: MatDialogRef<THSDialogComponent>,
    private changeDetector: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) public nonce: number, @Inject(MAT_DIALOG_DATA) public begining: any) {

    if (nonce && nonce !== 0) {
      this.thsIteration.nonces = [nonce];
      this.totalNonce = this.thsIteration.nonces[0];
    }

    if (begining) {
      this.setBegining(begining);
    }
  }

  pageSize = 5;
  totalMessageCount = 0;
  pageSizeOptions: number[] = [5];
  sliceStart = 0;
  sliceEnd: number = this.pageSize;

  displayedColumns: string[] = ['nonce', 'solution'];

  totalNonce: number = 0;
  totalPreviousRounds: number = 0;
  workingSolutions: Array<Solution> = [];
  thsBegin: THSBegin = new THSBegin();
  thsRound: THSRound = new THSRound();
  thsIteration: THSIteration = new THSIteration();
  thsSolution: THSSolution = new THSSolution();
  currentRound: number = 1;
  currentNonces: Array<number> = [];
  currentNoncesStr:string = '[]';
  singleNonce:boolean = false;
  targetNonce: number = 1;
  targetTotalDuration: Duration;
  estimatedIterationTime: Duration;
  estimatedRemainingTime: Duration;
  benchmarkSpeedRatio: number = 1;

  thsBeginSet: BehaviorSubject<THSBegin | null> = new BehaviorSubject<THSBegin | null>(null);
  thsRoundSet: BehaviorSubject<THSRound | null> = new BehaviorSubject<THSRound | null>(null);
  thsIterationSet: BehaviorSubject<THSIteration | null> = new BehaviorSubject<THSIteration | null>(null);
  thsSolutionSet: BehaviorSubject<THSSolution | null> = new BehaviorSubject<THSSolution | null>(null);

  private unsubscribe$ = new Subject<void>();

  beginSet: boolean = false;
  public setBegining(message: any) {
    if (!this.beginSet) {
      this.beginSet = true;
      this.thsBegin = new THSBegin();

      this.thsBegin.difficulty = message.difficulty;
      this.thsBegin.targetNonce = message.targetNonce;


      this.thsBegin.startingNonce = message.startingNonce;
      this.thsBegin.startingTotalNonce = message.startingTotalNonce;
      this.thsBegin.startingRound = message.startingRound;

      this.thsBegin.solutions = message.solutions;
      this.thsBegin.nonces = message.nonces;

      for (let i = 0; i < this.thsBegin.solutions.length; i++) {

        const entry: Solution = new Solution();
        entry.nonce = this.thsBegin.nonces[i];
        entry.solution = this.thsBegin.solutions[i];
        this.workingSolutions.push(entry);
      }

      this.targetNonce = this.thsBegin.targetNonce;

      this.currentNonces = [this.thsBegin.startingNonce];
      this.joinNonces();
      this.totalPreviousRounds = this.thsBegin.startingTotalNonce - this.thsBegin.startingNonce;
      this.totalNonce = this.thsBegin.startingTotalNonce;
      this.currentRound = this.thsBegin.startingRound;

      this.thsBegin.targetTotalDuration = Duration.fromObject({ seconds: message.targetTotalDuration });
      this.targetTotalDuration = Duration.fromObject({ seconds: message.targetTotalDuration });;
      this.thsBegin.estimatedIterationTime = Duration.fromObject({ seconds: message.estimatedIterationTime });
      this.estimatedIterationTime = Duration.fromObject({ seconds: message.estimatedIterationTime });
      this.thsBegin.estimatedRemainingTime = Duration.fromObject({ seconds: message.estimatedRemainingTime });
      this.estimatedRemainingTime = Duration.fromObject({ seconds: message.estimatedRemainingTime });


      this.thsBeginSet.next(this.thsBegin);
    }
  }

  get noNonce(){
    return this.thsIteration.nonces.length === 0;
  }

  joinNonces(){

    const filteredNonces = this.currentNonces.filter(nonce => {
      return nonce != 0;
    });
    this.singleNonce = filteredNonces.length <= 1;
  
   
    if(this.singleNonce){
      
      if(filteredNonces.length === 0){
        return '';
      }
      this.currentNoncesStr = filteredNonces[0].toString();
    }
    else{
      this.currentNoncesStr = '[' + filteredNonces.join() + ']';
    }
  }
  ngOnInit() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {

      if (!event.isNeuralium) {
        return;
      }

      switch (event.eventType) {
        case EventTypes.THSBegin:
          this._ngZone.run(() => {
            this.setBegining(event.message);

          });


          break;
        case EventTypes.THSRound:
          this._ngZone.run(() => {
            this.thsRound = <THSRound>event.message;
            this.currentRound += 1;
            this.currentNonces = [1];
            this.joinNonces();

            const entry: Solution = new Solution();
            entry.nonce = this.thsRound.lastNonce;
            entry.solution = this.thsRound.lastSolution;
            this.totalNonce = this.thsRound.totalNonce;
            this.totalPreviousRounds = this.totalNonce;

            this.workingSolutions.push(entry);
            this.thsRoundSet.next(this.thsRound);
          });

          break;
        case EventTypes.THSIteration:
          this._ngZone.run(() => {
            this.thsIteration = new THSIteration();
            this.thsIteration.nonces = event.message.nonces;
            this.currentNonces = this.thsIteration.nonces;
            this.joinNonces();
            this.totalNonce = this.totalPreviousRounds + this.thsIteration.nonces[0];
            this.benchmarkSpeedRatio = +event.message.benchmarkSpeedRatio.toFixed(5);

            this.thsIteration.elapsed = Duration.fromObject({ seconds: event.message.elapsed });
            this.thsIteration.estimatedIterationTime = Duration.fromObject({ seconds: event.message.estimatedIterationTime });
            this.estimatedIterationTime = Duration.fromObject({ seconds: event.message.estimatedIterationTime });
            this.thsIteration.estimatedRemainingTime = Duration.fromObject({ seconds: event.message.estimatedRemainingTime });
            this.estimatedRemainingTime = Duration.fromObject({ seconds: event.message.estimatedRemainingTime });
            this.thsIteration.benchmarkSpeedRatio = event.message.benchmarkSpeedRatio;

            this.thsIterationSet.next(this.thsIteration);
          });


          break;
        case EventTypes.THSSolution:
          this._ngZone.run(() => {
            this.thsSolution = <THSSolution>event.message;
            this.thsSolutionSet.next(this.thsSolution);
            this.startTimer();
          });


          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get solutionFound(): boolean {
    if (this.thsSolution && this.thsSolution.solutions.length !== 0) {
      return true;
    }
    return false;
  }


  setPage(event) {

    this.sliceStart = event.pageIndex * event.pageSize;
    this.sliceEnd = this.sliceStart + event.pageSize;
  }

  startTimer() {
    setTimeout(() => {
      this.dialogRef.close(DialogResult.Ok);
    }, 5 * 1000);
  }

  cancel() {
    this.dialogRef.close(DialogResult.Ok);
  }
}
