import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { WalletCreation } from '../..//model/wallet';
import { WalletAccount, WalletAccountStatus, WalletAccountVerification, WalletAccountType, AccountCanPublish, AccountAppointmentConfirmationResult, AccountPublicationModes } from '../..//model/walletAccount';
import { WalletAccountAppointment, AppointmentStatus } from '../..//model/walletAccountAppointment';
import { DateTime } from 'luxon';

export class WalletCall extends CommonCall {

  private constructor(
    protected serviceConnectionService: ServerConnectionService,
    logService: LogService) {
    super(serviceConnectionService, logService);
  }

  static create(
    serviceConnectionService: ServerConnectionService,
    logService: LogService) {
    return new WalletCall(serviceConnectionService, logService);
  }

  callCreateNewWallet(chainType: number, wallet: WalletCreation): Promise<number> {
    return new Promise<number>((resolve, reject) => {

      this.logEvent('callCreateNewWallet - call', { 'chainType': chainType, 'wallet': wallet });
      this.serviceConnectionService.invoke<number>('CreateNewWallet', chainType, wallet.friendlyName, wallet.accountType, wallet.encryptWallet, wallet.encryptKey, wallet.encryptKeysIndividualy, wallet.passPhrases, wallet.publishAccount)
        .then(
          response => {
            this.logEvent('callCreateNewWallet - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('CreateNewWallet error : ' + reason);
        });
    });
  }

  callSetWalletPassphrase(correlationId: number, password: string, setKeysToo: boolean) {
    return new Promise<number>((resolve, reject) => {

      this.logEvent('setWalletPassphrase - call', { 'correlationId': correlationId, 'password': password, 'setKeysToo': setKeysToo });
      this.serviceConnectionService.invoke<number>('SetWalletPassphrase', correlationId, password, setKeysToo)
        .then(
          response => {
            this.logEvent('setWalletPassphrase - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('SetWalletPassphrase error : ' + reason);
        });
    });
  }

  callSetKeysPassphrase(correlationId: number, password: string) {
    return new Promise<number>((resolve, reject) => {

      this.logEvent('setKeysPassphrase - call', { 'correlationId': correlationId, 'password': password });
      this.serviceConnectionService.invoke<number>('SetKeysPassphrase', correlationId, password)
        .then(
          response => {
            this.logEvent('setKeysPassphrase - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('SetKeysPassphrase error : ' + reason);
        });
    });
  }

  callQueryWalletAccounts(chainType: number) {
    return new Promise<Array<WalletAccount>>((resolve, reject) => {

      this.logEvent('queryWalletAccounts - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<Array<WalletAccount>>('QueryWalletAccounts', chainType)
        .then(
          response => {
            this.logEvent('queryWalletAccounts - response', response);
            const walletAccounts = new Array<WalletAccount>();
            response.forEach(account => {
              const accountCode: string = account.accountCode;
              const accountId: string = <string>account.accountId;
              const status: number = <WalletAccountStatus>account.status;
              const verification: number = <number>account.verification;
              const friendlyName: string = account.friendlyName;
              const isActive: boolean = <boolean>account.isActive;
              const accountType: WalletAccountType = <WalletAccountType>(account.accountType);

              const walletAccount = WalletAccount.createNew(accountCode, accountId, status, 0, accountType, friendlyName, false, isActive, false, WalletAccountVerification.Unknown, null, null, false, false);
              walletAccounts.push(walletAccount);
            });
            resolve(walletAccounts);
          })
        .catch(reason => {
          reject('QueryWalletAccounts error : ' + reason);
        });
    });
  }

  callQueryWalletAccountDetails(chainType: number, accountCode: string) {
    return new Promise<WalletAccount>((resolve, reject) => {

      this.logEvent('QueryWalletAccountDetails - call', { chainType, accountCode });
      this.serviceConnectionService.invoke<Array<WalletAccount>>('QueryWalletAccountDetails', chainType, accountCode)
        .then(
          account => {
            this.logEvent('QueryWalletAccountDetails - response', account);
            const accountCodeReceived: string = account['accountCode'];
            const accountId: string = account['accountId'];
            const status: WalletAccountStatus = <WalletAccountStatus>account['status'];
            const declarationBlockId = <number>account['declarationBlockId'];
            const accountType = <WalletAccountType>account['accountType'];
            const friendlyName: string = account['friendlyName'];
            const isEncrypted: boolean = <boolean>account['keysEncrypted'];
            const isActive: boolean = <boolean>account['isActive'];
            const accountHash = account['accountHash'];
            const trustLevel = account['trustLevel'];
            const inAppointment: boolean =  <boolean>account['inAppointment'];
            let verificationExpiration: DateTime | null = null;
            let verificationExpirationWarning: DateTime | null = null;
            const verification: WalletAccountVerification = <WalletAccountVerification>account['verification'];
            const verificationExpiring: boolean = <boolean>account['verificationExpiring'];
            const verificationExpired: boolean = <boolean>account['isActiverificationExpiredve'];
            let temp: string | null = account['verificationExpiration'];

            if (temp) {
              verificationExpiration = DateTime.fromISO(temp).toUTC();
            }


            temp = account['verificationExpirationWarning'];

            if (temp) {
              verificationExpirationWarning = DateTime.fromISO(temp).toUTC();
            }

            const walletAccount = WalletAccount.createNew(accountCodeReceived, accountId, status, declarationBlockId, accountType, friendlyName, isEncrypted, isActive, inAppointment, verification, verificationExpirationWarning, verificationExpiration, verificationExpiring, verificationExpired, accountHash, trustLevel);
            resolve(walletAccount);
          })
        .catch(reason => {
          reject('QueryWalletAccountDetails error : ' + reason);
        });
    });
  }

  callBypassAppointmentVerification(chainType: number, accountCode: string) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('BypassAppointmentVerification - call', { accountCode });
      this.serviceConnectionService.invoke<boolean>('BypassAppointmentVerification', accountCode)
        .then(result => {
           resolve(result);
          })
        .catch(reason => {
          reject('BypassAppointmentVerification error : ' + reason);
        });
    });
  }

  callQueryWalletAccountAppointmentDetails(chainType: number, accountCode: string) {
    return new Promise<WalletAccountAppointment>((resolve, reject) => {

      this.logEvent('QueryWalletAccountAppointmentDetails - call', { chainType, accountCode });
      this.serviceConnectionService.invoke<Object>('QueryWalletAccountAppointmentDetails', chainType, accountCode)
        .then(
          account => {
            this.logEvent('QueryWalletAccountAppointmentDetails - response', account);

            const Status: AppointmentStatus = account['status'];
            const AppointmentConfirmationId: number | null = account['appointmentConfirmationId'];

            let appointmentRequestTimeStamp:  DateTime | null = null;
            let AppointmentTime:  DateTime | null = null;
            let AppointmentContextTime:  DateTime | null = null;
            let AppointmentVerificationTime:  DateTime | null = null;
            let AppointmentConfirmationIdExpiration:  DateTime | null = null;

            let temp: string | null = account['appointmentRequestTimeStamp'];

            if (temp) {
              appointmentRequestTimeStamp = DateTime.fromISO(temp).toUTC();
            }

            temp = account['appointmentTime'];

            if (temp) {
              AppointmentTime = DateTime.fromISO(temp).toUTC();
            }

            temp = account['appointmentContextTime'];

            if (temp) {
              AppointmentContextTime = DateTime.fromISO(temp).toUTC();
            }

            temp = account['appointmentVerificationTime'];

            if (temp) {
              AppointmentVerificationTime = DateTime.fromISO(temp).toUTC();
            }

            temp = account['appointmentConfirmationIdExpiration'];

            if (temp) {
              AppointmentConfirmationIdExpiration = DateTime.fromISO(temp).toUTC();
            }

            const AppointmentWindow: number | null = account['appointmentWindow'];

            const appointment = WalletAccountAppointment.createNew(Status, AppointmentConfirmationId, appointmentRequestTimeStamp, AppointmentTime, AppointmentContextTime, AppointmentVerificationTime, AppointmentConfirmationIdExpiration, AppointmentWindow);
            resolve(appointment);
          })
        .catch(reason => {
          reject('QueryWalletAccountAppointmentDetails error : ' + reason);
        });
    });
  }

  callRequestAppointment(chainType: number, accountCode: string, preferredRegion: number) {
    return new Promise<number>((resolve, reject) => {

      this.logEvent('RequestAppointment - call', { chainType, accountCode, preferredRegion });
      this.serviceConnectionService.invoke<number>('RequestAppointment', chainType, accountCode, preferredRegion)
        .then(
          result => {
            resolve(result);
          })
        .catch(reason => {
          reject('RequestAppointment error : ' + reason);
        });
    });
  }


  callQueryWalletSynced(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('QueryWalletSynced - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<boolean>('QueryWalletSynced', chainType)
        .then(
          response => {
            this.logEvent('QueryWalletSynced - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('QueryWalletSynced error : ' + reason);
        });
    });
  }

  callIsWalletLoaded(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('isWalletLoaded - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<boolean>('IsWalletLoaded', chainType)
        .then(
          response => {
            this.logEvent('isWalletLoaded - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('IsWalletLoaded error : ' + reason);
        });
    });
  }

  callWalletExists(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('walletExists - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<boolean>('WalletExists', chainType)
        .then(
          response => {
            this.logEvent('walletExists - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('WalletExists error : ' + reason);
        });
    });
  }

  callLoadWallet(chainType: number, passphrase: string) {
    return new Promise<number>((resolve, reject) => {

      this.logEvent('loadWallet - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<number>('LoadWallet', chainType, passphrase)
        .then(
          response => {
            this.logEvent('loadWallet - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('LoadWallet error : ' + reason);
        });
    });
  }

  callIsWalletSynced(chainType: number) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('isWalletSynced - call', { 'chainType': chainType });
      this.serviceConnectionService.invoke<boolean>('IsWalletSynced', chainType)
        .then(
          response => {
            this.logEvent('isWalletSynced - response', response);
            resolve(response);
          })
        .catch(reason => {
          reject('isWalletSynced error : ' + reason);
        });
    });
  }

