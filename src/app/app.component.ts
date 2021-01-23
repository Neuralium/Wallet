import { Component, OnInit, OnDestroy } from '@angular/core';
import { BlockChain, NO_BLOCKCHAIN } from './model/blockchain';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogParameter } from './dialogs/confirm-dialog/confirm-dialog.component';
import { Observable } from 'rxjs';
import { BlockchainService } from './service/blockchain.service';
import { SelectBlockchainDialogComponent } from './dialogs/select-blockchain-dialog/select-blockchain-dialog.component';
import { NotificationService } from './service/notification.service';
import { ServerService } from './service/server.service';
import { AppointmentsService } from './service/appointment.service';
import { AppointmentPuzzleDialogComponent } from './dialogs/appointment-puzzle-dialog/appointment-puzzle-dialog.component';
import { THSDialogComponent } from './dialogs/THS-dialog/THS-dialog.component';

import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { LanguageSelectionDialogComponent } from './dialogs/language-selection-dialog/language-selection-dialog.component';
import { ConfigService } from './service/config.service';
import { TransactionsService } from './service/transactions.service';
import { MiningService } from './service/mining.service';

import { ElectronService } from 'ngx-electron';
import { ServerConnectionService } from './service/server-connection.service';
import { SoftwareLicenseAgreementComponent } from './dialogs/terms-of-service-dialog/software-license-agreement-dialog.component';
import { DialogResult } from './config/dialog-result';

import { remote, ipcRenderer } from 'electron';
import { AboutDialogComponent } from './dialogs/about-dialog/about-dialog.component';
import { CONNECTED, EventTypes } from './model/serverConnectionEvent';
import { AskKeyDialogComponent } from './dialogs/ask-key-dialog/ask-key-dialog.component';
import { AskCopyWalletKeyFileDialogComponent } from './dialogs/ask-copy-key-dialog/ask-copy-key-dialog.component';
import { AppConfig } from '../environments/environment';

