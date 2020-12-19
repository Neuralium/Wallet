import { Injectable } from '@angular/core';
import { NO_WALLET, Wallet, WalletCreation, EncryptionKey } from '../model/wallet';
import { BehaviorSubject, Observable } from 'rxjs';
import { NEURALIUM_BLOCKCHAIN, BlockChain } from '../model/blockchain';
import { SyncStatusService } from './sync-status.service';
import { NotificationService } from './notification.service';
import { SyncProcess, ProcessType } from '../model/syncProcess';
import { ServerConnectionService } from './server-connection.service';
import { WalletAccount, NO_WALLET_ACCOUNT, AccountAppointmentConfirmationResult, AccountCanPublish } from '../model/walletAccount';
import { WalletAccountAppointment, AppointmentStatus } from '../model/walletAccountAppointment';
import { NeuraliumBlockchainType } from '../model/blockchain';
import { EventTypes } from '../model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';


@Injectable({
  providedIn: 'root'
})
export class WalletService {
  selectedWallet: BehaviorSubject<Wallet> = new BehaviorSubject<Wallet>(NO_WALLET);
  wallets: Object = new Object();
  currentBlockchainId = 0;
  currentAccountSubject: BehaviorSubject<WalletAccount> = new BehaviorSubject<WalletAccount>(NO_WALLET_ACCOUNT);
  eventsRegistered = false;


  constructor(private syncStatusService: SyncStatusService, private serverConnectionService: ServerConnectionService, private notificationService: NotificationService) {
    this.wallets[NEURALIUM_BLOCKCHAIN.id] = NO_WALLET;
    // this.wallets[SECURITY_BLOCKCHAIN.id] = NO_WALLET;
    // this.wallets[CONTRACT_BLOCKCHAIN.id] = NO_WALLET;

    this.serverConnectionService.eventNotifier.subscribe(event => {
      if (event.eventType === EventTypes.AccountPublicationEnded) {
        this.refreshWallet(this.currentBlockchainId);
      }
    });

    this.startListeningMiningEvents();
  }


  startListeningMiningEvents() {
    if (!this.eventsRegistered) {
      this.serverConnectionService.eventNotifier.subscribe(event => {

        if (!event.isNeuralium) {
          return;
        }
        switch (event.eventType) {

          case EventTypes.AccountStatusUpdated:
            this.reloadCurrentAccount(this.currentAccount);
            break;
        }
      });
      this.eventsRegistered = true;
    }
  }


  startCreateWalletProcess(blockchainId: number, walletToCreate: WalletCreation): Promise<SyncProcess> {
    return new Promise<SyncProcess>((resolve, reject) => {
      this.serverConnectionService.callCreateNewWallet(blockchainId, walletToCreate)
        .then(correlationId => {
          const walletSyncProcess = SyncProcess.createNew(correlationId, 'Creation of wallet ' + walletToCreate.friendlyName, ProcessType.WalletCreation);
          this.syncStatusService.startSync(walletSyncProcess);
          resolve(walletSyncProcess);
        });
    });
  }

  endCreateWalletProcess(walletSyncProcess: SyncProcess) {
    this.syncStatusService.endSync(walletSyncProcess);
  }

