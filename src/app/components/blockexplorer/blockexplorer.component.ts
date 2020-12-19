import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BlockchainService } from '../..//service/blockchain.service';
import { ServerConnectionService } from '../..//service/server-connection.service';
import { NO_BLOCKCHAIN_INFO, BlockchainInfo } from '../..//model/blockchain-info';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-tools-blockexplorer',
  templateUrl: './blockexplorer.component.html',
  styleUrls: ['./blockexplorer.component.scss']
})
export class BlockExplorerComponent implements OnInit, OnDestroy {
 
  blockSource:object;
  blockId:number;
  blockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;


  constructor(
    private blockchainService: BlockchainService,
    private _ngZone: NgZone,
    private serverConnection: ServerConnectionService,
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

  canSearch(){
    return this.blockId > 0 && ((!this.blockchainInfo || this.blockchainInfo.blockInfo.id == 0) || this.blockId <= this.blockchainInfo.blockInfo.id);
  }

  search(){

    if(this.canSearch()){
      this.blockchainService.queryBlockJson(this.blockId).then(json => {

        if(json){
          this.blockSource = JSON.parse(json);
        }
        else{
          this.blockSource = JSON.parse('{}');
        }
      }).catch(error => console.log(error));
    }
  }

  initialiseValues(){
    this.blockSource = JSON.parse('{}');
    this.blockId = 0;
  }
}