import { PassphraseParameters, KeyPassphraseParameters, PassphraseRequestType, RequestCopyWalletParameters, RequestCopyKeyFileParameters } from './model/passphraseRequiredParameters';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  displayChangeBlockchain: boolean = false;
  serverName: string = '';
  serverPath: string = '';
  serverPort: number = 0;
  selectedBlockchain: Observable<BlockChain>;
  currentBlockchain: BlockChain = NO_BLOCKCHAIN;
  puzzleWindowOpen:boolean = false;
  thsWindowOpen:boolean = false;
  eventsRegistered: boolean = false;
  thsDialogRef : MatDialogRef<THSDialogComponent, any>;
  logoPath = '';
  constructor(
    private electronService: ElectronService,
    private configService: ConfigService,
    private router: Router,
    private translateService: TranslateService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
    private serverConnectionService: ServerConnectionService,
    private serverService: ServerService,
    private dialog: MatDialog,
    private appointmentsService: AppointmentsService,
    private transactionService: TransactionsService,
    private miningService: MiningService) {
    this.translateService.setDefaultLang('en');
    this.serverPath = this.configService.serverPath;
    this.serverName = this.configService.serverFileName;
    this.serverPort = this.configService.serverPort;


    if(AppConfig.production){
      this.logoPath = 'assets/img/neuralium-logo.png';
    }else{
      this.logoPath = 'assets/img/neuralium-logo-testnet.png';
    }
    this.translateService.get('app.Help').subscribe(help => {
      this.translateService.get('app.Refresh').subscribe(refresh => {
        this.translateService.get('app.About').subscribe(about => {
          this.translateService.get('app.Quit').subscribe(quit => {
            this.translateService.get('app.Sla').subscribe(sla => {
              this.defineMenu(dialog, help, refresh, quit, about, sla);
            })
          })
        })
      });
    });
  }

  showTHS(nonce:number, message:any){
    if(!this.thsWindowOpen){
      this.thsWindowOpen = true;
      this.thsDialogRef = this.dialog.open(THSDialogComponent, {
        width: '950px',
        data: nonce
      });

      
      this.thsDialogRef.afterClosed().subscribe(() => {
        this.thsWindowOpen = false;
      });
    }

    if(message && this.thsDialogRef){
      this.thsDialogRef.componentInstance.setBegining(message);
    }
  }

  ngOnInit() {

    let now = DateTime.local();

    if(now.day == 30 && now.month == 12 && now.year == 2020){
      this.translateService.get('app.UpdateWallet').subscribe(message => {
        alert(message);
      });
    
    }
    // this.electronService.remote.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    //   callback({
    //     responseHeaders: {
    //       ...details.responseHeaders,
    //       'Content-Security-Policy': ['default-src \'none\'']
    //     }
    //   });
    // });


    this.appointmentsService.onPuzzleWindowOpen.add(() => {

      if(!this.puzzleWindowOpen){
        this.puzzleWindowOpen = true;
        const dialogRef = this.dialog.open(AppointmentPuzzleDialogComponent, {
          width: '600px',
          height: '600px'
        });

        dialogRef.afterClosed().subscribe(result => {
          this.puzzleWindowOpen = false;
        });
      }
    });

    if (!this.eventsRegistered) {
      this.serverConnectionService.eventNotifier.subscribe(event => {

          switch (event.eventType) {
              case EventTypes.THSTrigger:
                this.showTHS(0, null);
                break;
              case EventTypes.THSBegin:
                this.showTHS(0, event.message);
                break;
                case EventTypes.THSRound:
                  this.showTHS(0, null);
                  break;
              case EventTypes.THSIteration:
                this.showTHS(event.message.nonce, null);
                break;
              case EventTypes.THSSolution:
                // do nothing, its finished anyways
                  break;
              default:
                  break;
          }
      });
      this.eventsRegistered = true;
    }

    // when quitting, we may ask if the user also wants to shut down the node, or let it run
    this.electronService.ipcRenderer.on('quit', (event) => {
      this.serverService.canManuallyStopServer.pipe(takeUntil(this.unsubscribe$)).subscribe(canStop => {

        this.translateService.get('app.ServerRunningStop').subscribe(stopMessage => {
          if (this.serverConnectionService.IsConnected || this.serverService.IsRunning) {
            setTimeout(() => {

              const dialogParameters = new ConfirmDialogParameter();
              dialogParameters.message = stopMessage;
              dialogParameters.showCancel = true;

              const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                width: '500px',
                data: dialogParameters
              });

              dialogRef.afterClosed().subscribe(dialogResult => {
                if (dialogResult === DialogResult.Yes) {
                  if (this.serverService.IsRunning) {
                    this.serverService.stopServer().then((success) => {

                      event.sender.send('ok-quit');

                    }).catch((error) => {
                      console.log(error);
                      event.sender.send('ok-quit');
                    });
                  }
                  else if (this.serverConnectionService.IsConnected) {

                    this.serverConnectionService.callServerShutdown().then(() => {
                      try {
                        this.serverConnectionService.connection.onclose(() => {
                          event.sender.send('ok-quit');
                        });
                        this.serverConnectionService.connection.stop();
                      }
                      catch{
                        event.sender.send('ok-quit');
                      }

                    }).catch(error => {
                      try {
                        this.serverConnectionService.connection.onclose(() => {
                          event.sender.send('ok-quit');
                        });
                        this.serverConnectionService.connection.stop();
                      }
                      catch{
                        event.sender.send('ok-quit');
                      }
                    });

                  }
                  else {
                    event.sender.send('ok-quit');
                  }
                }
                else if (dialogResult === DialogResult.No) {
                  event.sender.send('ok-quit');
                }
                else{
                  // do nothing
                }
              });
            });
          }
          else {
            event.sender.send('ok-quit');
          }

        });
      });
    });

    var lng = this.configService.language;
    if (!lng) {
      setTimeout(() => {
        const dialogRef = this.dialog.open(LanguageSelectionDialogComponent, {
          width: '600px'
        })

        dialogRef.afterClosed().subscribe(() => {
          this.initialise();
        })
      });
    }
    else {
      this.translateService.setDefaultLang(lng);
      setTimeout(() => {
        this.initialise();
      });
    }

  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  defineMenu(dialog: MatDialog, help: string, refresh: string, quit: string, about: string, sla: string) {


    const isMac = process.platform === 'darwin';

    let local = this;
    setTimeout(() => {
      const template = [{
        role: 'fileMenu'
      },{
        role: 'editMenu'
      }, {
        label: 'View',submenu: [
          {role: 'resetZoom'},
          {role: 'zoomIn'},
          {role: 'zoomOut'}
        ]
      },{
        role: 'windowMenu'
      }, {
        label: help,
        submenu: [
          {
            label: sla,
            click: function () {
              local.showSoftwareLicenseAgreement();
            }
          },
          {
            label: about,
            click: function () {
              setTimeout(() =>
                dialog.open(AboutDialogComponent, {
                  width: '600px',
                  height: '450px'
                }));
            }
          }

        ]
      }];

      const menu = remote.Menu.buildFromTemplate(<Array<Electron.MenuItem>><any>template);
      remote.Menu.setApplicationMenu(menu);
    });
  }

  initialise() {



    if (!this.configService.softwareLicenseAgreementShown) {
      this.showSoftwareLicenseAgreement();
    }
    else {
      this.serverConnectionService.isConnectedToServer().pipe(takeUntil(this.unsubscribe$)).subscribe(connected => {
        if (connected !== CONNECTED) {
          if (!this.configService.isServerPathValid()) {
            this.router.navigate(['/settings']);
          }
          else {
            this.router.navigate(['/dashboard']);
          }

        }
        else {
          this.selectedBlockchain = this.blockchainService.getSelectedBlockchain();

          this.selectedBlockchain.pipe(takeUntil(this.unsubscribe$)).subscribe(blockchain => {
            if (blockchain === NO_BLOCKCHAIN) {
              this.blockchainService.getAvailableBlockchains().then(blockchains => {
                const availableBlockchainsCount = blockchains.length
                if (availableBlockchainsCount === 0) {
                  this.notificationService.showWarn('No blockchain available');
                }
                else if (availableBlockchainsCount === 1) {
                  this.currentBlockchain = blockchains[0];
                  this.blockchainService.setSelectedBlockchain(this.currentBlockchain);
                }
                else {
                  this.showChangeBlockchainWindow();
                }
              })
            }
            else {
              this.currentBlockchain = blockchain;
              this.listenToEvents();
            }
          })
        }
      });

    }
  }

  listenToEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      switch (event.eventType) {
        case EventTypes.RequestWalletPassphrase:
          this.askForWalletPassphrase(event.message);
          break;
        case EventTypes.RequestKeyPassphrase:
          this.askForKeyPassphrase(event.message);
          break;
        case EventTypes.RequestCopyWallet:
          console.log('RequestCopyWallet is not implemented');
          break;
        case EventTypes.RequestCopyKeyFile:
          this.askForRequestCopyKeyFile(event.message);
          break;
        default:
          break;
      }
    })
  }

  askForRequestCopyKeyFile(parameters: RequestCopyKeyFileParameters) {
    setTimeout(() => {
      var dialog = this.dialog.open(AskCopyWalletKeyFileDialogComponent, {
        width: '450px',
        data: { parameters: parameters, type: PassphraseRequestType.Key }
      });

      dialog.afterClosed().subscribe(result => {
        this.serverConnectionService.callWalletKeyFileCopied(parameters.correlationId, parameters.chainType, parameters.keyCorrelationCode);
      })
    });
  }


  askForWalletPassphrase(parameters: PassphraseParameters) {
    setTimeout(() => {
      var dialog = this.dialog.open(AskKeyDialogComponent, {
        width: '450px',
        data: { parameters: parameters, type: PassphraseRequestType.Wallet }
      });

      dialog.afterClosed().subscribe(result => {
        this.serverConnectionService.callEnterWalletPassphrase(parameters.correlationId, parameters.chainType, parameters.keyCorrelationCode, result, false);
      })
    });
  }

  askForKeyPassphrase(parameters: KeyPassphraseParameters) {
    setTimeout(() => {
      var dialog = this.dialog.open(AskKeyDialogComponent, {
        width: '450px',
        data: { parameters: parameters, type: PassphraseRequestType.Key }
      })

      dialog.afterClosed().subscribe(result => {
        this.serverConnectionService.callEnterKeyPassphrase(parameters.correlationId, parameters.chainType, parameters.keyCorrelationCode, result);
      })
    });
  }

  showAboutBox() {
    setTimeout(() =>
      this.dialog.open(AboutDialogComponent, {
        width: '250px'
      }));
  }

  showChangeBlockchainWindow() {
    setTimeout(() =>
      this.dialog.open(SelectBlockchainDialogComponent, {
        width: '250px',
        data: this.currentBlockchain
      }));
  }

  showSoftwareLicenseAgreement() {
    const shown: boolean = this.configService.softwareLicenseAgreementShown;
    setTimeout(() =>
      this.dialog.open(SoftwareLicenseAgreementComponent, {
        width: '650px',
        data: { shown: shown }

      }).afterClosed().subscribe(dialogResult => {
        if (!shown) {
          if (dialogResult === DialogResult.Yes) {
            this.configService.softwareLicenseAgreementShown = true;
            this.configService.saveSettings();
            this.initialise();
          }
          else {
            this.configService.softwareLicenseAgreementShown = false;
            this.configService.saveSettings();

            const w = this.electronService.remote.getCurrentWindow();
            w.close();
          }
        }
      }));
  }

}
