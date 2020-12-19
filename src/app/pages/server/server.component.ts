import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../service/config.service';
import { NotificationService } from '../../service/notification.service';
import { ServerConnectionService, ServerMessage, MESSAGE_BUFFER_SIZE } from '../..//service/server-connection.service';
import { ServerMessagesService } from '../..//service/server.messages.service';
import { CONNECTED, EventTypes } from '../..//model/serverConnectionEvent';
import { ServerService } from '../..//service/server.service';
import { MatPaginator } from '@angular/material/paginator';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServerComponent implements OnInit, OnDestroy {

  @ViewChild('Console', { static: false }) private consoleContainer: ElementRef;
  @ViewChild('messagePaginator', { static: false }) private paginator: MatPaginator;


  icon = 'fas fa-server';
  serverMessages: Array<ServerMessage> = [];
  showServerNotConnected = true;
  canManuallyStopServer = false;
  manuallyOpened = false;
  pageSize = 100;
  totalMessageCount = 0;
  pageSizeOptions: number[] = [100, 300, 500, 1000];
  sliceStart = 0;
  sliceEnd: number = this.pageSize;
  consoleEnabled = false;
  private unsubscribe$ = new Subject<void>();
  
  constructor(
    private notificationService: NotificationService,
    private configService: ConfigService,
    private _ngZone: NgZone,
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

    this.serverConnectionService.isConsoleMessagesEnabled().pipe(takeUntil(this.unsubscribe$)).subscribe(enabled => {
      this._ngZone.run(() => {
        this.consoleEnabled = enabled;
      });

      
    });
    this.serverMessagesService.subscribe((message) => {

      this._ngZone.run(() => {
        if (message) {
          this.updateMessages();
        }
      });
    });

    
    this.scrollToBottom();

    this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
      this._ngZone.run(() => {
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
        } else {
          this.showServerNotConnected = false;
  
          setInterval(() => {
            if (!this.ref['destroyed']) {
              this.ref.detectChanges();
            }
          });
        }
      });

    });
  }

  ngAfterViewInit() {
    this.paginator.lastPage();
    this.updateMessages();
  }
  ngOnDestroy() {
    this.ref.detach(); // do this
    this.unsubscribe$.next();
    this.unsubscribe$.complete();

  }

  toggleConsole() {
    this.serverConnectionService.callEnableConsoleMessages(!this.consoleEnabled).then(result => {
      this.consoleEnabled = result;
    });
  }
  setPage(event) {

    this.sliceStart = event.pageIndex * event.pageSize;
    this.sliceEnd = this.sliceStart + event.pageSize;
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  updateMessages() {
    if (this.router.isActive) {

      this.paginator.lastPage();
      setTimeout(() => {
        try {
          this.cdr.detectChanges();
          this.scrollToBottom();
        } catch {
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

  startServer(): Promise<boolean> {
    return this.serverService.startServer();
  }

  stopServer(): Promise<boolean> {
    return this.serverService.stopServer();
  }
}
