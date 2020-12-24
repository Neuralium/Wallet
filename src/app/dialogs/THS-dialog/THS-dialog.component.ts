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
  index:number = 0;
}

class THSBegin {
  difficulty: number = 1;
  targetNonce: number = 1;

  startingNonce: number = 1;
  startingTotalNonce: number = 1;
  startingRound : number = 1;

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
  nonce: number = 1;
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
    @Optional() @Inject(MAT_DIALOG_DATA) public nonce: number) {

    if (nonce && nonce !== 0) {
      this.thsIteration.nonce = nonce;
      this.totalNonce = this.thsIteration.nonce;
    }

  }

  pageSize = 5;
  totalMessageCount = 0;
  pageSizeOptions: number[] = [5];
  sliceStart = 0;
  sliceEnd: number = this.pageSize;

  displayedColumns: string[] = ['nonce', 'solution'];

  totalNonce: number = 0;
  totalPreviousRounds :number  = 0;
  workingSolutions: Array<Solution> = [];
  thsBegin: THSBegin = new THSBegin();
  thsRound: THSRound = new THSRound();
  thsIteration: THSIteration = new THSIteration();
  thsSolution: THSSolution = new THSSolution();
  currentRound: number = 1;
  currentNonce:number = 1;
  targetNonce:number = 1;
  targetTotalDuration:Duration;
  estimatedIterationTime:Duration;
  estimatedRemainingTime:Duration;
  benchmarkSpeedRatio:number = 1;

  thsBeginSet: BehaviorSubject<THSBegin | null> = new BehaviorSubject<THSBegin | null>(null);
  thsRoundSet: BehaviorSubject<THSRound | null> = new BehaviorSubject<THSRound | null>(null);
  thsIterationSet: BehaviorSubject<THSIteration | null> = new BehaviorSubject<THSIteration | null>(null);
  thsSolutionSet: BehaviorSubject<THSSolution | null> = new BehaviorSubject<THSSolution | null>(null);

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      
      if (!event.isNeuralium) {
        return;
      }

      switch (event.eventType) {
        case EventTypes.THSBegin:
          this._ngZone.run(() => {
            this.thsBegin = new THSBegin();

          this.thsBegin.difficulty = event.message.difficulty;
          this.thsBegin.targetNonce = event.message.targetNonce;


          this.thsBegin.startingNonce = event.message.startingNonce;
          this.thsBegin.startingTotalNonce = event.message.startingTotalNonce;
          this.thsBegin.startingRound = event.message.startingRound;

          this.thsBegin.solutions = event.message.solutions;
          this.thsBegin.nonces = event.message.nonces;

          for(let i = 0; i < this.thsBegin.solutions.length; i++){

            const entry: Solution = new Solution();
            entry.nonce = this.thsBegin.nonces[i];
            entry.solution = this.thsBegin.solutions[i];
            this.workingSolutions.push(entry);
          }

          this.targetNonce = this.thsBegin.targetNonce;
          
          this.currentNonce = this.thsBegin.startingNonce;
          this.totalPreviousRounds = this.thsBegin.startingTotalNonce - this.currentNonce;
          this.totalNonce = this.thsBegin.startingTotalNonce;
          this.currentRound = this.thsBegin.startingRound;

          this.thsBegin.targetTotalDuration = Duration.fromObject({seconds : event.message.targetTotalDuration});
          this.targetTotalDuration = Duration.fromObject({seconds : event.message.targetTotalDuration});;
          this.thsBegin.estimatedIterationTime = Duration.fromObject({seconds : event.message.estimatedIterationTime});
          this.estimatedIterationTime = Duration.fromObject({seconds : event.message.estimatedIterationTime});
          this.thsBegin.estimatedRemainingTime = Duration.fromObject({seconds : event.message.estimatedRemainingTime});
          this.estimatedRemainingTime = Duration.fromObject({seconds : event.message.estimatedRemainingTime});


          this.thsBeginSet.next(this.thsBegin);
          });

          
          break;
        case EventTypes.THSRound:
          this._ngZone.run(() => {
            this.thsRound = <THSRound>event.message;
          this.currentRound += 1;
          this.currentNonce = 1;

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
          this.thsIteration.nonce = event.message.nonce;
          this.currentNonce = this.thsIteration.nonce;
          this.totalNonce = this.totalPreviousRounds + this.thsIteration.nonce;
          this.benchmarkSpeedRatio = event.message.benchmarkSpeedRatio;

          this.thsIteration.elapsed = Duration.fromObject({seconds : event.message.elapsed});
          this.thsIteration.estimatedIterationTime = Duration.fromObject({seconds : event.message.estimatedIterationTime});
          this.estimatedIterationTime = Duration.fromObject({seconds : event.message.estimatedIterationTime});
          this.thsIteration.estimatedRemainingTime = Duration.fromObject({seconds : event.message.estimatedRemainingTime});
          this.estimatedRemainingTime = Duration.fromObject({seconds : event.message.estimatedRemainingTime});
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
