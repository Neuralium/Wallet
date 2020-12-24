import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ServerConnectionService } from './server-connection.service';
import { NotificationService } from './notification.service';
import { ConfigService } from './config.service';
import { CONNECTED, EventTypes } from '../model/serverConnectionEvent';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import {join} from 'path';
import {remote} from 'electron';
import {spawn} from 'child_process';


@Injectable({
  providedIn: 'root'
})
export class ServerService implements OnInit, OnDestroy {

  childPid: number;
  childProcess: any;
  private canManuallyStopServerObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  shutdownStartedCallback;
  shutdownCompletedCallback;

  constructor(private serverConnectionService: ServerConnectionService,
    private notificationService: NotificationService,
    private configService: ConfigService,
    private translateService: TranslateService) {

    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      if (event.eventType === EventTypes.ShutdownStarted) {

        if (this.shutdownStartedCallback) {
          this.shutdownStartedCallback();
        }
      }
      else if (event.eventType === EventTypes.ShutdownCompleted) {

        if (this.shutdownCompletedCallback) {
          this.shutdownCompletedCallback();
        }
      }
    })
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }


  ngOnInit() {

  }

  get canManuallyStopServer(): Observable<boolean> {
    return this.canManuallyStopServerObs;
  }

  setCanManuallyStopServer(value: boolean) {
    this.canManuallyStopServerObs.next(value);
  }

  public get IsRunning(): boolean {
    return this.childProcess;
}


  startServer(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {

      if (this.childProcess) {

        resolve(true);
        return;
      }

      let serverPath = this.configService.serverPath;
      let serverName = this.configService.serverFileName;

      var filePath = join(serverPath, serverName);


      this.notificationService.showInfo(this.translateService.instant('server.StartingServer'));

      this.childProcess = spawn(filePath, ['--accept-license-agreement=YES'], { shell: true, windowsHide: true });

      let running = false;
      let timeout:any = null;
      let completed:boolean = false;

      let checksCompleted:boolean = false;
      const completedMethod = () => {

        if(timeout){
          clearTimeout(timeout);
          timeout = null;
        }
        if(completed){
          return;
        }

        if (this.childProcess && this.childProcess.pid !== 0 && running) {
          this.childPid = this.childProcess.pid;
          this.setCanManuallyStopServer(true);
          this.serverConnectionService.beginConnection();
          this.notificationService.showInfo(this.translateService.instant('server.ServerRunning'));
          resolve(true);
        }
        else {
          this.childProcess = null;
          this.notificationService.showError(this.translateService.instant('server.FailedToStartServer'));
          resolve(false);
        }
        completed = true;
      };

      const callExit = () => {

        this.exitWindow();
      };
      
      this.childProcess.stdout.on('data', function(data) {

        if(checksCompleted === false){
          const input:string = data.toString();

          if(input.includes('[EXPIRED DEVNET]') || input.includes('[EXPIRED TESTNET]')){
            alert('The testing node has expired. Please download a more recent version at https://www.neuralium.com.');
            callExit();
            return;
          }
          else if(input.includes('[EXPIRED MAINNET]')){
            alert('The node has expired. Please download a more recent version at https://www.neuralium.com.');
            callExit();
            return;
          }
          if(input.includes('Current software version')){
            checksCompleted = true;
          }

        }
        running = true;
        completedMethod();
      });
      this.childProcess.stderr.on('data', function(data) {
        running = false;
        completedMethod();
      });
      this.childProcess.on('close', function(code) {
        running = false;
        completedMethod();
      });
      timeout = setTimeout(completedMethod, 15000);
    });
  }

  exitWindow() {

    this.childProcess = null;
    const w = remote.getCurrentWindow();
    w.close();
  }

  stopServer() {
    return new Promise<boolean>((resolve, reject) => {

      let resolved: boolean = false;
      let timeout: any = null;

      // if (!this.childProcess) {

      //   this.notificationService.showWarn(this.translateService.instant('server.ExternallyStarted'));
      //   resolve(true);
      //   return;
      // }

      let killMethod = () => {

        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        // we timed out, we need to send a sigterm to the process directly
        if (this.childProcess && !this.childProcess.killed) {
          this.childProcess.kill();
          this.childProcess = null;
          if (!resolved) {
            resolve(true);
            resolved = true;
          }
        }
        else {
          if (!resolved) {
            resolve(false);
            resolved = true;
          }
        }
        try {
          this.serverConnectionService.connection.stop();
        } catch{
          // do nothing
        }
        this.serverConnectionService.notifyServerConnectionStatusIfNeeded(false);
        this.shutdownStartedCallback = null;
        this.shutdownCompletedCallback = null;

      };

      timeout = setTimeout(killMethod, 20000);

      try {

        this.notificationService.showInfo(this.translateService.instant('server.StartingServerShutdown'));

        this.shutdownStartedCallback = () => {
          this.translateService.instant('server.ServerShutdownStarted');
          killMethod();

          resolve(true);
        };

        this.shutdownCompletedCallback = () => {
          this.translateService.instant('server.ServerShutdownCompleted');
          killMethod();

          resolve(true);
        };

        this.serverConnectionService.callServerShutdown().then((result) => {
          this.setCanManuallyStopServer(false);

          resolve(true);
        }).catch(error => {
          this.notificationService.showError(error);
          killMethod();
          reject(error);
        });
      } catch (error) {
        this.notificationService.showError(error);
        killMethod();
        reject(error);
      }
    });
  }
}
