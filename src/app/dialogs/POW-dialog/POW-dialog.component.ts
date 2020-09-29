import { Component, OnInit, ChangeDetectorRef, OnDestroy, Optional, Inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { NotificationService } from '../..//service/notification.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletService } from '../..//service/wallet.service';
import { WalletCreation, Wallet } from '../..//model/wallet';
import { SyncProcess, NO_SYNC, ProcessType } from '../..//model/syncProcess';
import { DialogResult } from '../..//config/dialog-result';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../..//model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { BehaviorSubject, Observable } from 'rxjs';


class POWIteration {

  chainType: number = 0;
  nonce: number = 0;
  difficulty: number = 1;
}

class POWSolution {
  chainType: number = 0;
  nonce: number = 0;
  solution: number = 0;
  difficulty: number = 1;
}


@Component({
  selector: 'app-pow-dialog',
  templateUrl: './POW-dialog.component.html',
  styleUrls: ['./POW-dialog.component.css']
})
export class POWDialogComponent implements OnInit, OnDestroy {


  constructor(
    private translateService: TranslateService,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private syncStatusService: SyncStatusService,
    public dialogRef: MatDialogRef<POWDialogComponent>,
    private changeDetector: ChangeDetectorRef,
    @Optional() @Inject(MAT_DIALOG_DATA) public nonce: number) {

      if(nonce && nonce !== 0){
        this.powIteration.nonce = nonce;
      }
  }

  powIteration:POWIteration = new POWIteration();
  powSolution:POWSolution = new POWSolution();

  powIterationSet: BehaviorSubject<POWIteration | null> = new BehaviorSubject<POWIteration | null>(null);
  powSolutionSet: BehaviorSubject<POWSolution | null> = new BehaviorSubject<POWSolution | null>(null);

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      if (!event.isNeuralium) {
        return;
      }

      switch (event.eventType) {
        case EventTypes.POWBegin:
          break;
        case EventTypes.POWIteration:
          this.powIteration = <POWIteration>event.message;
          this.powIterationSet.next(this.powIteration);
          break;
        case EventTypes.POWSolution:
          this.powSolution = <POWSolution>event.message;
          this.powSolutionSet.next(this.powSolution);
          this.startTimer();
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  get solutionFound():boolean{
    if(this.powSolution && this.powSolution.solution !== 0){
      return true;
    }
    return false;
  }

  startTimer(){
    setTimeout(() => {
      this.dialogRef.close(DialogResult.Ok);
    }, 5 * 1000);
  }

  cancel() {
    this.dialogRef.close(DialogResult.Ok);
  }
}
