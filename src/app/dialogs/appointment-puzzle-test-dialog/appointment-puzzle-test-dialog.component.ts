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
import {readFile} from 'fs';


@Component({
  selector: 'app-appointment-puzzle-test-dialog',
  templateUrl: './appointment-puzzle-test-dialog.component.html',
  styleUrls: ['./appointment-puzzle-test-dialog.component.css']
})
export class AppointmentPuzzleTestDialogComponent implements OnInit, OnDestroy {

  constructor(
    private translateService: TranslateService,
    private notificationService: NotificationService,
    private serverConnection: ServerConnectionService,
    public dialogRef: MatDialogRef<AppointmentPuzzleTestDialogComponent>,
    private appointmentsService: AppointmentsService) {
  }

  @ViewChild('puzzleFrame') puzzleFrame: ElementRef;

  puzzle: string;
  puzzleActive:boolean = false;

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

  }

  ngOnDestroy(): void {

    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  load(){

    this.serverConnection.callGenerateTestPuzzle().then(puzzle => {

      this.puzzleActive = true;
      this.puzzle = puzzle;
      
    }).catch(error => {
     
    });

  }
  

  puzzleLoaded(){
    if(this.puzzleActive){
      try{
        this.puzzleFrame.nativeElement.contentWindow.setParameter(1);
        this.puzzleFrame.nativeElement.contentWindow.isCompletedEvent((value:boolean) => {
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


  complete() {
    this.dialogRef.close(DialogResult.Ok);
  }
}
