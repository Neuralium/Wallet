import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-page-title',
  templateUrl: './page-title.component.html',
  styleUrls: ['./page-title.component.css']
})
export class PageTitleComponent implements OnInit, OnDestroy {
  @Input() title:string;
  @Input() icon:string;
  @Input() helpMessage:string;
  @Input() showNeuraliumsTotal:boolean = false;
  
  constructor() { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  

}
