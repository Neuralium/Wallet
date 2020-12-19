import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, FormBuilder } from '@angular/forms';

import { NotificationService } from '../..//service/notification.service';
import { SyncStatusService } from '../..//service/sync-status.service';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletService } from '../..//service/wallet.service';
import { WalletCreation, Wallet, EncryptionKey } from '../..//model/wallet';
import { SyncProcess, NO_SYNC, ProcessType } from '../..//model/syncProcess';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogResult } from '../..//config/dialog-result';
import { TranslateService } from '@ngx-translate/core';
import { EventTypes } from '../..//model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatStepper } from '@angular/material/stepper';
import { WalletAccountType } from '../..//model/walletAccount';

@Component({
  selector: 'app-create-wallet-process-dialog',
  templateUrl: './create-wallet-process-dialog.component.html',
  styleUrls: ['./create-wallet-process-dialog.component.css']
})
export class CreateWalletProcessDialogComponent implements OnInit, OnDestroy {

  get passWordInputType(): string {
    if (this.showPasswords) {
      return 'text';
    }
    else {
      return 'password';
    }
  }

  createClicked:boolean = false;

  constructor(
    private translateService: TranslateService,
    private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private syncStatusService: SyncStatusService,
    public dialogRef: MatDialogRef<CreateWalletProcessDialogComponent>,
    private changeDetector: ChangeDetectorRef,
    private _ngZone: NgZone,
    fb: FormBuilder) {

    this.form1 = fb.group({
      'walletPassphrase': this.walletPassphrase,
      'walletPassphraseConfirm': this.walletPassphraseConfirm,
      'allKeysPassphrase': this.allKeysPassphrase,
      'allKeysPassphraseConfirm': this.allKeysPassphraseConfirm
    });

    this.form2 = fb.group({
      'transactionKeyPassphrase': this.transactionKeyPassphrase,
      'transactionKeyPassphraseConfirm': this.transactionKeyPassphraseConfirm,
      'messageKeyPassphrase': this.messageKeyPassphrase,
      'messageKeyPassphraseConfirm': this.messageKeyPassphraseConfirm,
      'changeKeyPassphrase': this.changeKeyPassphrase,
      'changeKeyPassphraseConfirm': this.changeKeyPassphraseConfirm,
      'backupKeyPassphrase': this.backupKeyPassphrase,
      'backupKeyPassphraseConfirm': this.backupKeyPassphraseConfirm,

      'validatorVerificationKeyPassphrase': this.validatorVerificationKeyPassphrase,
      'validatorVerificationKeyPassphraseConfirm': this.validatorVerificationKeyPassphraseConfirm,
      'validatorSecretKeyPassphrase': this.validatorSecretKeyPassphrase,
      'validatorSecretKeyPassphraseConfirm': this.validatorSecretKeyPassphraseConfirm
    });
  }


  get isServerWallet(): boolean {
    return this.walletToCreate.accountType === WalletAccountType.Server;
  }

  get isWalletValid() {
    var isValid: boolean = true;

    isValid = this.accountNameValid;

    if (isValid) {
      isValid = !(this.form1.invalid || this.form2.invalid);
    }

    return isValid;;
  }

  get accountNameValid(): boolean {
    return !this.isNullOrEmpty(this.walletToCreate.friendlyName);
  }

  get accountNameNotValid(): boolean {
    return !this.accountNameValid;
  }


  form1: FormGroup;
  form2: FormGroup;

  MIN_LENGTH: number = 6;

  showPasswords: boolean = false;
  defaultProcess: SyncProcess;
  currentBlockchainId: number = 0;
  walletCreationStep: number = 0;
  accountCreationStep: number = 0;
  keyCreationStep: number = 0;
  walletToCreate: WalletCreation;
  walletCreationSyncProcess: SyncProcess = NO_SYNC;
  walletCreationProcesses: Array<SyncProcess> = [];
  currentStep: string = '';
  accountCode: string = '';
  isWalletCreationRunning: boolean;
  isAccountCreationRunning: boolean;
  isKeyCreationRunning: boolean;
  passPhrasesConfirm = [];
  keyName: string = '';
  percentage: number = 0;
  keyIndex: number = 0;
  totalKeys: number = 0;
  error: boolean = false;
  walletPath: string = '';