  isWalletValide(wallet: WalletCreation): boolean {
    let isValid = true;
    isValid = isValid && !this.isNullOrEmpty(wallet.friendlyName);
    if (isValid && wallet.encryptWallet) {
      isValid = !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.Wallet]);
    }

    if (isValid && wallet.encryptKey && !wallet.encryptKeysIndividualy) {
      isValid = !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.TransactionKey]);
    }

    if (isValid && wallet.encryptKey && wallet.encryptKeysIndividualy) {
      isValid = !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.ChangeKey])
        && !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.MessageKey])
        && !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.SuperKey])
        && !this.isNullOrEmpty(wallet.passPhrases[EncryptionKey.TransactionKey]);
    }

    return isValid;
  }

  private isNullOrEmpty(text: string) {
    return !text || text === '';
  }

  getWallet(): Observable<Wallet> {
    return this.selectedWallet;
  }

  get currentAccount(): WalletAccount {
    return this.currentAccountSubject.value;
  }

  get isCurrentAccountSet(): boolean {
    return this.currentAccount && this.currentAccount !== NO_WALLET_ACCOUNT;
  }

  getCurrentAccount(): Observable<WalletAccount> {
    return this.currentAccountSubject;
  }

  setCurrentAccount(account: WalletAccount) {
    this.serverConnectionService.callSetActiveAccount(this.currentBlockchainId, account.accountCode).then(() => {
      this.reloadCurrentAccount(account);
    });
  }

  queryWalletAccountDetails(account: WalletAccount){
    return this.serverConnectionService.callQueryWalletAccountDetails(this.currentBlockchainId, account.accountCode);
  }
  reloadCurrentAccount(account: WalletAccount) {
    this.serverConnectionService.callQueryWalletAccountDetails(this.currentBlockchainId, account.accountCode).then(activeAccount => {
      this.currentAccountSubject.next(activeAccount);
    });
  }

  bypassAppointmentVerification(): Promise<boolean> {
    if (this.currentBlockchainId === 0) {
      return new Promise<boolean>((resolve, reject) => {
        reject(false);
      });
    }
    return this.serverConnectionService.callBypassAppointmentVerification(this.currentBlockchainId, this.currentAccount.accountCode);
  }

  GetAppointmentDetails(): Promise<WalletAccountAppointment> {
    if (this.currentBlockchainId === 0) {
      return new Promise<WalletAccountAppointment>((resolve, reject) => {
        reject(null);
      });
    }
    return this.serverConnectionService.callQueryWalletAccountAppointmentDetails(this.currentBlockchainId, this.currentAccount.accountCode);
  }

  canPublishAccount(): Promise<AccountCanPublish> {
    if (this.currentBlockchainId === 0) {
      return new Promise<AccountCanPublish>((resolve, reject) => {
        reject(null);
      });
    }
    return this.serverConnectionService.callCanPublishAccount(this.currentBlockchainId, this.currentAccount.accountCode);
  }

  queryAppointmentConfirmationResult(): Promise<AccountAppointmentConfirmationResult> {
    if (this.currentBlockchainId === 0) {
      return new Promise<AccountAppointmentConfirmationResult>((resolve, reject) => {
        reject(null);
      });
    }
    return this.serverConnectionService.callQueryAppointmentConfirmationResult(this.currentBlockchainId, this.currentAccount.accountCode);
  }

  setSMSConfirmationCode(confirmationCode: string): Promise<boolean> {
    if (this.currentBlockchainId === 0) {
      return new Promise<boolean>((resolve, reject) => {
        reject(false);
      });
    }
    return this.serverConnectionService.callSetSMSConfirmationCode(this.currentBlockchainId, this.currentAccount.accountCode, confirmationCode);
  }

  RequestAppointment(preferredRegion: number): Promise<number> {
    if (this.currentBlockchainId === 0) {
      return new Promise<number>((resolve, reject) => {
        resolve(0);
      });
    }
    return this.serverConnectionService.callRequestAppointment(this.currentBlockchainId, this.currentAccount.accountCode, preferredRegion);
  }

  getWalletAccounts(): Promise<Array<WalletAccount>> {
    return new Promise<Array<WalletAccount>>((resolve, reject) => {
      this.serverConnectionService.callQueryWalletAccounts(this.currentBlockchainId)
        .then(accounts => {
          resolve(accounts);
        });
    });
  }


  loadWallet(blockChainId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.serverConnectionService.callWalletExists(blockChainId).then(callWalletExistsResponse => {
        if (callWalletExistsResponse === true) {

          this.serverConnectionService.callIsWalletLoaded(blockChainId).then(callIsWalletLoadedResponse => {
            if (callIsWalletLoadedResponse === false) {

              this.serverConnectionService.callLoadWallet(blockChainId, '')
                .then(longRunningContextId => {

                  const unsubscribe$ = new Subject<void>();
                  this.serverConnectionService.eventNotifier.pipe(takeUntil(unsubscribe$)).subscribe((event) => {
                    if (event.correlationId === longRunningContextId) {
                      switch (event.eventType) {
                        case EventTypes.WalletLoadingEnded:
                          unsubscribe$.next();
                          unsubscribe$.complete();
                          resolve(true);
                          break;
                        case EventTypes.WalletLoadingError:
                          unsubscribe$.next();
                          unsubscribe$.complete();
                          resolve(false);
                          break;
                        default:
                          return;
                      }
                    }
                  });
                });
            } else {
              resolve(true);
            }
          });
        } else {
          resolve(false);
        }
      });
    });
  }

  setWallet(blockchainId: number, wallet: Wallet) {

    const syncProcess = SyncProcess.createNew(DateTime.local().millisecond * Math.random(), 'Set wallet to blockchain cache', ProcessType.SyncingWallet);
    this.syncStatusService.startSync(syncProcess);
    this.currentBlockchainId = blockchainId;
    this.selectedWallet.next(wallet);
    this.getWalletAccounts()
      .then(accounts => {
        wallet.accounts = accounts;
        if (wallet.accounts && wallet.accounts.length > 0) {
          wallet.accounts.forEach(account => {
            if (account.isActive) {
              this.serverConnectionService.callQueryWalletAccountDetails(this.currentBlockchainId, account.accountCode).then(activeAccount => {
                this.currentAccountSubject.next(activeAccount);
              });
            }
          });
        }
      })
      .finally(() => {
        this.wallets[blockchainId] = wallet;
        this.changeWallet(blockchainId);
        this.syncStatusService.endSync(syncProcess);
      });
  }

  changeWallet(blockchainId: number) {
    const wallet = this.wallets[blockchainId];
    this.selectedWallet.next(wallet);
  }

  publishAccount(accountCode: string) {
    this.serverConnectionService.callPublishAccount(this.currentBlockchainId, accountCode);
  }

  refreshWallet(blockchainId: number): Promise<Wallet> {

    return new Promise<Wallet>((resolve, reject) => {

      if (blockchainId && blockchainId !== 0) {
        this.serverConnectionService.callQueryWalletInfo(blockchainId).then(walletInfo => {
          const wallet = Wallet.createNew(walletInfo);
          this.setWallet(blockchainId, wallet);
          resolve(wallet);
        }).catch(error => {
          reject(error);
        });
      }
    });
  }
}
