import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { DateTime } from 'luxon';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AppConfig } from './../../../environments/environment';


@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent implements OnInit, OnDestroy {

  public Year:number;

  constructor(public dialogRef: MatDialogRef<AboutDialogComponent>) { 
   this.Year = DateTime.local().year;
  }

  ngOnInit() {
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }


  get softwareVersion():string{

    return AppConfig.softwareVersion + AppConfig.postfix;
  }
  close(){
    this.dialogRef.close();
  }

}
