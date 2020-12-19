import { ServerConnectionService } from '../..//service/server-connection.service';
import { TotalNeuralium } from '../..//model/total-neuralium';
import { CommonCall } from './commonCall';
import { LogService } from '../..//service/log.service';
import { TimelineEntry, TimelineDay, TimelineHeader, EntryDirection, EntryCreditType } from '../..//model/timeline';
import { NeuraliumTransaction, TransactionStatuses, TransactionVersion, TransactionType } from '../..//model/transaction';
import { DateTime } from 'luxon';

export class NeuraliumCall extends CommonCall {

    private constructor(
        protected serviceConnectionService: ServerConnectionService,
        logService: LogService) {
        super(serviceConnectionService, logService);
    }

    static create(
        serviceConnectionService: ServerConnectionService,
        logService: LogService) {
        return new NeuraliumCall(serviceConnectionService, logService);
    }

    callQueryAccountTotalNeuraliums(accountCode: string): Promise<TotalNeuralium> {
        return new Promise<TotalNeuralium>((resolve, reject) => {

            this.logEvent('QueryAccountTotalNeuraliums - call', { 'accountCode': accountCode });
            this.serviceConnectionService.invoke<object>('QueryAccountTotalNeuraliums', accountCode)
                .then(
                    response => {
                        this.logEvent('QueryAccountTotalNeuraliums - response', response);
                        const total = Number(response['total']);
                        const debit = Number(response['reservedDebit']);
                        const credit = Number(response['reservedCredit']);
                        const frozen = Number(response['frozen']);
                        resolve(TotalNeuralium.create(total, credit, debit, frozen));
                    })
                .catch(reason => {
                    reject('QueryAccountTotalNeuraliums error : ' + reason);
                });
        });
    }

    callSendNeuraliums(targetAccountId: string, amount: number, tip: number, note: string = ''): Promise<number> {
        return new Promise<number>((resolve, reject) => {

            this.logEvent('sendNeuraliums - call', { 'targetAccountId': targetAccountId, 'amount': amount, 'tip': tip });
            this.serviceConnectionService.invoke<number>('SendNeuraliums', targetAccountId, amount, tip, note)
                .then(
                    response => {
                        this.logEvent('sendNeuraliums - response', response);
                        resolve(response);
                    })
                .catch(reason => {
                    reject('Send Neuraliums error : ' + reason);
                });
        });
    }

    callQueryNeuraliumTimelineHeader(accountCode: string): Promise<TimelineHeader> {

        return new Promise<TimelineHeader>((resolve, reject) => {
            if (accountCode === undefined) {
                reject();
            }

            this.logEvent('QueryNeuraliumTimelineHeader - call', { accountCode });
            this.serviceConnectionService.invoke<Array<object>>('QueryNeuraliumTimelineHeader', accountCode)
                .then(
                    response => {
                        this.logEvent('QueryNeuraliumTimelineHeader - response', response);

                        const firstDay = DateTime.fromISO(response['firstDay']).toLocal();
                        const lastDay = DateTime.fromISO(response['lastDay']).toLocal();

                        const days = <Array<object>>response['days'];

                        const adjustedDays:Array<DateTime> = [];

                        Object.keys(days).forEach(year => {
                            let yearEntry = days[year];

                            Object.keys(yearEntry).forEach(month => {
                                let monthEntry = <Array<number>>(yearEntry[month]);

                                monthEntry.forEach(day => {
                                    adjustedDays.push(DateTime.fromObject({ day: Number(day), month: Number(month), year: Number(year) }));
                                });
                            });
                        }); 

                        const header = TimelineHeader.create(firstDay, lastDay, days, adjustedDays);
                        resolve(header);
                    })
                .catch(reason => {
                    reject('QueryNeuraliumTimelineHeader error : ' + reason);
                });
        });

    }