  callCanPublishAccount(chainType: number, accountCode: string) {
    return new Promise<AccountCanPublish>((resolve, reject) => {

      this.logEvent('CanPublishAccount - call', { 'chainType': chainType, 'accountCode': accountCode });
      this.serviceConnectionService.invoke<AccountCanPublish>('CanPublishAccount', chainType, accountCode)
        .then(
          account => {
            this.logEvent('CanPublishAccount - response', account);

            const canPublish: boolean | null = account['canPublish'];
            const publishMode: AccountPublicationModes | null = account['publishMode'];
            const confirmationCode: string | null = account['confirmationCode'];
            const requesterId: string | null = account['requesterId'];

            const result = AccountCanPublish.createNew(canPublish, publishMode, confirmationCode, requesterId);
            resolve(result);
          })
        .catch(reason => {
          reject('CanPublishAccount error : ' + reason);
        });
    });
  }

  callQueryAppointmentConfirmationResult(chainType: number, accountCode: string) {
    return new Promise<AccountAppointmentConfirmationResult>((resolve, reject) => {

      this.logEvent('QueryAppointmentConfirmationResult - call', { 'chainType': chainType, 'accountCode': accountCode });
      this.serviceConnectionService.invoke<AccountAppointmentConfirmationResult>('QueryAppointmentConfirmationResult', chainType, accountCode)
        .then(
          account => {
            this.logEvent('QueryAppointmentConfirmationResult - response', account);

            const verified: boolean | null = account['verified'];
            const confirmationCode: string | null = account['confirmationCode'];

            const result = AccountAppointmentConfirmationResult.createNew(verified, confirmationCode);
            resolve(result);
          })
        .catch(reason => {
          reject('QueryAppointmentConfirmationResult error : ' + reason);
        });
    });
  }

  callSetSMSConfirmationCode(chainType: number, accountCode: string, confirmationCode: string) {
    return new Promise<boolean>((resolve, reject) => {

      this.logEvent('SetSMSConfirmationCodeString - call', { 'chainType': chainType, 'accountCode': accountCode, 'confirmationCode' : confirmationCode });
      this.serviceConnectionService.invoke<boolean>('SetSMSConfirmationCodeString', chainType, accountCode, confirmationCode)
        .then(result => {
            resolve(result);
          })
        .catch(reason => {
          reject('SetSMSConfirmationCodeString error : ' + reason);
        });
    });
  }

}