  errorMessage: string = '';
  errorException: string = '';

  walletPassphrase = new FormControl('', []);
  walletPassphraseConfirm = new FormControl('', []);
  allKeysPassphrase = new FormControl('', []);
  allKeysPassphraseConfirm = new FormControl('', []);

  transactionKeyPassphrase = new FormControl('', []);
  transactionKeyPassphraseConfirm = new FormControl('', []);
  messageKeyPassphrase = new FormControl('', []);
  messageKeyPassphraseConfirm = new FormControl('', []);
  changeKeyPassphrase = new FormControl('', []);
  changeKeyPassphraseConfirm = new FormControl('', []);
  backupKeyPassphrase = new FormControl('', []);
  backupKeyPassphraseConfirm = new FormControl('', []);

  validatorVerificationKeyPassphrase = new FormControl('', []);
  validatorVerificationKeyPassphraseConfirm = new FormControl('', []);
  validatorSecretKeyPassphrase = new FormControl('', []);
  validatorSecretKeyPassphraseConfirm = new FormControl('', []);

  @ViewChild('stepper')
  stepperComponent: MatStepper;

  private unsubscribe$ = new Subject<void>();


  ngOnInit() {

    this.initialiseValues();

    this.runValidate();

  }


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  runValidate() {
    this.validatePassphrases();
    this.validateIndividualKeysPassphrases();
  }

  validatePassphrases() {
    this.walletPassphrase.setValidators([this.passphraseValidator()]);
    this.walletPassphraseConfirm.setValidators([this.passphraseConfirmValidator()]);
    this.allKeysPassphrase.setValidators([this.allKeysPassphraseValidator()]);
    this.allKeysPassphraseConfirm.setValidators([this.allKeysPassphraseConfirmValidator()]);


    Object.keys(this.form1.controls).forEach(field => {
      const control = this.form1.get(field);
      control.updateValueAndValidity();
    });

    Object.keys(this.form1.controls).forEach(field => {
      const control = this.form1.get(field);
      control.setValidators([]);
    });
  }

  validateIndividualKeysPassphrases() {

    this.transactionKeyPassphrase.setValidators([this.transactionKeyPassphraseValidator()]);
    this.transactionKeyPassphraseConfirm.setValidators([this.transactionKeyPassphraseConfirmValidator()]);
    this.messageKeyPassphrase.setValidators([this.messageKeyPassphraseValidator()]);
    this.messageKeyPassphraseConfirm.setValidators([this.messageKeyPassphraseConfirmValidator()]);

    this.changeKeyPassphrase.setValidators([this.changeKeyPassphraseValidator()]);
    this.changeKeyPassphraseConfirm.setValidators([this.changeKeyPassphraseConfirmValidator()]);
    this.backupKeyPassphrase.setValidators([this.backupKeyPassphraseValidator()]);
    this.backupKeyPassphraseConfirm.setValidators([this.backupKeyPassphraseConfirmValidator()]);

    this.validatorVerificationKeyPassphrase.setValidators([this.validatorVerificationKeyPassphraseValidator()]);
    this.backupKeyPassphraseConfirm.setValidators([this.validatorVerificationKeyPassphraseConfirmValidator()]);
    this.validatorSecretKeyPassphrase.setValidators([this.validatorSecretKeyPassphraseValidator()]);
    this.validatorSecretKeyPassphraseConfirm.setValidators([this.validatorSecretKeyPassphraseConfirmValidator()]);

    Object.keys(this.form2.controls).forEach(field => {
      const control = this.form2.get(field);
      control.updateValueAndValidity();
    });

    Object.keys(this.form2.controls).forEach(field => {
      const control = this.form2.get(field);
      control.setValidators([]);
    });
  }

