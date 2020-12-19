import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../..//service/config.service';
import { NotificationService } from '../..//service/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


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
  serverPort: number;
  miningLogLevel: number;

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
  }

  saveSettings() {
    this.configService.language = this.selectedLanguage;
    this.configService.serverPath = this.serverPath;
    this.configService.serverPort = this.serverPort;
    this.configService.miningLogLevel = this.miningLogLevel;
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
      case 'serverPort':
        this.serverPort = this.configService.defaultSettings.serverPort;
        break;
      case 'miningLogLevel':
        this.miningLogLevel = this.configService.defaultSettings.miningLogLevel;
        break;
      default:
        break;
    }
  }

  ensureServerPath() {

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
