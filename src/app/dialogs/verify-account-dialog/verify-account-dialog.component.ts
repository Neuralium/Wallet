import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../..//service/notification.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
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
import { WalletAccount, NO_WALLET_ACCOUNT, WalletAccountStatus, WalletAccountType } from '../..//model/walletAccount';
import { ConfigService } from '../..//service/config.service';
import { PublishAccountDialogComponent } from '../..//dialogs/publish-account-dialog/publish-account-dialog.component';
import { AppointmentsDialogComponent } from '../..//dialogs/appointments-dialog/appointments-dialog.component';
import { SMSDialogComponent } from '../..//dialogs/sms-dialog/sms-dialog.component';
import { AppConfig } from './../../../environments/environment';
import { AppointmentsService } from '../..//service/appointment.service';



@Component({
  selector: 'app-verify-account',
  templateUrl: './verify-account-dialog.component.html',
  styleUrls: ['./verify-account-dialog.component.css']
})
export class VerifyAccountDialogComponent implements OnInit, OnDestroy {

  constructor(
    public dialog: MatDialog,
    private translateService: TranslateService,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private syncStatusService: SyncStatusService,
    private configService:ConfigService,
    private appointmentsService: AppointmentsService,
    public localDialogRef: MatDialogRef<VerifyAccountDialogComponent>,
    private changeDetector: ChangeDetectorRef,

    fb: FormBuilder) {
      this.form1 = fb.group({
        'verificationTypeSelector': this.verificationTypeSelector
      });
  }

  account: WalletAccount = NO_WALLET_ACCOUNT;

  form1: FormGroup;
  hideBypassVerification:boolean = true;
  hideAppointments:boolean = false;
  verificationSelection = 1; // 0;
  
  hidePOW:boolean = true;

  helpText:string = '';
  TESTNETHelpText:string = '';
  appointmentHelpText:string = '';
  powHelpText:string = '';

  verificationTypeSelector = new FormControl('', []);

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

    this.hideBypassVerification = !(AppConfig.devnet || AppConfig.testnet);
    
    this.walletService.getCurrentAccount().pipe(takeUntil(this.unsubscribe$)).subscribe(account => {
      this.account = account;

      this.hidePOW = account.accountType === WalletAccountType.User;
    });
    this.translateService.get('verifyAccount.DefaultHelpText').subscribe(text => {
      this.helpText = text;
    });
  }

  displayHelpText(){

    if(this.verificationSelection === 1){
      if(this.TESTNETHelpText === ''){
        this.translateService.get('verifyAccount.TESTNETHelpText').subscribe(text => {
          this.TESTNETHelpText = text;
          this.helpText = text;
        });
      }
      else{
        this.helpText = this.TESTNETHelpText;
      }
    }
    else if(this.verificationSelection === 2){
      if(this.appointmentHelpText === ''){
        this.translateService.get('verifyAccount.AppointmentsHelpText').subscribe(text => {
          this.appointmentHelpText = text;
          this.helpText = text;
        });
      }
      else{
        this.helpText = this.appointmentHelpText;
      }
    }
    else if(this.verificationSelection === 3){
      if(this.powHelpText === ''){
        this.translateService.get('verifyAccount.POWHelpText').subscribe(text => {
          this.powHelpText = text;
          this.helpText = text;
        });
      }
      else{
        this.helpText = this.powHelpText;
      }
    }
  }

  get canBegin():boolean{
    return this.verificationSelection !== 0;
  }

  beginVerification() {

    this.localDialogRef.close(DialogResult.Ok);

    let dialogRef;
    if(this.verificationSelection === 1){
      this.appointmentsService.bypassAppointmentVerification().then(result => {

        if(result){
          dialogRef = this.dialog.open(PublishAccountDialogComponent, {
            width: '700px',
            data: this.account
          });
        }
      });
    }
    else if(this.verificationSelection === 2){
      dialogRef = this.dialog.open(AppointmentsDialogComponent, {
        width: '700px'
      });
    }
    else if(this.verificationSelection === 3){
      dialogRef = this.dialog.open(PublishAccountDialogComponent, {
        width: '700px',
        data: this.account
      });
    }

  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  cancel() {
    this.localDialogRef.close(DialogResult.Cancel);
  }
}
