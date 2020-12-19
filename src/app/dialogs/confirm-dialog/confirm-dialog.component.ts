import { Component, OnInit, Inject, Optional, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  message:string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: string) {
      this.message = data;
    }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }


  yes(){
    this.dialogRef.close(DialogResult.Yes);
  }

  no(){
    this.dialogRef.close(DialogResult.No);
  }
}
