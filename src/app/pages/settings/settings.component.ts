import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../..//service/config.service';
import { NotificationService } from '../..//service/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ɵBrowserPlatformLocation } from '@angular/common';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, AfterViewInit, OnDestroy {
  icon = 'fas fa-cogs';
  languages: any;
  selectedLanguage: string;
  serverPath: string;
  serverIP: string;
  serverPort: number;
  miningLogLevel: number;
  serverType:number;
  useTLS:boolean;
  rpcPassword: string;

  public primary: boolean;
  constructor(
    private notificationService: NotificationService,
    private configService: ConfigService,
    private _ngZone: NgZone,
    private translateService: TranslateService,
    private route: ActivatedRoute) { }

  ngOnInit() {
    this.languages = this.configService.getLanguagesList();
    this.loadSettings();
  }

  private unsubscribe$ = new Subject<void>();


  ngOnDestroy(): void {
 this.unsubscribe$.next();
 this.unsubscribe$.complete();
 }

  ngAfterViewInit() {

    this.route.url.pipe(takeUntil(this.unsubscribe$)).subscribe(url => {
      this._ngZone.run(() => {
        if (!this.serverPath && url[0].path === 'settings') {
          this.ensureServerPath();
        }
      });
      

    });
  }

  searchServerPath() {
    this.searchDirectoryPath();
  }

  loadSettings() {
    this.selectedLanguage = this.configService.language;
    this.serverPath = this.configService.serverPath;
    this.serverPort = this.configService.serverPort;
    this.miningLogLevel = this.configService.miningLogLevel;
    this.serverIP = this.configService.serverIP;
    this.serverType = this.configService.serverType;

    this.useTLS = this.configService.useTLS;
    this.rpcPassword = this.configService.rpcPassword;
  }

  saveSettings() {
    this.configService.language = this.selectedLanguage;
    this.configService.serverPath = this.serverPath;
    this.configService.serverIP = this.serverIP;
    this.configService.serverType = this.serverType;
    this.configService.serverPort = this.serverPort;
    this.configService.miningLogLevel = this.miningLogLevel;
    this.configService.useTLS = this.useTLS;
    this.configService.rpcPassword = this.rpcPassword;

    this.configService.saveSettings();
    this.translateService.setDefaultLang(this.selectedLanguage);
    this.translateService.use(this.selectedLanguage);
    this.notificationService.showSuccess(this.translateService.instant('settings.SettingsSaved'));
  }

  refreshSetting(setting: string) {
    switch (setting) {
      case 'language':
        this.selectedLanguage = this.configService.defaultSettings.language;
        break;
      case 'serverPath':

        this.ensureServerPath();
        break;
      case 'serverIP':
          this.serverIP = this.configService.defaultSettings.serverIP;
          break;
      case 'serverPort':
        this.serverPort = this.configService.defaultSettings.serverPort;
        break;
      case 'miningLogLevel':
        this.miningLogLevel = this.configService.defaultSettings.miningLogLevel;
        break;
      case 'serverType':
        this.serverType = this.configService.defaultSettings.serverType;
        break;
      case 'useTLS':
        this.useTLS = this.configService.defaultSettings.useTLS;
        break;
      case 'rpcPassword':
        this.rpcPassword = this.configService.defaultSettings.rpcPassword;
        break;

      default:
        break;
    }
  }

  ensureServerPath() {

    if( this.serverType === 1){
      return;
    }
    let defaultPath = this.configService.defaultSettings.serverPath;

    if (defaultPath) {
      this.serverPath = defaultPath;
    }

    if (!this.serverPath) {
      this.configService.restoreDefaultServerPath();
    }
    if (this.serverPath) {
      this.serverPath = this.configService.validateServerPath(this.serverPath, this.configService.settings.serverFileName);
    }

    if (!this.serverPath) {

      this.searchDirectoryPath();
    }
  }

  searchDirectoryPath() {
    this.configService.openSearchServerPathDialog().then(path => {

      this.serverPath = path[0];
    }).catch((path) => {
      let valid = false;

      if (this.serverPath) {
        let result = this.configService.validateServerPath(this.serverPath, this.configService.settings.serverFileName);
        if (result) {
          valid = true;
        }
      }
      if (!valid) {
        alert('The selected Neuralium server path is invalid. Please select again.');
      }
    });
  }
}