  validateSource(passphrase: string, key: string) {
    if (passphrase.length < this.MIN_LENGTH) {
      return { key: { value: key, message: this.translateService.instant('wallet.PhassphraseTooShort') } };
    }

    return null;
  }


  validateConfirmation(passphrase: string, passphraseConfirmation: string, key: string) {
    if (passphrase !== passphraseConfirmation) {
      return { key: { value: key, message: this.translateService.instant('wallet.PhassphraseDifferent') } };
    }

    return null;
  }


  passphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptWallet) {
        return null;
      }

      return this.validateSource(this.walletPassphrase.value, 'walletPassphrase');
    };
  }

  passphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptWallet) {
        return null;
      }

      return this.validateConfirmation(this.walletPassphrase.value, this.walletPassphraseConfirm.value, 'walletPassphraseConfirm');
    };
  }

  allKeysPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || (!this.walletToCreate.encryptKey || this.walletToCreate.encryptKeysIndividualy)) {
        return null;
      }

      return this.validateSource(this.allKeysPassphrase.value, 'allKeysPassphraseConfirm');
    };
  }


  allKeysPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || (!this.walletToCreate.encryptKey || this.walletToCreate.encryptKeysIndividualy)) {
        return null;
      }

      return this.validateConfirmation(this.allKeysPassphrase.value, this.allKeysPassphraseConfirm.value, 'allKeysPassphraseConfirm');
    };
  }


  // now the individual keys
  transactionKeyPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateSource(this.transactionKeyPassphrase.value, 'transactionKeyPassphrase');
    };
  }


  transactionKeyPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateConfirmation(this.transactionKeyPassphrase.value, this.transactionKeyPassphraseConfirm.value, 'transactionKeyPassphraseConfirm');
    };
  }

  getTransactionKeyPassphraseErrorMessage() {

    return this.getErrorMessage('transactionKeyPassphrase');
  }

  getTransactionKeyPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('transactionKeyPassphraseConfirm');
  }

  messageKeyPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateSource(this.messageKeyPassphrase.value, 'messageKeyPassphrase');
    };
  }


  messageKeyPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateConfirmation(this.messageKeyPassphrase.value, this.messageKeyPassphraseConfirm.value, 'messageKeyPassphraseConfirm');
    };
  }

  getMessageKeyPassphraseErrorMessage() {

    return this.getErrorMessage('messageKeyPassphrase');
  }

  getMessageKeyPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('messageKeyPassphraseConfirm');
  }

  changeKeyPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateSource(this.changeKeyPassphrase.value, 'changeKeyPassphrase');
    };
  }


  changeKeyPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateConfirmation(this.changeKeyPassphrase.value, this.changeKeyPassphraseConfirm.value, 'changeKeyPassphraseConfirm');
    };
  }

  getChangeKeyPassphraseErrorMessage() {

    return this.getErrorMessage('changeKeyPassphrase');
  }

  getChangeKeyPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('changeKeyPassphraseConfirm');
  }

  backupKeyPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateSource(this.backupKeyPassphrase.value, 'backupKeyPassphrase');
    };
  }


  backupKeyPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy) {
        return null;
      }

      return this.validateConfirmation(this.backupKeyPassphrase.value, this.backupKeyPassphraseConfirm.value, 'backupKeyPassphraseConfirm');
    };
  }

  getBackupKeyPassphraseErrorMessage() {

    return this.getErrorMessage('backupKeyPassphrase');
  }

  getBackupKeyPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('backupKeyPassphraseConfirm');
  }


  validatorVerificationKeyPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy || !this.isServerWallet) {
        return null;
      }

      return this.validateSource(this.validatorVerificationKeyPassphrase.value, 'validatorVerificationKeyPassphrase');
    };
  }


  validatorVerificationKeyPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy || !this.isServerWallet) {
        return null;
      }

      return this.validateConfirmation(this.validatorVerificationKeyPassphrase.value, this.validatorVerificationKeyPassphraseConfirm.value, 'validatorVerificationKeyPassphraseConfirm');
    };
  }

  getValidatorVerificationKeyPassphraseErrorMessage() {

    return this.getErrorMessage('validatorVerificationKeyPassphrase');
  }

  getValidatorVerificationKeyPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('validatorVerificationKeyPassphraseConfirm');
  }


  validatorSecretKeyPassphraseValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy || !this.isServerWallet) {
        return null;
      }

      return this.validateSource(this.validatorSecretKeyPassphrase.value, 'validatorSecretKeyPassphrase');
    };
  }


  validatorSecretKeyPassphraseConfirmValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

      if (!this.walletToCreate || !this.walletToCreate.encryptKey || !this.walletToCreate.encryptKeysIndividualy || !this.isServerWallet) {
        return null;
      }

      return this.validateConfirmation(this.validatorSecretKeyPassphrase.value, this.validatorSecretKeyPassphraseConfirm.value, 'validatorSecretKeyPassphraseConfirm');
    };
  }

  getValidatorSecretKeyPassphraseErrorMessage() {

    return this.getErrorMessage('validatorSecretKeyPassphrase');
  }

  getValidatorSecretKeyPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('validatorSecretKeyPassphraseConfirm');
  }


  getErrorMessage(key: string) {
    if (this.walletPassphrase.hasError(key)) {
      var error = this.walletPassphrase.getError(key);
      return error.message;
    }

    return '';
  }


  getWalletPassphraseErrorMessage() {

    return this.getErrorMessage('walletPassphrase');
  }

  getWalletPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('walletPassphraseConfirm');
  }

  getAllKeysPassphraseErrorMessage() {

    return this.getErrorMessage('allKeysPassphrase');
  }

  getAllKeysPassphraseConfirmErrorMessage() {

    return this.getErrorMessage('allKeysPassphraseConfirm');
  }


  initialiseValues() {
    this.currentBlockchainId = this.blockchainService.getCurrentBlockchain().id;
    this.walletToCreate = WalletCreation.createNew();
    this.walletCreationSyncProcess = NO_SYNC;
  }

  createWallet() {
    if (this.isWalletValid) {
      this.startProcess();
    }
    else {
      this.notificationService.showWarn(this.translateService.instant('error.InformationsNotCorrectPleaseRetry'));
    }
  }

  cancel() {
    this.dialogRef.close(DialogResult.Cancel);
  }

  startProcess() {

    this.createClicked = true;
    this.startSyncStatusProcess();
    this.subscribeToEvents();

    if (this.walletToCreate.encryptWallet) {
      this.walletToCreate.passPhrases[0] = this.walletPassphrase.value;

      if (this.walletToCreate.encryptKey) {

        if (this.walletToCreate.encryptKeysIndividualy) {
          this.walletToCreate.passPhrases[EncryptionKey.TransactionKey] = this.transactionKeyPassphrase.value;
          this.walletToCreate.passPhrases[EncryptionKey.MessageKey] = this.messageKeyPassphrase.value;
          this.walletToCreate.passPhrases[EncryptionKey.ChangeKey] = this.changeKeyPassphrase.value;
          this.walletToCreate.passPhrases[EncryptionKey.SuperKey] = this.backupKeyPassphrase.value;

          if (this.isServerWallet) {
            this.walletToCreate.passPhrases[EncryptionKey.ValidatorVerificationKey] = this.validatorVerificationKeyPassphrase.value;
            this.walletToCreate.passPhrases[EncryptionKey.ValidatorSecretKey] = this.validatorSecretKeyPassphrase.value;
          }
        }
        else {
          this.walletToCreate.passPhrases[1] = this.allKeysPassphrase.value;
        }
      }
    }

    this.walletService.startCreateWalletProcess(this.currentBlockchainId, this.walletToCreate)
      .then((syncProcess) => {
        this.walletCreationSyncProcess = syncProcess;
      });
  }

  endProcess() {


    this.walletService.loadWallet(this.currentBlockchainId).then(isLoaded => {
      if (isLoaded === true) {
        this.walletService.refreshWallet(this.currentBlockchainId).then(wallet => {

          if (wallet) {
            this.walletPath = wallet.walletInfo.walletPath;

            this.notificationService.showSuccess(this.translateService.instant('wallet.WalletCreated'));
            this.walletService.endCreateWalletProcess(this.walletCreationSyncProcess);

            this.stepperComponent.next();
          }

        });
      }
      else {
        console.log('failed to load wallet info.');
      }
    });
  }

  finish() {
    if (this.walletToCreate.publishAccount) {
      this.dialogRef.close(this.accountCode);
    } else {
      this.dialogRef.close(DialogResult.WalletCreated);
    }
  }

  startSyncStatusProcess() {
    this.syncStatusService.syncListObservable.pipe(takeUntil(this.unsubscribe$)).subscribe(processes => {
      this._ngZone.run(() => {
        this.walletCreationProcesses = processes.filter(process => process.processType === ProcessType.WalletCreation);
      });
    })
  }

  subscribeToEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe((event) => {
      switch (event.eventType) {
        case EventTypes.WalletCreationStarted:
          this._ngZone.run(() => {
            this.isWalletCreationRunning = true;
          });
          break;
        case EventTypes.WalletCreationEnded:
          this._ngZone.run(() => {
            this.isWalletCreationRunning = false;
            this.endProcess();
          });
          break;
        case EventTypes.WalletCreationStep:
          this._ngZone.run(() => {
            this.isWalletCreationRunning = true;
            var step = event.message;
            var stepIndex = step['stepIndex'];
            var stepTotal = step['stepTotal'];
            this.walletCreationStep = stepIndex / stepTotal * 100;
          });


          break;
        case EventTypes.AccountCreationStarted:
          this._ngZone.run(() => {
            this.isAccountCreationRunning = true;
          });
          break;
        case EventTypes.AccountCreationStep:
          this._ngZone.run(() => {
            this.isAccountCreationRunning = true;
            var step = event.message;
            var stepIndex = step['stepIndex'];
            var stepTotal = step['stepTotal'];
            this.accountCreationStep = stepIndex / stepTotal * 100;
          });
          break;
        case EventTypes.AccountCreationEnded:
          this._ngZone.run(() => {
            this.isAccountCreationRunning = false;
            this.accountCode = event.message['accountCode'];
          });
          break;
        case EventTypes.KeyGenerationStarted:
          this._ngZone.run(() => {
            this.isKeyCreationRunning = true;

            this.percentage = 0;

            this.keyIndex = (event.message['keyIndex']) - 1;
            this.totalKeys = event.message['totalKeys'];

            this.keyName = event.message['keyName'];

            this.updateKeyGeneratePercentage();
          });
          break;
        case EventTypes.KeyGenerationEnded:
          this._ngZone.run(() => {
            let keyIndex2: number = event.message['keyIndex'];
            let totalKeys2: number = event.message['totalKeys'];

            if (keyIndex2 === totalKeys2) {
              this.isKeyCreationRunning = false;
              this.keyCreationStep = 100;
              this.percentage = 100;
              this.keyName = '';
            }
          });
          break;
        case EventTypes.WalletCreationError:
          this._ngZone.run(() => {
            this.errorMessage = event.message['message'];
            this.errorException = event.message['exception'];

            this.isWalletCreationRunning = false;

            this.error = true;
          });
          break;
        case EventTypes.KeyGenerationPercentageUpdate:
          this._ngZone.run(() => {
            this.percentage = event.message['percentage'];

            this.updateKeyGeneratePercentage();
          });
          break;
        default:
          return;
      }
    })
  }

  private updateKeyGeneratePercentage() {
    let keyPart = 100 / (this.totalKeys - 1); // -1 because the last key is so fast to generate, we exclude it from the %
    let baseline: number = keyPart * (this.keyIndex);
    this.keyCreationStep = baseline + ((keyPart * this.percentage) / (100));
  }

  private isNullOrEmpty(text: string) {
    return !text || text === '';
  }
}
