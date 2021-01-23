import { Component, OnInit, Inject, Optional, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export class ConfirmDialogParameter{
  public message: string;
  public showCancel:boolean = false;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  message:string;
  showCancel:boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogParameter) {
      this.message = data.message;
      this.showCancel = data.showCancel;

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

  cancel(){
    this.dialogRef.close(DialogResult.Cancel);
  }
}
