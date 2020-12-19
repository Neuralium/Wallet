import { Component, OnInit, OnDestroy } from '@angular/core';
import { Pages } from '../..//model/ui-config';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-receive',
  templateUrl: './receive.component.html',
  styleUrls: ['./receive.component.css']
})
export class ReceiveComponent implements OnInit, OnDestroy {
  title = Pages.Receive.label;
  icon = Pages.Receive.icon;

  constructor() { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
