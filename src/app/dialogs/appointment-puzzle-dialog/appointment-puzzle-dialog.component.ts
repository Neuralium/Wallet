import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';

import { NotificationService } from '../..//service/notification.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { AppointmentsService, PuzzleStatus, IPuzzleDetails } from '../..//service/appointment.service';

import { WalletService } from '../..//service/wallet.service';
import { WalletCreation, Wallet } from '../..//model/wallet';
import { SyncProcess, NO_SYNC, ProcessType } from '../..//model/syncProcess';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogResult } from '../..//config/dialog-result';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../..//model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { DateTime, Duration } from 'luxon';


@Component({
  selector: 'app-appointment-puzzle-dialog',
  templateUrl: './appointment-puzzle-dialog.component.html',
  styleUrls: ['./appointment-puzzle-dialog.component.css']
})
export class AppointmentPuzzleDialogComponent implements OnInit, OnDestroy {

  constructor(
    private translateService: TranslateService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<AppointmentPuzzleDialogComponent>,
    private appointmentsService: AppointmentsService) {
  }

  private completeTimer: NodeJS.Timeout;
  @ViewChild('puzzleFrame') puzzleFrame: ElementRef;
  step: number = 0;
  success: boolean = false;
  puzzleDetails: IPuzzleDetails;
  puzzle: string;
  instructions: string;
  puzzleIndex: number = 0;
  puzzleAnswer: number = 0;
  puzzleAnswerStack: Array<number> = [];

  private currentRemainingTimeVal: string;
  remainingTimePercent: number = 100;
  private timer: NodeJS.Timeout;
  puzzleStartTime:  DateTime;
  puzzleEndTime:  DateTime;
  puzzleDuration: Duration;
  puzzleActive: boolean = false;
  nextDisabled: boolean = true;
  puzzleSet : boolean = false;

  private unsubscribe$ = new Subject<void>();
  callback: (data?: PuzzleStatus) => void;

  ngOnInit() {
    this.callback = (n) => this.puzzleStatusChange(n);
    this.appointmentsService.onPuzzleStatusChange.add(this.callback);
    this.checkState();
  }

  ngOnDestroy(): void {

    this.appointmentsService.onPuzzleStatusChange.remove(this.callback);

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  puzzleStatusChange(status: PuzzleStatus) {

    this.checkState();
  }

  checkState() {
    if (this.appointmentsService.puzzleStatus === PuzzleStatus.Preparation) {

      this.step = 1;
    } else if (this.appointmentsService.puzzleStatus === PuzzleStatus.Execution) {

      if (this.appointmentsService.isPuzzleDetailsSet) {

        this.puzzleDetails = this.appointmentsService.puzzleDetails.value;
        this.puzzleAnswer = this.puzzleDetails.secretCode;
        this.puzzleActive = true;
        this.puzzleSet = false;
        this.puzzle = this.puzzleDetails.puzzles[this.puzzleIndex];
        this.instructions = this.puzzleDetails.instructions[this.puzzleIndex];
        this.nextDisabled = true;
        if (!this.puzzleStartTime) {
          this.puzzleStartTime = DateTime.local();
          const seconds = this.appointmentsService.appointmentDetails.AppointmentWindow;
          this.puzzleDuration = Duration.fromObject({ seconds: seconds });
          this.puzzleEndTime = this.puzzleStartTime.plus(this.puzzleDuration);
          this.updateRemainingTime();
        }
      } else {

      }

      this.step = 2;

    } else if (this.appointmentsService.puzzleStatus === PuzzleStatus.PostProcess) {

      this.step = 3;
    } else {

      this.dialogRef.close();
    }
  }

  puzzleLoaded() {
    if (this.puzzleActive && this.puzzleSet === false) {
      try {
        this.puzzleFrame.nativeElement.contentWindow.setParameter(this.puzzleAnswer);

        this.puzzleFrame.nativeElement.contentWindow.isCompletedEvent((completed: boolean) => {
          this.nextDisabled = !completed;

          if(!this.nextDisabled){

            // we put a timer in case the user does not see the button, then after 10 seconds, we press it for them
            this.completeTimer = setTimeout(() => {
            
              this.complete();
            }, 10 * 1000);
          }
        });

        this.puzzleSet = true;
      } catch (error) {
        // try again until the html is loaded and it works
        setTimeout(() => {
          this.puzzleLoaded();
        }, 50);
      }
    }
  }

  complete() {
   
    if(this.completeTimer){
      clearTimeout(this.completeTimer);
      this.completeTimer = null;
    }

    this.puzzleAnswer = this.puzzleFrame.nativeElement.contentWindow.getParameter();

    this.puzzleActive = false;
    this.puzzle = '';
    this.instructions = '';
    this.puzzleAnswerStack.push(this.puzzleAnswer);

    this.puzzleIndex += 1;
    if (!this.isCompleted) {

      setTimeout(() => {
        this.puzzleActive = true;
        this.nextDisabled = true;
        this.puzzle = this.puzzleDetails.puzzles[this.puzzleIndex];
        this.instructions = this.puzzleDetails.instructions[this.puzzleIndex];
        this.puzzleSet = false;
      });
    } else {
      //thats it, we have our answer
      this.appointmentsService.setPuzzleAnswers(this.puzzleAnswerStack);
    }
  }

  get currentRemainingWaitTime(): string {
    return this.appointmentsService.currentRemainingTime;
  }

  get currentRemainingPuzzleTime(): string {
    return this.currentRemainingTimeVal;
  }

  get puzzleReady(): boolean {
    if (this.puzzleDetails) {
      return true;
    }
    return false;
  }

  get isCompleted(): boolean {
    return this.puzzleIndex === this.total;
  }


  get lastPuzzle(): boolean {
    return this.puzzleIndex >= this.total - 1;
  }

  get index(): number {
    return this.puzzleIndex + 1;
  }

  get total(): number {
    if (this.puzzleDetails && this.puzzleDetails.puzzles) {
      return this.puzzleDetails.puzzles.length;
    }
    return 0;
  }


  cancel() {
    this.dialogRef.close(DialogResult.Cancel);
  }

  updatePuzzleTimeout() {

    if (!this.puzzleReady || this.isCompleted) {
      return null;
    }


    const now = DateTime.local();
    let delta: Duration;

    const totalSeconds = this.puzzleDuration.seconds;
    let deltaSeconds = 0;

    if (this.puzzleEndTime < now) {
      delta = Duration.fromObject({});
    }
    else{
      delta = this.puzzleEndTime.diff(now);
      deltaSeconds = delta.milliseconds / 1000;
    }

    this.currentRemainingTimeVal = delta.toFormat('mm:ss');

    this.remainingTimePercent = deltaSeconds / totalSeconds * 100;
    if (deltaSeconds > 0) {
      this.updateRemainingTime();
    }
  }

  updateRemainingTime() {

    if ((!this.puzzleReady || this.isCompleted) ) {
      if(this.timer){
        clearTimeout(this.timer);
        this.timer  = null;
      }
      return null;
    }

    if(!this.timer ){
      this.timer = setTimeout(() => {

        this.timer = null;
        this.updatePuzzleTimeout();
      }, 1000);
    }
  }
}
