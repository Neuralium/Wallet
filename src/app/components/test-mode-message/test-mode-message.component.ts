import { Component, OnInit, isDevMode, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TestModeAlterDialogComponent } from '../..//dialogs/test-mode-alter-dialog/test-mode-alter-dialog.component';
import { AppConfig } from '../../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-test-mode-message',
  templateUrl: './test-mode-message.component.html',
  styleUrls: ['./test-mode-message.component.scss']
})
export class TestModeMessageComponent implements OnInit, OnDestroy {

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  

  get showMe(){
    return !AppConfig.production;
  }

  showDetails(){
    setTimeout(() => {
      this.dialog.open(TestModeAlterDialogComponent, {
        width: '550px'
      });
    });
  }
}
