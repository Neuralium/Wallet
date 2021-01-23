import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';

import { Contact } from '../..//model/contact';
import { ContactsService } from '../..//service/contacts.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent, ConfirmDialogParameter } from '../..//dialogs/confirm-dialog/confirm-dialog.component';
import { DialogResult } from '../..//config/dialog-result';
import { TotalNeuralium } from '../..//model/total-neuralium';
import { MatDialog } from '@angular/material/dialog';
import { TransactionsService } from '../..//service/transactions.service';
import { NotificationService } from '../..//service/notification.service';
import { AccountsService } from '../..//service/accounts.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-send-neuraliums',
  templateUrl: './send-neuraliums.component.html',
  styleUrls: ['./send-neuraliums.component.scss']
})
export class SendNeuraliumsComponent implements OnInit, OnDestroy {
  @Input() neuraliumTotal: TotalNeuralium;
  @Input() currentAccountUuId: string;
  @Output() neuraliumsSent: EventEmitter<number> = new EventEmitter();

  form: FormGroup;
  submitted = false;


  contactList: Array<Contact> = [];
  canSendTransaction: boolean = false;
  canSend: boolean = false;

  contact = new FormControl('', []);
  accountId = new FormControl('', [this.accountIDValidator()]);
  neuraliums = new FormControl(0, [Validators.required, Validators.min(0.000000001), this.neuraliumValidator()]);
  tip = new FormControl(0, [Validators.min(0), this.tipValidator()]);
  note = new FormControl('');

  constructor(
    private translateService: TranslateService,
    private contactsService: ContactsService,
    private _ngZone: NgZone,
    private transactionService: TransactionsService,
    private notificationService: NotificationService,
    private accountService: AccountsService,
    public dialog: MatDialog,
    fb: FormBuilder) {

    this.form = fb.group({
      "contact": this.contact,
      "accountId": this.accountId,
      "neuraliums": this.neuraliums,
      "tip": this.tip,
      "note": this.note
    });
  }

  ngOnInit() {
    this.canSend = true;
    this.initialiseValues();

    this.transactionService.getCanSendTransactions().pipe(takeUntil(this.unsubscribe$)).subscribe(canSend => {
      this._ngZone.run(() => {
        this.canSendTransaction = canSend;
      });
    })

    this.contactsService.getContacts().pipe(takeUntil(this.unsubscribe$)).subscribe(contacts => {
      this._ngZone.run(() => {
        this.contactList = new Array<Contact>();
        var friendlyName = this.translateService.instant('send.InputContactIdManually');
        this.contactList.push({ friendlyName: friendlyName, id: null, isNew: true })
        contacts.forEach(contact => {
          this.contactList.push(contact);
        })
      });
    })
  }

  get sendDisabled(){
    return !(this.canSend && this.canSendTransaction);
  }
  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  initialiseValues() {
    this.canSend = true;
  }

  get isContactSelected(): boolean {
    let selectedContact: Contact = this.contact.value;

    return selectedContact && selectedContact.id !== "" && selectedContact.id !== null;
  }

  contactChanged(event) {

    Object.keys(this.form.controls).forEach(field => {
      const control = this.form.get(field);
      control.updateValueAndValidity();

    });
  }

  accountIDValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (this.isContactSelected) {
        return null;
      }

      let accountIdValue: string = control.value;

      if (!accountIdValue) {
        return { 'accountId': { value: accountIdValue, message: this.translateService.instant('send.PleaseChooseContactInTheListOrInputContactId') } };
      }


      if (this.accountService.testPresentation(accountIdValue)) {

        return { 'accountId': { value: accountIdValue, message: this.translateService.instant('send.PresentationAccountId') } };
      }


      if (!this.accountService.testValidAccountId(accountIdValue)) {

        return { 'accountId': { value: accountIdValue, message: this.translateService.instant('send.InvalidAccountId') } };
      }

