import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogResult } from '../../config/dialog-result';
import { LoadAssetsFilesService } from '../../service/load-assets-files.service';
import { ConfigService } from '../../service/config.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export interface DialogData {
  shown: boolean;
}

@Component({
  selector: 'app-software-license-agreement-dialog',
  templateUrl: './software-license-agreement-dialog.component.html',
  styleUrls: ['./software-license-agreement-dialog.component.scss']
})
export class SoftwareLicenseAgreementComponent implements OnInit, OnDestroy {
  validationChecked: boolean;
  termsOfServiceContent: string;
  public shown: boolean;

  constructor(
    public dialogRef: MatDialogRef<SoftwareLicenseAgreementComponent>,
    private loadAssetsFileService: LoadAssetsFilesService,
    private configService: ConfigService,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }


  ngOnInit() {

    // this.loadAssetsFileService.getFile("TOS.txt").subscribe(content =>{
    //   this.termsOfServiceContent = content.toString();
    // });
    this.dialogRef.afterOpened().subscribe(() => {

    });
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  yes() {
    if (this.validationChecked) {
      this.dialogRef.close(DialogResult.Yes);
    }
  }

  no() {
    this.dialogRef.close(DialogResult.No);
  }

  close() {
    this.dialogRef.close();
  }
}
