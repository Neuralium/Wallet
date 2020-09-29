

export enum WalletAccountType {
    Unknown = 0,
    User = 1,
    Server = 2,
    Moderator = 3,
    Joint = 4
}


export enum WalletAccountStatus {
    Unknown = 0,
    New = 1,
    Dispatched = 2,
    Published = 3,
    Rejected = 255
}

export class WalletAccount {
    accountCode: string;
    accountId: string;
    status: WalletAccountStatus;
    declarationBlockId: number;
    correlated: number;
    accountType: WalletAccountType;
    friendlyName: string;
    isEncrypted: boolean;
    isActive: boolean;
    accountHash: string;
    trustLevel: number;
    inAppointment:boolean;

    static createNew(
        accountCode: string,
        accountId: string,
        status: WalletAccountStatus,
        declarationBlockId: number,
        correlated: number,
        accountType = WalletAccountType.User,
        friendlyName: string,
        isEncrypted: boolean,
        isActive: boolean,
        inAppointment:boolean,
        accountHash: string = '',
        trustLevel: number = 0) {
        const newAccount = new WalletAccount();
        newAccount.accountCode = accountCode;
        newAccount.accountId = accountId;
        newAccount.status = status;
        newAccount.declarationBlockId = declarationBlockId;
        newAccount.correlated = correlated;
        newAccount.accountType = accountType;
        newAccount.friendlyName = friendlyName;
        newAccount.isEncrypted = isEncrypted;
        newAccount.isActive = isActive;
        newAccount.inAppointment = inAppointment;
        newAccount.accountHash = accountHash;
        newAccount.trustLevel = trustLevel;

        return newAccount;
    }
}

/*
export class WalletKey {

    announcementBlockId: number;
    status: string;
}

export class XmssWalletKey inheritaccountCodes WalletKey{
    keyUseIndex: number;
    warningIndex: number;
    maximumUseIndex: number;
    hashBits: number;
    xmssTreeHeight: number;
}
*/


export const NO_WALLET_ACCOUNT = <WalletAccount>{
    accountCode: '',
    accountId: '',
    status: WalletAccountStatus.New,
    declarationBlockId: 0,
    correlated: 0,
    accountType: WalletAccountType.User,
    friendlyName: '',
    isEncrypted: false,
    isActive: false,
};


export class AccountAppointmentConfirmationResult {
    verified: boolean | null;
    confirmationCode:  string | null;

    static createNew(
        verified: boolean | null,
        confirmationCode:  string | null) {
        const result = new AccountAppointmentConfirmationResult();

        result.verified = verified;
        result.confirmationCode = confirmationCode;
        
        return result;
    }
}


export enum AccountPublicationModes {
    Unknown = 0,
            Appointment = 1,
            SMS = 2,
            Server = 3
}

export class AccountCanPublish {
    canPublish: boolean | null;
    publishMode: AccountPublicationModes | null;
    confirmationCode:  string | null;
    requesterId:string | null;

    static createNew(
        canPublish: boolean | null,
        publishMode: AccountPublicationModes | null,
        confirmationCode:  string | null,
        requesterId:string | null) {
        const result = new AccountCanPublish();

        result.canPublish = canPublish;
        result.publishMode = publishMode;
        result.confirmationCode = confirmationCode;
        result.requesterId = requesterId;
        
        return result;
    }
}