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
import * as fs from 'fs';


@Component({
  selector: 'app-appointment-puzzle-test-dialog',
  templateUrl: './appointment-puzzle-test-dialog.component.html',
  styleUrls: ['./appointment-puzzle-test-dialog.component.css']
})
export class AppointmentPuzzleTestDialogComponent implements OnInit, OnDestroy {

  constructor(
    private translateService: TranslateService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<AppointmentPuzzleTestDialogComponent>,
    private appointmentsService: AppointmentsService) {
  }

  @ViewChild('puzzleFrame') puzzleFrame: ElementRef;
  step: number = 0;
  success: boolean = false;
  puzzleDetails: IPuzzleDetails;
  puzzle: string;
  instructions: string;
  puzzleIndex: number = 0;
  puzzleAnswer:number = 0;
  puzzleAnswerStack:Array<number> = [];
  index : number = 0;

  private currentRemainingTimeVal: string;
  remainingTimePercent: number = 100;
  private timer: NodeJS.Timeout;
  puzzleStartTime:  DateTime;
  puzzleEndTime:  DateTime;
  puzzleDuration: Duration;
  puzzleActive:boolean = false;

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

    this.puzzleAnswer = 3;
  }

  ngOnDestroy(): void {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  load(){

    let ff = this;

    fs.readFile( '~/demo/puzzle/output.html', function (err, data) {
      if (err) {
        throw err; 
      }
      ff.puzzleActive = true;
      ff.puzzle = data.toString();
      ff.instructions = 'this is <b>the</b> instructions.<br /><ul class="instructionsUL"><li>entry one</li><li>entry two</li></ul>';
      
    });
  }
  

  puzzleLoaded(){
    if(this.puzzleActive){
      try{
        this.puzzleFrame.nativeElement.contentWindow.setParameter(this.puzzleAnswer);
        this.puzzleFrame.nativeElement.contentWindow.isCompletedEvent((value:boolean) => {
          this.completed = value;
        });
      }
      catch(error){
        // try again until the html is loaded and it works
        setTimeout(() => {
          this.puzzleLoaded();
        }, 50);
      }
    }
  }

  completed:boolean = false;
  get isPuzzleCompleted(): string {
    return this.completed===true?'yes':'no';
  }

  complete() {

    this.puzzleAnswer = this.puzzleFrame.nativeElement.contentWindow.getParameter();

    
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



  get total(): number {
    if(this.puzzleDetails && this.puzzleDetails.puzzles){
      return this.puzzleDetails.puzzles.length;
    }
    return 0;
  }

  
  cancel() {
    this.dialogRef.close(DialogResult.Cancel);
  }
}
