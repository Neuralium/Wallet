import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-test-mode-alter-dialog',
  templateUrl: './test-mode-alter-dialog.component.html',
  styleUrls: ['./test-mode-alter-dialog.component.scss']
})
export class TestModeAlterDialogComponent implements OnInit, OnDestroy {

  constructor(public dialogRef: MatDialogRef<TestModeAlterDialogComponent>) { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  close(){
    this.dialogRef.close();
  }

}
