import { Component, OnInit, Inject, Optional, OnDestroy } from '@angular/core';
import { Contact } from '../../model/contact';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-edit-contact-dialog',
  templateUrl: './edit-contact-dialog.component.html',
  styleUrls: ['./edit-contact-dialog.component.scss']
})
export class EditContactDialogComponent implements OnInit, OnDestroy {
 contact:Contact;
  constructor(
    public dialogRef: MatDialogRef<EditContactDialogComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: Contact
  ) { 
    this.contact = Object.assign({},this.data);
  }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }
  

  save(){
    this.dialogRef.close(this.contact);
  }

  cancel(){
    this.dialogRef.close(DialogResult.Cancel);
  }
}
