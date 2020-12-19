import { Component, OnInit, OnDestroy , NgZone} from '@angular/core';
import { NeuraliumService } from '../..//service/neuralium.service';
import { TotalNeuralium, NO_NEURALIUM_TOTAL } from '../..//model/total-neuralium';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-neuraliums-total',
  templateUrl: './neuraliums-total.component.html',
  styleUrls: ['./neuraliums-total.component.scss']
})
export class NeuraliumsTotalComponent implements OnInit, OnDestroy {
  showNeuraliums: boolean = false;
  neuraliumTotal: TotalNeuralium = NO_NEURALIUM_TOTAL;

  constructor(
    private _ngZone: NgZone,
    private neuraliumService:NeuraliumService) { }

  ngOnInit() {
    this.neuraliumService.getShowNeuraliumTotal().pipe(takeUntil(this.unsubscribe$)).subscribe(show =>{
      this._ngZone.run(() => {
        this.showNeuraliums = show;
      });
      
    });

    this.neuraliumService.getNeuraliumTotal().pipe(takeUntil(this.unsubscribe$)).subscribe(total =>{
      this._ngZone.run(() => {
        this.neuraliumTotal = total;
      });
      
    })
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }
 

  get hasCredit():boolean{
    return this.neuraliumTotal.credit > 0;
  }

  get hasDebit():boolean{
    return this.neuraliumTotal.debit > 0;
  }

  get showFrozen():boolean{
    return this.neuraliumTotal.frozen > 0;
  }
}
