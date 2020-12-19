import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-help-icon',
  templateUrl: './help-icon.component.html',
  styleUrls: ['./help-icon.component.scss']
})
export class HelpIconComponent implements OnInit, OnDestroy {
  @Input() message:string;
  messageTranslated:string = "";

  constructor(private translate:TranslateService) { }

  ngOnInit() {
    this.translate.get(this.message).subscribe(response =>{
      this.messageTranslated = response;
    });
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  

}
