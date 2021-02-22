import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScrollingModule} from '@angular/cdk/scrolling';
import { NgxElectronModule } from 'ngx-electron';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { MatPasswordStrengthModule } from '@angular-material-extensions/password-strength';
import {MatDatepickerModule} from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AppRoutingModule } from './modules/app-routing.module';
import { TooltipModule } from 'ng2-tooltip-directive';
import { AppMaterialModule } from './modules/app-material.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxMaskModule } from 'ngx-mask';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { FormatTimestampPipe, FormatDateWithTime } from './pipes/format-timestamp.pipe';
import { FormatNeuraliumPipe } from './pipes/format-neuralium.pipe';
import { TrustHtmlPipe } from './pipes/trust-html.pipe';

import { LimitStringPipe } from './pipes/limit-string.pipe';
import { ValuesPipe } from './pipes/values.pipe';

import { HighlightDirective } from './directives/highlight.directive';

import { AppComponent } from './app.component';

import { ContactsComponent } from './pages/contacts/contacts.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HistoryComponent } from './pages/history/history.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ToolsComponent } from './pages/tools/tools.component';
import { ServerComponent } from './pages/server/server.component';
import { SendComponent } from './pages/send/send.component';
import { ReceiveComponent } from './pages/receive/receive.component';
import { NeuraliumsComponent } from './pages/neuraliums/neuraliums.component';
import { TestPageComponent } from './pages/test-page/test-page.component';

import { MainMenuComponent } from './components/main-menu/main-menu.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { LogoComponent } from './components/logo/logo.component';
import { PageTitleComponent } from './components/page-title/page-title.component';
import { SyncStatusComponent } from './components/sync-status/sync-status.component';
import { MiningComponent } from './components/mining/mining.component';
import { NeuraliumsTotalComponent } from './components/neuraliums-total/neuraliums-total.component';
import { AccountDetailsComponent } from './components/account-details/account-details.component';
import { BlockchainSyncDisplayComponent } from './components/blockchain-sync-display/blockchain-sync-display.component';
import { WalletSyncDisplayComponent } from './components/wallet-sync-display/wallet-sync-display.component';
import { ServerConnectionTestComponent } from './components/server-connection-test/server-connection-test.component';
import { DebugComponent } from './components/debug/debug.component';
import { BlockchainInfoComponent } from './components/blockchain-info/blockchain-info.component';
import { MiningEventsComponent } from './components/mining-events/mining-events.component';
import { HistoryListComponent } from './components/history-list/history-list.component';
import { AccountPublicationStatusComponent } from './components/account-publication-status/account-publication-status.component';
import { AccountRenewVerificationComponent } from './components/account-renew-verification/account-renew-verification.component';

import { TestModeMessageComponent } from './components/test-mode-message/test-mode-message.component';
import { HelpIconComponent } from './components/help-icon/help-icon.component';
import { SendNeuraliumsComponent } from './components/send-neuraliums/send-neuraliums.component';
import { NeuraliumsHistoryComponent } from './components/neuraliums-history/neuraliums-history.component';
import { BlockExplorerComponent } from './components/blockexplorer/blockexplorer.component';
import { ApiExplorerComponent } from './components/apiexplorer/apiexplorer.component';
import { UpnpComponent } from './components/upnp/upnp.component';
import { UtilitiesComponent } from './components/utilities/utilities.component';
import { AppSettingsEditor } from './components/app-settings-editor/app-settings-editor.component';


import { SelectBlockchainDialogComponent } from './dialogs/select-blockchain-dialog/select-blockchain-dialog.component';
import { AskOrCreateWalletDialogComponent } from './dialogs/ask-or-create-wallet-dialog/ask-or-create-wallet-dialog.component';
import { CreateWalletProcessDialogComponent } from './dialogs/create-wallet-process-dialog/create-wallet-process-dialog.component';
import { VerifyAccountDialogComponent } from './dialogs/verify-account-dialog/verify-account-dialog.component';

import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
import { EditContactDialogComponent } from './dialogs/edit-contact-dialog/edit-contact-dialog.component';
import { LanguageSelectionDialogComponent } from './dialogs/language-selection-dialog/language-selection-dialog.component';
import { PublishAccountDialogComponent } from './dialogs/publish-account-dialog/publish-account-dialog.component';
import { AppointmentsDialogComponent } from './dialogs/appointments-dialog/appointments-dialog.component';
import { AppointmentPuzzleDialogComponent } from './dialogs/appointment-puzzle-dialog/appointment-puzzle-dialog.component';
import { AppointmentPuzzleTestDialogComponent } from './dialogs/appointment-puzzle-test-dialog/appointment-puzzle-test-dialog.component';


