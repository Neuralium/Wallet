import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../service/config.service';
import { NotificationService } from '../../service/notification.service';
import { ServerConnectionService, ServerMessage, MESSAGE_BUFFER_SIZE } from '../..//service/server-connection.service';
import { ServerMessagesService } from '../..//service/server.messages.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { ServerService } from '../..//service/server.service';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerComponent implements OnInit, OnDestroy {

  @ViewChild('Console', { static: false }) private consoleContainer: ElementRef;
  @ViewChild('Paginator', { static: false }) private paginator: MatPaginator;
  
  
  icon = "fas fa-server";
  serverMessages:Array<ServerMessage> = [];
  showServerNotConnected: boolean = true;
  canManuallyStopServer: boolean = false;
  manuallyOpened: boolean = false;
  pageSize:number = 100;
  totalMessageCount:number = 0;
  pageSizeOptions: number[] = [100, 300, 500, 1000];
  sliceStart:number = 0;
  sliceEnd:number = this.pageSize;
  consoleEnabled:boolean = false;

  constructor(
    private notificationService: NotificationService,
    private configService: ConfigService,
    private translateService: TranslateService,
    private serverConnectionService: ServerConnectionService,
    private serverMessagesService: ServerMessagesService,
    private cdr: ChangeDetectorRef,
    private serverService: ServerService,
    private router: Router,
    private ref: ChangeDetectorRef) {

      // should we set this?
      this.manuallyOpened = true;
      this.pageSize = 300;
      this.sliceEnd = this.pageSize;
  }

  ngOnInit() {

    this.serverMessages = this.serverConnectionService.getMessages();

    this.serverConnectionService.isConsoleMessagesEnabled().subscribe(enabled => {
      this.consoleEnabled = enabled;
    });
    this.serverMessagesService.subscribe((message) => {

      if (message) {
        this.updateMessages();
      }
    });

    this.updateMessages();
    this.scrollToBottom();

    this.serverConnectionService.isConnectedToServer().subscribe(connected => {
      if (connected !== CONNECTED) {
        if (this.configService.isServerPathValid()) {
          this.serverConnectionService.tryConnectToServer();
          this.showServerNotConnected = true;
          this.consoleEnabled = false;
          setInterval(() => {
            if (!this.ref['destroyed']) {
              this.ref.detectChanges();
            }
          });
        }
      }
      else {
        this.showServerNotConnected = false;
        
        setInterval(() => {
          if (!this.ref['destroyed']) {
            this.ref.detectChanges();
          }
        });
      }
    });

    this.paginator.lastPage();
  }
  ngOnDestroy() {
    this.ref.detach(); // do this


  }

  toggleConsole(){
    this.serverConnectionService.callEnableConsoleMessages(!this.consoleEnabled).then(result => {
      this.consoleEnabled = result;
    });
  }
  setPage(event){

    this.sliceStart = event.pageIndex * event.pageSize;
    this.sliceEnd = this.sliceStart + event.pageSize;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  updateMessages() {
    if(this.router.isActive){

      this.paginator.lastPage();
      setTimeout(() => {
        try{
          this.cdr.detectChanges();
          this.scrollToBottom();
        }
        catch{
            // do nothing
        }
      }, 0);
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      this.consoleContainer.nativeElement.scrollTop = this.consoleContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  startServer():Promise<boolean> {
    return this.serverService.startServer();
  }

  stopServer():Promise<boolean>{
    return this.serverService.stopServer();
  }
}