      return null;
    };
  }

  neuraliumValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!this.isTotalValid()) {
        return { 'neuraliums': { value: control.value, message: this.translateService.instant('send.NotEnoughNeuraliums') } };
      }
      return null;
    };
  }

  tipValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!this.isTotalValid()) {
        return { 'tip': { value: control.value, message: this.translateService.instant('send.NotEnoughNeuraliums') } };
      }
      return null;
    };
  }



  getAccountIdErrorMessage() {

    if (this.accountId.hasError('accountId')) {
      var error = this.accountId.getError('accountId');
      return error.message;
    }

    return '';
  }

  getNeuraliumErrorMessage() {
    if (this.neuraliums.hasError('required')) {
      return this.translateService.instant('send.PleaseInputNeuraliumAmount');
    }

    if (this.neuraliums.hasError('neuraliums')) {
      var error = this.neuraliums.getError('neuraliums');
      return error.message;
    }

    return '';
  }

  getTipErrorMessage() {
    if (this.tip.hasError('tip')) {
      var error = this.tip.getError('tip');
      return error.message;
    }

    return '';
  }


  isTotalValid(): boolean {
    let total: number = 0;

    if (!this.neuraliumTotal) {
      return true;
    }

    if (this.neuraliums) {
      total += this.neuraliums.value;

    }

    if (this.tip) {
      total += this.tip.value;
    }

    return total <= this.neuraliumTotal.usable;
  }

  onSubmit() {

    if (!this.isTotalValid()) {
      this.notificationService.showError(this.translateService.instant('send.NotEnoughNeuraliums'));

      return false;
    }


    let sendNeuraliums: number = this.neuraliums.value;
    let sendTip: number = this.tip.value;

    let selectedContact: Contact = this.contact.value;

    let hasId: boolean = false;
    if (selectedContact.id) {
      hasId = true;
    }
    let useContact: boolean = this.isContactSelected && hasId;
    let formattedAccountId: string;

    if (useContact) {
      formattedAccountId = this.accountService.FormatAccountId(selectedContact.id);
    }
    else {
      formattedAccountId = this.accountService.FormatAccountId(this.accountId.value);
    }


    let key: string;
    let parameters: object;
    let hasTip: boolean = sendTip > 0;

    if (useContact && hasTip) {

      key = "send.SendingValueConfirmationWithNameAndTip";
      parameters = { neuraliums: sendNeuraliums, name: selectedContact.friendlyName, id: formattedAccountId, tip: sendTip };
    }
    else if (useContact && !hasTip) {

      key = "send.SendingValueConfirmationWithName";
      parameters = { neuraliums: sendNeuraliums, name: selectedContact.friendlyName, id: formattedAccountId };
    }
    else if (!useContact && hasTip) {

      key = "send.SendingValueConfirmationAndTip";
      parameters = { neuraliums: sendNeuraliums, id: formattedAccountId, tip: sendTip };
    }
    else if (!useContact && !hasTip) {
      key = "send.SendingValueConfirmation";
      parameters = { neuraliums: sendNeuraliums, id: formattedAccountId };
    }
    this.translateService.get(key, parameters).subscribe(messagePart => {
      let message = this.translateService.instant("send.PleaseConfirmSending") + " " + messagePart;
      this.send(formattedAccountId, sendNeuraliums, sendTip, message);
    })
  }



  private send(targetAccountId: string, neuraliums: number, tip: number, confirmMessage: string) {
    var total = neuraliums + tip;
    this.canSend = false;
    setTimeout(() => {

      const dialogParameters = new ConfirmDialogParameter();
      dialogParameters.message = confirmMessage;
      let dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '650px',
        data: dialogParameters
      });

      dialogRef.afterClosed().subscribe(dialogResult => {
        if (dialogResult === DialogResult.Yes) {
          
          this.transactionService.saveTransaction(targetAccountId, neuraliums, tip, this.note.value)
            .then(() => {
              this.neuraliumsSent.emit(total);
              setTimeout(() => {
                this.initialiseValues();
              }, 5 * 1000);
            })
            .catch(reason => {
              this.notificationService.showError(reason);
              this.canSend = true;
            });
        }
        else{
          this.canSend = true;
        }
      })
    });
  }
}
