import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { TranslateService } from '@ngx-translate/core';

import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-tools-utilities',
  templateUrl: './utilities.component.html',
  styleUrls: ['./utilities.component.scss']
})
export class UtilitiesComponent implements OnInit, OnDestroy {
 

  testingPort:boolean = false;

  constructor(
    private serverConnection: ServerConnectionService,
    private translateService: TranslateService,
    public dialog: MatDialog) { }

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  testP2pPort(){

    if(this.testingPort === false){
      this.testingPort = true;

      this.serverConnection.callTestP2pPort().then(result => {

        let key:string = '';
        if(result){
          key = 'utilities.PortSuccess';
        }
        else{
          key = 'utilities.portFailure';
        }
        this.translateService.get(key).subscribe((res: string) => {
          alert(res);
        });

      }).finally(() => {
          // ensure we lock it our for a minute to prevent abuse

          setTimeout(() => {
            this.testingPort = false;
          }, 1000 * 10);
      });
    }

  }

}
