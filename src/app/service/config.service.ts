import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { remote } from 'electron';
import { TranslateService } from '@ngx-translate/core';
import * as FS from 'fs-extra';
import { AppConfig } from '../../environments/environment';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ServerConnectionService } from '../service/server-connection.service';
import * as Store from 'electron-store';
import * as os from 'os';
import * as path from 'path';

const app = remote.app;

class Settings {
  language: string;
  serverPath: string;
  serverFileName: string;
  serverPort: number;
  miningLogLevel: number;
  currentPlatform: string;
  softwareLicenseAgreementShown: boolean;
  delegateAccount: string;
}



@Injectable({
  providedIn: 'root'
})
export class ConfigService{
  settings: Settings;
  store = new Store.default();

  defaultServerPathValid: boolean = false;
  defaultSettingsValue:Settings;
  serverConnectionService:ServerConnectionService;

  get defaultSettings():Settings {
    if(!this.defaultSettingsValue) {
      this.defaultSettingsValue = this.defineDefaultSettings();
    }
    return this.defaultSettingsValue;
  }

  constructor(private translateService: TranslateService) {
    this.loadSettings();
  }


  setServerConnectionService(serverConnectionService:ServerConnectionService){

    this.serverConnectionService = serverConnectionService;
    this.serverConnectionService.serverConnection.subscribe(connected => {
      if(connected){
        this.updateLocale();
      }
    });
  }

  updateLocale(){

    try{
      this.serverConnectionService.setLocale(this.language);
    }
    catch(error){
      console.log('failed to set locale');
    }
  }


  getLanguagesList() {
    return [
      { 'code': 'en', 'language': 'English' },
      { 'code': 'fr', 'language': 'Français' },
      { 'code': 'es', 'language': 'Español'  },
      { 'code': 'zh-CN', 'language': '汉语' }, // simplified
      { 'code': 'zh-TW', 'language': '漢語' }, // traditional
      { 'code': 'ar', 'language': 'العربية' },
      { 'code': 'pt', 'language': 'Português' },
      { 'code': 'ru', 'language': 'Русский' },
      { 'code': 'yo', 'language': 'Èdè Yorùbá' },
      { 'code': 'de', 'language': 'Deutsch' },
      { 'code': 'it', 'language': 'Italiano' },
      { 'code': 'iw', 'language': 'עברית' },
      { 'code': 'ko', 'language': '조선말' },
      { 'code': 'id', 'language': 'Bahasa Indonesia' },
      { 'code': 'ur', 'language': 'اُردُو' },
      { 'code': 'so', 'language': 'اللغة الصومالية' },
      { 'code': 'hi', 'language': 'हिन्दी' },
      { 'code': 'uk', 'language': 'Українська' },
      { 'code': 'ja', 'language': '日本語' },
      { 'code': 'bn', 'language': 'বাংলা' },
      { 'code': 'ha', 'language': 'حَوْسَ' },
      { 'code': 'pa', 'language': 'पंजाबी' },
      { 'code': 'te', 'language': 'తెలుగు' },
      { 'code': 'tr', 'language': 'Türkçe' },
      { 'code': 'vi', 'language': 'Tiếng Việt Nam' },
      { 'code': 'fa', 'language': 'فارسی' },
      { 'code': 'bg', 'language': 'български език' },
      { 'code': 'ta', 'language': 'தமிழ்' },
      { 'code': 'pl', 'language': 'Język polski' },
      { 'code': 'th', 'language': 'ภาษาไทย' },
      { 'code': 'la', 'language': 'Lingua Latīna' }

    ];
  }

