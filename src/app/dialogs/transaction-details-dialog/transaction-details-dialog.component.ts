import { Component, OnInit, Optional, Inject, OnDestroy } from '@angular/core';
import { NeuraliumTransaction, NO_NEURALIUM_TRANSACTION } from '../..//model/transaction';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-transaction-details-dialog',
  templateUrl: './transaction-details-dialog.component.html',
  styleUrls: ['./transaction-details-dialog.component.scss']
})
export class TransactionDetailsDialogComponent implements OnInit, OnDestroy {
  transaction : NeuraliumTransaction = NO_NEURALIUM_TRANSACTION;

  disableAnimation = true;

  constructor(
    public dialogRef: MatDialogRef<TransactionDetailsDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: NeuraliumTransaction
  ) { 
    this.transaction = data;
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
    // timeout required to avoid the dreaded 'ExpressionChangedAfterItHasBeenCheckedError'
    setTimeout(() => this.disableAnimation = false);
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
