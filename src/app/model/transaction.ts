import { DateTime } from 'luxon';


export class Transaction {
    id: string;
    source: string;
    date:  DateTime;
    version: TransactionVersion;
    object:string;
    details: any;
    status: TransactionStatuses;
    local:boolean;
    note:string;
    recipient : string;

    constructor(id: string, source: string, date:  DateTime, version: TransactionVersion, details: object, status: TransactionStatuses, local:boolean, note:string = "", recipient:string = ""){
        this.id = id;
        this.source = source;
        this.date = date;
        this.version = version;
        this.object =  TransactionType[version.TransactionType];
        this.details = details;
        this.status = status;
        this.local = local;
        this.note = note;
        this.recipient = recipient;
    }

    get statusName():string{
        return TransactionStatuses[this.status];
    }
}

export class NeuraliumTransaction extends Transaction{

    amount:number;
    tip:number;

    constructor(id: string, source: string, date:  DateTime, version: TransactionVersion, details: object, status: TransactionStatuses, local:boolean, note:string = "", recipient:string = "", amount:number, tip:number){
        super(id,source,date,version,details,status,local,note, recipient);
        this.amount = amount;
        this.tip = tip;
    }

    get total():number{
        return this.amount + this.tip;
    }
}

export class TransactionVersion {
    TransactionType: number;
    Major: number;
    Minor: number;

    constructor(type:number, major:number, minor:number){
        this.Major = major;
        this.Minor = minor;
        this.TransactionType = type;
    }
}

export const NO_TRANSACTION = <Transaction>{

}

export const NO_NEURALIUM_TRANSACTION = <NeuraliumTransaction>{

}

export enum TransactionStatuses {
    New = 0,
    Dispatched = 1,
    Confirmed = 2,
    Rejected = 3
}

export enum TransactionType {
    GENESIS = 1,
    SIMPLE_PRESENTATION = 2,
    JOINT_PRESENTATION = 3,
    KEY_CHANGE = 4,
    ACCREDITATION_CERTIFICATE = 5,
    SET_ACCOUNT_RECOVERY = 6,
    MODERATION_KEY_CHANGE = 1007,
    MODERATION_SECRET_KEY_CHANGE = 1008,
    MODERATION_ACCOUNT_RESET = 1009,
    MODERATION_ACCOUNT_RESET_WARNING = 1010,
    MODERATION_RECLAIM_ACCOUNTS = 1011,
    MODERATION_PRESENTATION = 1012,
    MODERATION_OPERATING_RULES = 1013,
    DEBUG = 1014,
    NONE = 1015,

    NEURALIUM_TRANSFER = 10001,
    NEURALIUM_MULTI_TRANSFER = 10002,
    NEURALIUM_MODERATOR_DESTROY_TOKENS = 10003,
    NEURALIUM_REFILL_NEURLIUMS = 10004
}