  private loadSettings(): any {
    let message: string = `Load settings`;
    console.log(message)

    


    if (this.store.has(this.SettingsSetName)) {
      this.settings = <Settings>this.store.get(this.SettingsSetName);
    } else {
      this.settings = new Settings();
    }

    message = `Define default settings if necessary`;
    console.log(message)
    this.defineDefaultSettingIfNecessary('serverFileName', this.defaultSettings.serverFileName);
    this.defineDefaultSettingIfNecessary('serverPort', this.defaultSettings.serverPort);
    this.defineDefaultSettingIfNecessary('miningLogLevel', this.defaultSettings.miningLogLevel);

    this.defineDefaultSettingIfNecessary('currentPlatform', this.defaultSettings.currentPlatform);
    this.defineDefaultSettingIfNecessary('softwareLicenseAgreementShown', this.defaultSettings.softwareLicenseAgreementShown);
    this.defineDefaultSettingIfNecessary('delegateAccount', this.defaultSettings.delegateAccount);

    this.defineDefaultSettingIfNecessary('serverPath', this.defaultSettings.serverPath);
    if (!this.validateServerPath(this.settings['serverPath'],this.settings.serverFileName)) {
      if (this.defaultServerPathValid) {
        this.settings['serverPath'] = this.defaultSettings.serverPath;
      } else {
        this.settings['serverPath'] = '';
      }
      alert('The neuralium server path is invalid. Please ensure it is correctly set in the settings panel.');
    }

    this.saveSettings();
  }

  defineDefaultSettings(): Settings {

    const settings: Settings = new Settings();
    settings.currentPlatform = os.platform();
    settings.delegateAccount = '';
    settings.language = 'en';
    settings.serverFileName = this.getFileName(os.platform());
    settings.serverPath = this.getFilePath(os.platform());
    
    if (this.validateServerPath(settings.serverPath,settings.serverFileName)) {
      this.defaultServerPathValid = true;
    } else {
      this.defaultServerPathValid = false;
    }
    
    if(AppConfig.production === true) {
      settings.serverPort = 12033;
    } else if(AppConfig.testnet === true) {
      settings.serverPort = 12032;
    } else if(AppConfig.devnet === true) {
      settings.serverPort = 12031;
    }
    
    settings.miningLogLevel = 1;
    settings.softwareLicenseAgreementShown = false;

    return settings;
  }

  defineDefaultSettingIfNecessary(setting: string, defaultValue: any) {
    const message : string = `Define ${setting} if necessary with default value ${defaultValue}`;
    console.log(message)
    if (!this.settings[setting]) {
      this.settings[setting] = defaultValue;
    }
  }


  isServerPathValid(): boolean {
    if (this.settings['serverPath']) {
      return true;
    }
    return false;
  }

  getFilePath(osPlatform: string): string {
    const paths = [];
    
    // WINDOWS
    if (osPlatform.toLowerCase().startsWith('win')) {
      paths.push(
      '..\\neuralium',
      '.\\neuralium',
      '..\\..\\..\\..\\neuralium\\win32'
      );
    } else if (osPlatform.toLowerCase().startsWith('linux')) {
     paths.push(
      '../../neuralium',
      '../neuralium',
      '../../../../neuralium\\linux');
    } else {
     paths.push(
      '../../neuralium',
      '../neuralium',
      '../../../../neuralium\\mac');
    }
    
    return this.getExistingNodePath(paths);
  }

  getExistingNodePath(paths:Array<string>): string {
    console.log('Start looking for a valid server path');

    let pathFound: boolean = false;
    let finalPath: string = undefined;

    paths.forEach(pathToCheck => {
      try {
        const fullpath = path.resolve(remote.process.execPath, pathToCheck)
        pathFound = this.checkPath(fullpath);
        if (pathFound) {
          finalPath = fullpath;
        }
      } catch (error) {
        const message: string = `Tried to check if ${pathToCheck} exists but gor error : ${error}`;
        console.log(message)
      }
    })

    return finalPath;
  }

  checkPath(nodeDirectoryPath: string): boolean {
    let message: string = `Check if ${nodeDirectoryPath} exists`;
    console.log(message)
    const result = FS.existsSync(nodeDirectoryPath);
    if (result) {
      message = `${nodeDirectoryPath} exists`;
    } else {
      message = `${nodeDirectoryPath} does not exist`;
    }
    console.log(message);
    return result;
  }

