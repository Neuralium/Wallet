import { Component, OnInit, Input, Output, EventEmitter, OnDestroy ,NgZone} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-tools-apiexplorer',
  templateUrl: './apiexplorer.component.html',
  styleUrls: ['./apiexplorer.component.scss']
})
export class ApiExplorerComponent implements OnInit, OnDestroy {
 
  result:object;
  method:string;
  parameters:string;
  blockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;


  constructor(
    private blockchainService: BlockchainService,
    private serverConnection: ServerConnectionService,
    private _ngZone: NgZone,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.initialiseValues();

    this.serverConnection.serverConnection.pipe(takeUntil(this.unsubscribe$)).subscribe((connected) => {
      if(connected === true){
        this.blockchainService.getBlockchainInfo().pipe(takeUntil(this.unsubscribe$)).subscribe(blockchainInfo => {
          this._ngZone.run(() => {
            this.blockchainInfo = blockchainInfo;
          });
         
        })
      }
    });
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  

  canQuery(){
     if(this.method){
      return true;
     }

     return false;
  }

  runQuery(){

    if(this.canQuery()){
      this.blockchainService.runApiQuery(this.method, this.parameters).then(json => {

        try{
          try{
          this.result = JSON.parse(json);
          }
          catch{
            this.result = <Object>json;
          }
        }
        catch{
          this.result = JSON.parse('{}');
        }

      }).catch(error => {
        console.log(error)
        this.result = JSON.parse(error);
      });
    }
  }

  initialiseValues(){
    this.result = JSON.parse('{}');
    this.method = '';
    this.parameters = '';
  }
}
