import { Component, OnInit, Inject, Optional, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ServerConnectionService } from '../../service/server-connection.service';
import { NotificationService } from '../../service/notification.service';
import { ConfigService } from '../../service/config.service';
import { ServerService } from '../../service/server.service';
import { TranslateService } from '@ngx-translate/core';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

export class ServerConnectionDialog {
  canManuallyStop: boolean = false;
  manuallyOpened: boolean = false;
}

@Component({
  selector: 'app-server-connection-dialog',
  templateUrl: './server-connection-dialog.component.html',
  styleUrls: ['./server-connection-dialog.component.scss']
})
export class ServerConnectionDialogComponent implements OnInit, OnDestroy {

  showServerNotConnected: boolean = true;
  canManuallyStopServer: boolean = false;
  manuallyOpened: boolean = false;
  canStartServer:boolean = false;

  constructor(
    private serverConnectionService: ServerConnectionService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private serverService: ServerService,
    private _ngZone: NgZone,
    private translateService: TranslateService,
    public dialogRef: MatDialogRef<ServerConnectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: boolean
  ) { 
    this.manuallyOpened = data;
  }

  ngOnInit() {
    

    /*
    this.serverConnectionService.manuallyOpened.pipe(takeUntil(this.unsubscribe$)).subscribe(manuallyOpened =>{
      this.manuallyOpened = manuallyOpened;
    })
    */

    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      this._ngZone.run(() => {
        this.showServerNotConnected = !connected;
        if (connected !== CONNECTED) {
          this.serverConnectionService.tryConnectToServer();
          setTimeout(() =>{
            this.canStartServer = true;
          },5000)
        }
        else {
          
          if (!this.manuallyOpened) {
            this.close();
          }
          
        }
      });

     
    })
  }

  private unsubscribe$ = new Subject<void>();
  
  
    ngOnDestroy(): void {
      this.unsubscribe$.next();
      this.unsubscribe$.complete();
    }


  startServer() {
    this.serverService.startServer().then(success => {

      this.serverConnectionService.tryConnectToServer();
      if(success){
        this.close();
      }
    });
    
  }

  stopServer() {
    this.serverService.stopServer().then((success) => {
      this.close();
    });
  }

  close() {
    this.dialogRef.close();
  }

}
