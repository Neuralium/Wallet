import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';

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


@Component({
  selector: 'app-sms-dialog',
  templateUrl: './sms-dialog.component.html',
  styleUrls: ['./sms-dialog.component.css']
})
export class SMSDialogComponent implements OnInit, OnDestroy {

  constructor(
    private translateService: TranslateService,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private syncStatusService: SyncStatusService,
    public dialogRef: MatDialogRef<SMSDialogComponent>,
    private changeDetector: ChangeDetectorRef,
    fb: FormBuilder) {

    this.initialFormGroup = fb.group({
      'phoneNumberControl': this.phoneNumberControl,
      'confirmationCodeControl' : this.confirmationCodeControl
    });

    this.responseFormGroup = fb.group({
      'smsCodeControl': this.smsCodeControl
    });
  }
  get selectedPhoneNumber(): string {
    return this.phoneNumberControl.value;
  }

  get isChineseNumber(): boolean {

     //note: because of limitations with sending SMS into China, we have no choice but to identify Chinese numbers and operate differently.
     return this.checkChineseNumber(this.selectedPhoneNumber);
  }

  get isValidChineseConfiguration(): boolean {
    //note: because of limitations with sending SMS into China, we have no choice but to identify Chinese numbers and operate differently. Confirmation is required.
    return this.isChineseNumber && this.selectedConfirmationCode !== 0;
  }

  get selectedConfirmationCode(): number {

    if(this.confirmationCodeControl.value && this.checkConfirmationCode(this.confirmationCodeControl.value)){
      try{
        return Number(this.confirmationCodeControl.value);
      }
      catch(error){

      }
    }
    return 0;
  }

  @ViewChild('stepper')
  stepperComponent: MatStepper;

  initialFormGroup: FormGroup;
  responseFormGroup: FormGroup;
  isValidationRunning:boolean = false;
  success:boolean = false;

  phoneNumberControl = new FormControl('', [Validators.required, this.phoneNumberValidator()]);
  confirmationCodeControl = new FormControl('', [this.confirmationCodeValidator()]);
  smsCodeControl = new FormControl('', [Validators.required, this.smsCodeValidator()]);

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {


  }

  beginVerification(){

  }

  getErrorMessage(control:FormControl, key:string){
    if (control.hasError(key)) {
      var error = control.getError(key);
      return error.message;
    }

    return '';
  }

  phoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      const phoneNumber: string = control.value;

      const phoneNumberRegex = /^[+]?[1-9]{1}[0-9-]{3,14}$/;
      if (!phoneNumberRegex.test(phoneNumber)) {
        return { key: { value: 'phone', message: this.translateService.instant('sms.InvalidPhoneFormat') } };
      }

      if (this.isChineseNumber && !this.isValidChineseConfiguration) {
        return { key: { value: 'phone', message: this.translateService.instant('sms.InvalidChineseConfiguration') } };
      }

      return undefined;
    };
  }

  getPhoneNumberErrorMessage(){
    return this.getErrorMessage(this.phoneNumberControl, 'phone');
  }

  confirmationCodeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      const confirmationCode: string = control.value;

      const valid:boolean = this.checkConfirmationCode(confirmationCode);
      if(valid){
        return undefined;
      }

      if(!confirmationCode && this.isChineseNumber){
        return { key: { value: 'code', message: this.translateService.instant('sms.InvalidChineseConfiguration') } };
      }
      if(confirmationCode && !valid){
        return { key: { value: 'code', message: this.translateService.instant('sms.InvalidConfirmationCodeFormat') } };
      }

      return undefined;
    };
  }

  getConfirmationCodeErrorMessage(){
    return this.getErrorMessage(this.confirmationCodeControl, 'code');
  }

  smsCodeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      const smsCode: string = control.value;

      const valid:boolean = this.checkSmsCode(smsCode);
      if(!valid){
        return { key: { value: 'smscode', message: this.translateService.instant('sms.InvalidSMSCode') } };
      }

      return undefined;
    };
  }

  getSmsCodeErrorMessage(){
    return this.getErrorMessage(this.confirmationCodeControl, 'smscode');
  }

  checkChineseNumber(phoneNumber:string):boolean{

    //note: because of limitations with sending SMS into China, we have no choice but to identify Chinese numbers and operate differently.
    if(!phoneNumber){
      return false;
    }
    const chineseNumberRegex = /^[+]?(?:86|852|853)/;
    return chineseNumberRegex.test(phoneNumber);
  }

  checkConfirmationCode(confirmationCode:string):boolean{

    if(!confirmationCode){
      return false;
    }
    const confirmationCodeRegex = /^[1-9]+$/;
    if(confirmationCodeRegex.test(confirmationCode)){
      return this.checkConfirmationCodeNumber(Number(confirmationCode));
    }

    return false;
  }

  checkConfirmationCodeNumber(confirmationCode:number):boolean{

    if(confirmationCode){
      return confirmationCode !== 0;
    }
    return false;
  }

  checkSmsCode(smsCode:string):boolean{

    if(!smsCode){
      return false;
    }
    const smsCodeRegex = /^[1-9]+$/;
    if(smsCodeRegex.test(smsCode)){
      return this.checkSmsCodeNumber(Number(smsCode));
    }

    return false;
  }

  checkSmsCodeNumber(smsCode:number):boolean{

    if(smsCode){
      return smsCode !== 0;
    }
    return false;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  cancel() {
    this.dialogRef.close(DialogResult.Cancel);
  }
}
