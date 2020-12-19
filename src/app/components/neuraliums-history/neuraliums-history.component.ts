import { Component, OnInit, OnDestroy, ViewEncapsulation, NgZone } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { NeuraliumService } from '../..//service/neuralium.service';
import { TimelineHeader, TimelineDay, TimelineEntry, EntryType } from '../..//model/timeline';
import { ContactsService } from '../..//service/contacts.service';
import { NO_NEURALIUM_TRANSACTION, NeuraliumTransaction } from '../..//model/transaction';
import { TransactionsService } from '../..//service/transactions.service';
import { NotificationService } from '../..//service/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatCalendarCellClassFunction, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-neuraliums-history',
  templateUrl: './neuraliums-history.component.html',
  styleUrls: ['./neuraliums-history.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('sizeChange', [
      state('close', style({
        display: 'none',
        height: '0%',
        opacity: 0
      })),
      state('open', style({
        height: '90%',
        opacity: 1
      })),
      transition('*=>close', animate(300)),
      transition('*=>open', animate(300))
    ])
  ]
})
export class NeuraliumsHistoryComponent implements OnInit, OnDestroy {

  startDate: string = '';
  selectedDate: DateTime;
  minDate: string = '';
  maxDate: string = '';

  pageSize = 10;
  totalMessageCount = 0;
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];
  sliceStart = 0;
  sliceEnd: number = this.pageSize;
  //@ViewChild('messagePaginator', { static: false }) private paginator: MatPaginator;

  constructor(
    private contactService: ContactsService,
    private _ngZone: NgZone,
    private neuraliumService: NeuraliumService,
    private transactionService: TransactionsService,
    private notificationService: NotificationService,
    private translateService: TranslateService) {

    this.selectedDate = DateTime.local();
    this.startDate = this.selectedDate.toISO();
    this.neuraliumService.selectedDate = this.selectedDate;

  }

  get timelineHeader(): TimelineHeader {
    return this.neuraliumService.timelineHeader;
  }

  get timeline(): TimelineDay {
    return this.neuraliumService.timeline;
  }

  get hasPeriod() {
    if (this.timeline) {
      return true;
    }
    return false;
  }

  get period() {
    return this.timeline;
  }
  ngOnInit() {
    this.neuraliumService.neuraliumTimelineHeader.pipe(takeUntil(this.unsubscribe$)).subscribe(header => {

      this._ngZone.run(() => {
        this.maxDate = DateTime.local().toISO();
      this.minDate = header.lastDay.toISO();
      });

      
    });
    // this.neuraliumService.neuraliumTimeline.pipe(takeUntil(this.unsubscribe$)).subscribe(timeline => {

    // });

  }

  ngAfterViewInit() {
    //this.neuraliumService.getMiningTimelineSection(false);
  }
  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  isDebit(entry: TimelineEntry): boolean {
    return entry.type === EntryType.debit;
  }

  isCredit(entry: TimelineEntry): boolean {
    return entry.type === EntryType.credit;
  }

  isMining(entry: TimelineEntry): boolean {
    return entry.type === EntryType.mining;
  }

  isUbb(entry: TimelineEntry): boolean {
    return entry.type === EntryType.ubb;
  }
  

  getAccountName(accountId: string) {
    let contact = this.contactService.getContact(accountId);
    if (contact !== undefined) {
      return '- ' + contact.friendlyName;
    } else {
      return '';
    }
  }

  getAccountNames(accountIds: string) {

    const entries = accountIds.split(',');

    const results: Array<string> = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = this.getAccountName(entries[i].trim());

      results.push(entry);
    }

    return results.join(',');
  }

  showTransaction(entry: TimelineEntry) {
    if (this.isMining(entry)) {
      // we do nothing on mining entries
      return;
    }

    if (!entry.transaction || entry.transaction === NO_NEURALIUM_TRANSACTION) {
      this.transactionService.getTransactionDetails(entry.transactionId)
        .then(transaction => {
          if (transaction) {
            entry.transaction = <NeuraliumTransaction>transaction;
            entry.showDetails = true;
            entry.lightState = 'close';
            entry.detailsState = 'open';
          } else {
            this.translateService.get('neuralium.NoTransaction').subscribe(message => {
              this.notificationService.showWarn(message);
            });
          }
        });
    } else {
      entry.showDetails = true;
      entry.lightState = 'close';
      entry.detailsState = 'open';
    }
  }

  hideTransaction(entry: TimelineEntry) {

    if (this.isMining(entry)) {
      // we do nothing on mining entries
      return;
    }

    entry.showDetails = false;
    entry.lightState = 'open';
    entry.detailsState = 'close';
  }

  setPage(event) {

    this.sliceStart = event.pageIndex * event.pageSize;
    this.sliceEnd = this.sliceStart + event.pageSize;
  }

  dateClass: MatCalendarCellClassFunction<Date> = (cellDate, view) => {
    // Only highligh dates inside the month view.
    if (view === 'month') {

      // highlight the days with data
      const date = DateTime.fromJSDate(cellDate);

      const year = <Array<object>>this.timelineHeader.rawDays[date.year];

      if (year) {
        const month = <Array<number>>year[date.month];

        if (month) {
          if (month.includes(date.day)) {
            return 'date-with-data';
          }
        }
      }
    }

    return '';
  }

  addEvent(type: string, event: MatDatepickerInputEvent<Date>) {
    if (type === 'input') {

    }
    else if (type === 'change') {
      this.selectedDate = DateTime.fromJSDate(event.value);
      this.neuraliumService.selectedDate = this.selectedDate;
      this.neuraliumService.getMiningTimelineSection(false);
    }
  }
}
