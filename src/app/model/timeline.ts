import { NeuraliumTransaction, NO_TRANSACTION, NO_NEURALIUM_TRANSACTION } from './transaction';
import { DateTime } from 'luxon';


export enum EntryType {
    debit = 0,
    credit = 1,
    mining = 2
}

export enum EntryDirection {
    debit = 1,
    credit = 2
}

export enum EntryCreditType {
    none = 0,
    transaction = 1,
    election = 2
}

export class TimelineHeader {
    numberOfDays: number;
    firstDay:  DateTime;

    private constructor() { }

    static create(numberOfDays: number, firstDay:  DateTime) {
        const header = new TimelineHeader();
        header.numberOfDays = numberOfDays;
        header.firstDay = firstDay;
        return header;
    }
}

export class TimelineDay {
    day:  DateTime;
    id: number;
    endingTotal: number;
    entries: Array<TimelineEntry>;

    private constructor() { }

    static create(day:  DateTime, id: number, endingTotal: number) {
        const timelineDay = new TimelineDay();
        timelineDay.day = day;
        timelineDay.id = id;
        timelineDay.endingTotal = endingTotal;
        timelineDay.entries = new Array<TimelineEntry>();
        return timelineDay;
    }
}

export class TimelineEntry {
    transactionId:string;
    timestamp:  DateTime;
    senderAccountId: string;
    recipientAccountIds: string;
    amount: number;
    tips: number;
    total: number;
    type: EntryType;
    confirmed: boolean;
    transaction: NeuraliumTransaction = NO_NEURALIUM_TRANSACTION;
    showDetails:boolean = false;
    lightState:string = 'open';
    detailsState:string = 'close';

    private constructor() { }

    get showTransaction():boolean{
        return this.showDetails && this.transaction !== null && this.transaction !== NO_NEURALIUM_TRANSACTION;
    }

    static create(transactionId:string, timestamp:  DateTime, senderAccountId: string, recipientAccountIds: string,
        amount: number, tips: number, total: number, direction: EntryDirection, creditType: EntryCreditType, confirmed: boolean) {
        const timelineEntry = new TimelineEntry();
        timelineEntry.transactionId = transactionId;
        timelineEntry.timestamp = timestamp;
        timelineEntry.senderAccountId = senderAccountId;
        timelineEntry.recipientAccountIds = recipientAccountIds;
        timelineEntry.amount = amount;
        timelineEntry.tips = tips;
        timelineEntry.total = total;
        if (direction === EntryDirection.debit) {
            timelineEntry.type = EntryType.debit;
        }
        else {
            switch (creditType) {
                case EntryCreditType.election:
                    timelineEntry.type = EntryType.mining;
                    break;
                default:
                    timelineEntry.type = EntryType.credit;
                    break;
            }
        };
        timelineEntry.confirmed = confirmed;
        timelineEntry.transaction = null;
        return timelineEntry;
    }
}