    createTimelineDayForTest(date: string): TimelineDay {

        // const convertedDate:  DateTime = moment.default(date);
        // const timelineDay = TimelineDay.create(convertedDate, 1, 20.2365);
        // const entryWithTransaction = TimelineEntry.create('1', new Date(Date.parse(date + ' 17:40:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true);
        // entryWithTransaction.transaction = new NeuraliumTransaction('123456', '456', new Date(Date.now()), new TransactionVersion(TransactionType.DEBUG, 1, 1), null, TransactionStatuses.Confirmed, true, 'notation', '789', 500, 5);
        // timelineDay.entries.push(entryWithTransaction);
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 15:30:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 15:45:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 16:00:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 16:30:00')), 'SF', 'SG', 0.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 16:45:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 17:00:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 17:30:00')), 'SF', 'SG', 0.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 17:45:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 15:45:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 16:00:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 16:30:00')), 'SF', 'SG', 0.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 16:45:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.election, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 17:00:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 17:30:00')), 'SF', 'SG', 0.256458, 0.000025, 0, EntryDirection.credit, EntryCreditType.transaction, true));
        // timelineDay.entries.push(TimelineEntry.create('1', new Date(Date.parse(date + ' 17:45:00')), 'SF', 'SG', 10.256458, 0.000025, 0, EntryDirection.debit, EntryCreditType.none, true));
        // timelineDay.entries = timelineDay.entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        // return timelineDay;
        return null;
    }

    callQueryNeuraliumTimelineSection(accountCode: string, day: DateTime): Promise<TimelineDay> {

        // return new Promise<Array<TimelineDay>>((resolve, reject) => {
        //     var list = new Array<TimelineDay>();
        //     list.push(this.createTimelineDayForTest("05/22/2019"));
        //     list.push(this.createTimelineDayForTest("05/23/2019"));
        //     list.push(this.createTimelineDayForTest("05/24/2019"));
        //     list.push(this.createTimelineDayForTest("05/25/2019"));
        //     list.push(this.createTimelineDayForTest("05/26/2019"));
        //     list.push(this.createTimelineDayForTest("05/27/2019"));
        //     list.push(this.createTimelineDayForTest("05/28/2019"));
        //     list.push(this.createTimelineDayForTest("05/29/2019"));
        //     list.push(this.createTimelineDayForTest("05/30/2019"));
        //     resolve(list.slice(skip,skip+take));
        // });


        return new Promise<TimelineDay>((resolve, reject) => {

            if (!day.isValid) {
                resolve(null);
                return;
            }

            this.logEvent('QueryNeuraliumTimelineSection - call', { accountCode, day });
            this.serviceConnectionService.invoke<object>('QueryNeuraliumTimelineSection', accountCode, day)
                .then(
                    element => {
                        this.logEvent('QueryNeuraliumTimelineSection - response', element);

                        // since this is UTC, we take the components to take the UTC date.
                        const Day = DateTime.fromISO(element['day']).toLocal();
                        const EndingTotal = <number>Number(element['endingTotal']);

                        const timelineDay = TimelineDay.create(Day, EndingTotal);
                        const Entries = <Array<any>>element['entries'];
                        Entries.forEach(item => {
                            const TransactionId = item['transactionId'];
                            const Timestamp = DateTime.fromISO(item['timestamp']).toLocal();
                            const SenderAccountId = item['senderAccountId'];
                            const RecipientAccountIds = item['recipientAccountIds'];
                            const Amount = <number>Number(item['amount']);
                            const Tips = <number>Number(item['tips']);
                            const Total = <number>Number(item['total']);
                            const Direction = <EntryDirection>Number(item['direction']);
                            const CreditType = <EntryCreditType>Number(item['creditType']);
                            const Confirmed = <boolean>Boolean(item['confirmed']);
                            const Entry = TimelineEntry.create(TransactionId, Timestamp, SenderAccountId, RecipientAccountIds, Amount, Tips, Total, Direction, CreditType, Confirmed);
                            timelineDay.entries.push(Entry);
                        });
                        // sort from youngest to oldest
                        timelineDay.entries = timelineDay.entries.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

                        resolve(timelineDay);
                    })
                .catch(reason => {
                    reject('QueryNeuraliumTimelineSection error : ' + reason);
                });
        });

    }

}