import { THSDialogComponent } from './dialogs/THS-dialog/THS-dialog.component';
import { SMSDialogComponent } from './dialogs/sms-dialog/sms-dialog.component';


import { SoftwareLicenseAgreementComponent } from './dialogs/terms-of-service-dialog/software-license-agreement-dialog.component';
import { AboutDialogComponent } from './dialogs/about-dialog/about-dialog.component';
import { ServerConnectionDialogComponent } from './dialogs/server-connection-dialog/server-connection-dialog.component';
import { TransactionDetailsDialogComponent } from './dialogs/transaction-details-dialog/transaction-details-dialog.component';
import { TestModeAlterDialogComponent } from './dialogs/test-mode-alter-dialog/test-mode-alter-dialog.component';
import { AskKeyDialogComponent } from './dialogs/ask-key-dialog/ask-key-dialog.component';
import { AskCopyWalletKeyFileDialogComponent } from './dialogs/ask-copy-key-dialog/ask-copy-key-dialog.component';
import { FormatTimelineDatePipe } from './pipes/format-timeline-date.pipe';
import { FormatTimelineTimePipe, FormatETATimePipe, FormatTimelineTimePipe2 } from './pipes/format-timeline-time.pipe';

import { FormatAccountNumberPipe } from './pipes/format-account-number.pipe';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    ContactsComponent,
    DashboardComponent,
    HistoryComponent,
    ToolsComponent,
    SettingsComponent,
    ServerComponent,
    SendComponent,
    ReceiveComponent,
    MainMenuComponent,
    FooterComponent,
    HeaderComponent,
    LogoComponent,
    PageTitleComponent,
    SyncStatusComponent,
    ServerConnectionTestComponent,
    SelectBlockchainDialogComponent,
    AskOrCreateWalletDialogComponent,
    CreateWalletProcessDialogComponent,
    VerifyAccountDialogComponent,
    ConfirmDialogComponent,
    EditContactDialogComponent,
    LanguageSelectionDialogComponent,
    MiningComponent,
    PublishAccountDialogComponent,
    AppointmentsDialogComponent,
    AppointmentPuzzleDialogComponent,
    AppointmentPuzzleTestDialogComponent,
    THSDialogComponent,
    SMSDialogComponent,
    DebugComponent,
    SoftwareLicenseAgreementComponent,
    AboutDialogComponent,
    NeuraliumsTotalComponent,
    AccountDetailsComponent,
    BlockchainSyncDisplayComponent,
    WalletSyncDisplayComponent,
    BlockchainInfoComponent,
    MiningEventsComponent,
    ServerConnectionDialogComponent,
    HighlightDirective,
    TransactionDetailsDialogComponent,
    FormatNeuraliumPipe,
    TrustHtmlPipe,
    HistoryListComponent,
    AccountPublicationStatusComponent,
    AccountRenewVerificationComponent,
    LimitStringPipe,
    TestModeAlterDialogComponent,
    TestModeMessageComponent,
    HelpIconComponent,
    NeuraliumsComponent,
    SendNeuraliumsComponent,
    NeuraliumsHistoryComponent,
    BlockExplorerComponent,
    UtilitiesComponent,
    ApiExplorerComponent,
    AskKeyDialogComponent,
    AskCopyWalletKeyFileDialogComponent,
    TestPageComponent,
    FormatTimestampPipe,
    FormatDateWithTime,
    FormatTimelineDatePipe,
    FormatTimelineTimePipe,
    FormatETATimePipe,
    FormatTimelineTimePipe2,
    FormatAccountNumberPipe,
    ValuesPipe,
    UpnpComponent,
    AppSettingsEditor
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    NgxElectronModule,
    NgxJsonViewerModule,
    AppRoutingModule,
    ScrollingModule,
    MatDatepickerModule,
    MatNativeDateModule,
    TooltipModule,
    AppMaterialModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    }),
    NgxMaskModule.forRoot(),
    MatPasswordStrengthModule.forRoot()
    ],
  entryComponents: [
    SelectBlockchainDialogComponent,
    AskOrCreateWalletDialogComponent,
    CreateWalletProcessDialogComponent,
    VerifyAccountDialogComponent,
    ConfirmDialogComponent,
    EditContactDialogComponent,
    LanguageSelectionDialogComponent,
    PublishAccountDialogComponent,
    AppointmentsDialogComponent,
    AppointmentPuzzleDialogComponent,
    AppointmentPuzzleTestDialogComponent,
    THSDialogComponent,
    SMSDialogComponent,
    SoftwareLicenseAgreementComponent,
    AboutDialogComponent,
    ServerConnectionDialogComponent,
    TransactionDetailsDialogComponent,
    TestModeAlterDialogComponent,
    AskKeyDialogComponent,
    AskCopyWalletKeyFileDialogComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
