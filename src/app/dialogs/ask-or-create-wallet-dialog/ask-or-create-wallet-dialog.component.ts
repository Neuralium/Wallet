import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-ask-or-create-wallet-dialog',
  templateUrl: './ask-or-create-wallet-dialog.component.html',
  styleUrls: ['./ask-or-create-wallet-dialog.component.scss']
})
export class AskOrCreateWalletDialogComponent implements OnInit, OnDestroy {

  constructor(
    public dialogRef: MatDialogRef<AskOrCreateWalletDialogComponent>
  ) { }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
 

  answerCreateNewWallet(){
    this.dialogRef.close(DialogResult.CreateWallet);
  }

  cancel(){
    this.dialogRef.close(DialogResult.Cancel);
  }
}
