import { Component, OnInit, OnDestroy , NgZone} from '@angular/core';
import { BlockchainService } from '../../service/blockchain.service'
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  showNeuraliums: boolean = false;
  showNotifications: boolean = false;
  neuraliumTotal: string;

  constructor(
    private _ngZone: NgZone,
    private blockchainService: BlockchainService) { }

    private unsubscribe$ = new Subject<void>();


    ngOnDestroy(): void {
         this.unsubscribe$.next();
         this.unsubscribe$.complete();
       }
   
  ngOnInit() {
    this.blockchainService.selectedBlockchain.pipe(takeUntil(this.unsubscribe$)).subscribe(blockchain => {
      this._ngZone.run(() => {
        this.showNotifications = blockchain.menuConfig.showReceive;
      });


      
    })
  }

}
