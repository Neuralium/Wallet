import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { WalletService } from './wallet.service';
import { ServerConnectionService } from './server-connection.service';
import {NotificationService} from './notification.service';
import { EventTypes } from '../model/serverConnectionEvent';
import { AlertMessage,MessageMessage, PriorityLevels, ReportLevels } from '../model/messages';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ServerMessagesService implements OnInit, OnDestroy {

  constructor(private walletService: WalletService,
    private serverConnectionService: ServerConnectionService,
    private notificationService: NotificationService,
    private translateService: TranslateService) {
    this.subscribeToServerEvents();
  }

  messages: BehaviorSubject<string> = new BehaviorSubject<string>('');

  public callback: (message: string) => void;

  private unsubscribe$ = new Subject<void>();

  ngOnInit() {

  }


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }

  subscribe(callback: (message: string) => void) {
      this.callback = callback;
  }

  subscribeToServerEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      switch (event.eventType) {
        case EventTypes.ConsoleMessage:
          if ( this.callback) {
            console.log(event.message);
           this.callback(event.message);
          }
          break;
        case EventTypes.Alert:
          const alertMessage: AlertMessage = <AlertMessage>event.message;

          this.translateService.get('Alerts.Message' + alertMessage.messageCode).subscribe(translated => {

            if (!translated) {
              translated = alertMessage.defaultMessage;
            }

            if (alertMessage.reportLevel === ReportLevels.Default) {
              if (alertMessage.priorityLevel === PriorityLevels.Fatal) {
                this.notificationService.showError(translated);
              } else if (alertMessage.priorityLevel === PriorityLevels.Warning) {
                this.notificationService.showWarn(translated);
              } else {
                this.notificationService.showError(translated);
              }
            } else if (alertMessage.reportLevel === ReportLevels.Modal) {
              alert(translated);
            }
          });


            break;
          case EventTypes.Message:
              const message: MessageMessage = <MessageMessage>event.message;
    
              // correlates to ReportableMessageType
              if(!message.messageCode || message.messageCode === 1){
                // some messages will be handled somewhere else
                break;
              }

              this.translateService.get('Messages.Message' + message.messageCode).subscribe(translated => {
    
                if (!translated) {
                  translated = message.defaultMessage;
                }
    
                this.notificationService.showInfo(translated);
              });
    
    
                break;
          case EventTypes.ImportantWalletUpdate:
            this.translateService.get('app.ImportantWalletUpdate').subscribe(translated => {
              alert(translated);
            });
          break;
        default:
          break;
      }
    });
  }

  updateServermessages(message: string) {
    this.messages.next(message);
  }


  getMessages(): Observable<string> {
    return this.messages;
  }
}
