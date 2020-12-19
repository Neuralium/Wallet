import { Component, OnInit, OnDestroy } from '@angular/core';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-server-connection-test',
  templateUrl: './server-connection-test.component.html',
  styleUrls: ['./server-connection-test.component.css']
})
export class ServerConnectionTestComponent implements OnInit, OnDestroy {

  constructor(private serverConnectionService:ServerConnectionService) { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }
 

  ping(){
    this.serverConnectionService.ping();
  }

}