  validateServerPath(nodeDirectoryPath: string, exeName:string): string {
    // time to test the value
    if (FS.existsSync(nodeDirectoryPath) === false) {
      // this is critical, even the auto path does not work
      const message: string = `Automatically set server path ${nodeDirectoryPath} does not exist`;
      console.log(message);
      nodeDirectoryPath = '';
    }

    if (nodeDirectoryPath) {
      const fullPath: string = path.join(nodeDirectoryPath, exeName);

      if (FS.existsSync(fullPath) === false) {
        const message: string = `Automatically set server executable path ${fullPath} does not exist`;
        console.log(message);

        nodeDirectoryPath = '';
      }
    }

    if (!nodeDirectoryPath) {
      // what to do if we have no path?

    }

    return nodeDirectoryPath;
  }
  getFileName(osPlatform: string): string {
    if (osPlatform.toLowerCase().startsWith('win')) {
      return 'Neuralium.exe';
    } else {
      return 'Neuralium';
    }
  }

  openSearchServerPathDialog(): Promise<string[]> {

    let defaultPath: string = this.settings.serverPath;

    if (!defaultPath) {
      const homedir = os.homedir();
      defaultPath = homedir;
    }

    return new Promise<string[]>((resolve, reject) => {
      remote.dialog.showOpenDialog({title: '', defaultPath: this.settings.serverPath, properties: ['openDirectory']}).then(result => {
        const folderPath:string[] = result.filePaths;
       
        if (folderPath === undefined) {
          reject(folderPath);
        } else {

          const correctedFolderPath: string = this.validateServerPath(folderPath[0], this.settings.serverFileName);

          if (!correctedFolderPath) {
            reject(folderPath);
          } else {
            resolve(folderPath);
          }

        }
      }).catch(err => {
        console.log(err);
        reject('');
      });
    });

  }

  private get SettingsSetName():string {
    return 'settings' + AppConfig.postfix;
  }
  saveSettings() {
    this.store.set(this.SettingsSetName, this.settings);
  }

  set language(language: string) {
    this.settings.language = language;

    this.updateLocale();
  }

  get language(): string {
    return this.settings.language;
  }

  // some operations (like sending SMS messages) are not allowed or are restricted in mainland China, so we need to know sometimes.
  get isMainlandChina(): boolean {
    return this.settings.language === 'zh' || this.settings.language === 'zh-TW';
  }

  restoreDefaultLanguage() {
    this.language = this.defaultSettings.language;
    this.saveSettings();
  }

  set serverPath(serverPath: string) {
    this.settings.serverPath = serverPath;
  }

  get serverPath(): string {
    return this.settings.serverPath;
  }

  restoreDefaultServerPath() {
    this.serverPath = this.defaultSettings.serverPath;
    this.saveSettings();
  }

  set serverFileName(serverFileName: string) {
    this.settings.serverFileName = serverFileName;
  }

  get serverFileName(): string {
    return this.settings.serverFileName;
  }

  restoreDefaultServerFileName() {
    this.serverFileName = this.defaultSettings.serverFileName;
    this.saveSettings();
  }

  set currentPlatform(currentPlatform: string) {
    this.settings.currentPlatform = currentPlatform;
  }

  get currentPlatform(): string {
    return this.settings.currentPlatform;
  }

  set serverPort(serverPort: number) {
    this.settings.serverPort = serverPort;
  }

  get serverPort(): number {
    return this.settings.serverPort;
  }

  get miningLogLevel(): number {
    return Number(this.settings.miningLogLevel);
  }
  set miningLogLevel(miningLogLevel: number) {
    this.settings.miningLogLevel = Number(miningLogLevel);
  }

  restoreDefaultServerPort() {
    this.serverPort = this.defaultSettings.serverPort;
    this.saveSettings();
  }

  set softwareLicenseAgreementShown(softwareLicenseAgreementShown: boolean) {
    this.settings.softwareLicenseAgreementShown = softwareLicenseAgreementShown;
  }

  get softwareLicenseAgreementShown(): boolean {
    return this.settings.softwareLicenseAgreementShown;
  }

  restoreDefaultTermsOfServiceShown() {
    this.softwareLicenseAgreementShown = this.defaultSettings.softwareLicenseAgreementShown;
    this.saveSettings();
  }

  set delegateAccount(delegateAccount: string) {
    this.settings.delegateAccount = delegateAccount;
  }

  get delegateAccount(): string {
    return this.settings.delegateAccount;
  }

  restoreDefaultDelegateAccount() {
    this.delegateAccount = this.defaultSettings.delegateAccount;
    this.saveSettings();
  }
}
