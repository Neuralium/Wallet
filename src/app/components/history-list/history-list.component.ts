import { Component, OnInit, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-history-list',
  templateUrl: './history-list.component.html',
  styleUrls: ['./history-list.component.scss']
})
export class HistoryListComponent implements OnInit, OnDestroy {

  constructor() { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }
 

}
