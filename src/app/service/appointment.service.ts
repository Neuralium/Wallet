import { Injectable, OnDestroy } from '@angular/core';
import { WalletService } from './wallet.service';
import { WalletAccountAppointment, AppointmentStatus } from '../model/walletAccountAppointment';
import { ServerConnectionService } from './server-connection.service';
import { EventTypes, ServerConnectionEvent } from '../model/serverConnectionEvent';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';

import { NeuraliumBlockchainType } from '..//model/blockchain';

import { WalletAccount, NO_WALLET_ACCOUNT, WalletAccountStatus, AccountAppointmentConfirmationResult, AccountCanPublish, AccountPublicationModes } from '../model/walletAccount';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventHandler } from '../tools/events';
import { DateTime, Duration } from 'luxon';

export enum PuzzleStatus {

    None = 0,
    Preparation = 1,
    Execution = 2,
    PostProcess = 3
}

export interface IPuzzleDetails {
    chainType: number;
    secretCode: number;
    puzzles: Array<string>;
    instructions: Array<string>;
}

export interface IVerificationCompletedDetails {
    chainType: number;
    verified: boolean;
    confirmationCode: string;
}


@Injectable({
    providedIn: 'root'
})
export class AppointmentsService {

    account: BehaviorSubject<WalletAccount> = new BehaviorSubject<WalletAccount>(NO_WALLET_ACCOUNT);

    appointmentDetailsBehavior: BehaviorSubject<WalletAccountAppointment | null> = new BehaviorSubject<WalletAccountAppointment | null>(new WalletAccountAppointment());
    puzzleDetails: BehaviorSubject<IPuzzleDetails | null> = new BehaviorSubject<IPuzzleDetails | null>(null);
    verificationDetails: BehaviorSubject<IVerificationCompletedDetails | null> = new BehaviorSubject<IVerificationCompletedDetails | null>(null);

    correlationId = 0;
    eventsRegistered = false;
    puzzleStatus: PuzzleStatus = PuzzleStatus.None;
    lastPuzzleStatus: PuzzleStatus = PuzzleStatus.None;

    private currentRemainingTimeVal: string;
    private totalRemainingTime = 0;

    private timer: NodeJS.Timeout;

    readonly onAppointmentStatusChanged = new EventHandler<AppointmentStatus>();
    readonly onAppointmentEventOccured = new EventHandler<ServerConnectionEvent>();
    readonly onPuzzleWindowOpen = new EventHandler<void>();
    readonly onPuzzleStatusChange = new EventHandler<PuzzleStatus>();

    constructor(private walletService: WalletService,
        private serverConnectionService: ServerConnectionService,
        private notificationService: NotificationService,
        private translateService: TranslateService) {

        this.walletService.getCurrentAccount().subscribe(account => {

            this.account.next(account);
            this.getAppointmentDetails();
        });
    }

    getAppointmentDetails(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInAppointment) {
                this.walletService.GetAppointmentDetails().then(result => {
                    this.appointmentDetailsBehavior.next(result);

                    if (result.Status === AppointmentStatus.AppointmentCompleted) {
                        // lets query the status
                        this.walletService.canPublishAccount().then(canPublishResult => {

                            const verificationDetails: IVerificationCompletedDetails = {verified : canPublishResult.canPublish, confirmationCode : canPublishResult.confirmationCode, chainType: NeuraliumBlockchainType};
                            this.setVerificationCompletedDetails(verificationDetails);
                        });
                    }
                    this.updateRemainingTime();
                });
                this.startListeningMiningEvents();
            } else {
                this.appointmentDetailsBehavior.next(null);
            }

            resolve();
        });
    }

    setPuzzleAnswers(answers: Array<number>): Promise<void> {
        if (this.walletService.currentBlockchainId === 0) {
            return new Promise<void>((resolve, reject) => {
                reject(null);
            });
        }
        return this.serverConnectionService.callSetPuzzleAnswers(this.walletService.currentBlockchainId, answers);
    }

    get isInAppointment(): boolean {
        if (this.account.value) {
            return this.account.value.inAppointment;
        }
        return false;
    }

    get appointmentDetails(): WalletAccountAppointment {
        if (this.appointmentDetailsBehavior.value) {
            return this.appointmentDetailsBehavior.value;
        }
        return undefined;
    }
    get appointmentStatus(): AppointmentStatus {
        if (this.appointmentDetails) {
            return this.appointmentDetails.Status;
        }
        return AppointmentStatus.None;
    }

    private triggerAppointmentStatusChanged() {
        this.onAppointmentStatusChanged.trigger(this.appointmentDetails.Status);
    }

    private triggerAppointmentEventOccured(event: ServerConnectionEvent) {
        this.onAppointmentEventOccured.trigger(event);
    }

    private triggerPuzzleStatusChanged() {
        if (this.lastPuzzleStatus !== this.puzzleStatus) {
            this.onPuzzleStatusChange.trigger(this.puzzleStatus);
            this.lastPuzzleStatus = this.puzzleStatus;
        }
    }

    startListeningMiningEvents() {
        if (!this.eventsRegistered) {
            this.serverConnectionService.eventNotifier.subscribe(event => {
                if (!event.isNeuralium) {
                    return;
                }

                switch (event.eventType) {

                    case EventTypes.AppointmentRequestSent:
                        this.triggerAppointmentEventOccured(event);
                        this.translateService.get('appointments.RequestCompleted').subscribe((res: string) => {
                            this.notificationService.showSuccess(res);
                        });
                        this.getAppointmentDetails().then(() => {
                            this.triggerAppointmentStatusChanged();
                        });
                        break;
                    case EventTypes.AppointmentRequestConfirmed:
                        this.triggerAppointmentEventOccured(event);
                        this.translateService.get('appointments.RequestConfirmed').subscribe((res: string) => {
                            this.notificationService.showSuccess(res);
                        });
                        this.getAppointmentDetails().then(() => {
                            this.triggerAppointmentStatusChanged();
                            this.checkAppointmentStart();
                        });
                        this.updateRemainingTime();
                        break;
                    case EventTypes.AppointmentContextCached:
                        this.triggerAppointmentEventOccured(event);
                        this.translateService.get('appointments.AppointmentContextCached').subscribe((res: string) => {
                            this.notificationService.showSuccess(res);
                        });
                        this.getAppointmentDetails().then(() => {
                            this.triggerAppointmentStatusChanged();
                            this.checkAppointmentStart();
                        });
                        this.updateRemainingTime();
                        break;
                    case EventTypes.AppointmentPuzzlePreparation:
                        this.triggerAppointmentEventOccured(event);
                        this.puzzleStatus = PuzzleStatus.Preparation;
                        this.getAppointmentDetails().then(() => {
                            this.triggerPuzzleWindow();
                        });
                        break;
                    case EventTypes.AppointmentPuzzleBegin:
                        this.triggerAppointmentEventOccured(event);
                        this.setPuzzleExecution(<IPuzzleDetails>(event.message));
                        this.getAppointmentDetails().then(() => {
                            this.triggerPuzzleWindow();
                            this.triggerPuzzleStatusChanged();
                        });
                        break;
                    case EventTypes.AppointmentPuzzleCompleted:
                        this.triggerAppointmentEventOccured(event);
                        this.puzzleStatus = PuzzleStatus.PostProcess;
                        this.triggerPuzzleStatusChanged();
                        break;
                    case EventTypes.AppointmentVerificationRequestCompleted:
                        this.triggerAppointmentEventOccured(event);
                        this.puzzleStatus = PuzzleStatus.None;
                        this.triggerPuzzleStatusChanged();
                        this.translateService.get('appointments.VerificationRequestSent').subscribe((res: string) => {
                            this.notificationService.showSuccess(res);
                        });
                        this.getAppointmentDetails().then(() => {
                            this.triggerAppointmentStatusChanged();
                        });
                        break;
                    case EventTypes.AppointmentVerificationCompleted:
                        this.triggerAppointmentEventOccured(event);
                        this.puzzleStatus = PuzzleStatus.None;
                        this.triggerPuzzleStatusChanged();
                        const verificationresult = <IVerificationCompletedDetails>(event.message);
                        this.setVerificationCompletedDetails(verificationresult);

                        if (verificationresult.verified) {
                            this.translateService.get('appointments.VerificationRequestCompleted').subscribe((res: string) => {
                                this.notificationService.showSuccess(res);
                            });
                        } else {
                            this.translateService.get('appointments.VerificationRequestRejected').subscribe((res: string) => {
                                this.notificationService.showError(res);
                            });
                        }
                        this.getAppointmentDetails().then(() => {
                            this.triggerAppointmentStatusChanged();
                        });
                        break;
                    case EventTypes.Error:

                        if (event.correlationId === this.correlationId) {
                            this.triggerAppointmentEventOccured(event);

                            this.notificationService.showError(event.message.message);
                        }
                        break;
                    case EventTypes.InvalidPuzzleEngineVersion:
                        this.translateService.get('appointments.InvalidPuzzleEngineVersion').subscribe((res: string) => {
                            this.notificationService.showError(res);
                        });
                        break;
                    default:
                        break;
                }
            });
            this.eventsRegistered = true;
        }
    }

    setPuzzleExecution(message: IPuzzleDetails) {
        this.puzzleStatus = PuzzleStatus.Execution;
        this.puzzleDetails.next(message);
    }

    setVerificationCompletedDetails(message: IVerificationCompletedDetails) {
        this.verificationDetails.next(message);
    }

    get isPuzzleDetailsSet(): boolean {
        if (this.puzzleStatus !== PuzzleStatus.None && this.puzzleDetails.value && this.puzzleDetails.value.secretCode !== 0) {
            return true;
        }
        return false;
    }

    get verificationConfirmed(): boolean {

        if (this.appointmentStatus === AppointmentStatus.AppointmentCompleted && this.verificationDetails.value) {
            return this.verificationDetails.value.verified;
        }
        return false;
    }

    get localAppointmentTime():  DateTime {
        return this.appointmentDetails.AppointmentTime.toLocal();
    }


    get currentRemainingTime(): string {

        if (!this.isInAppointment || !(this.appointmentStatus === AppointmentStatus.AppointmentContextCached || this.appointmentStatus === AppointmentStatus.AppointmentSet)) {
            return null;
        }
        return this.currentRemainingTimeVal;
    }

    triggerPuzzleWindow() {

        if (this.puzzleStatus !== PuzzleStatus.None) {
            this.onPuzzleWindowOpen.trigger();
        }
    }

    bypassAppointmentVerification() {
        const promise = this.walletService.bypassAppointmentVerification();
        promise.then(result => {

            if (result) {
                this.getAppointmentDetails();
            }
        });
        return promise;
    }

    public expainDuration(entry:Duration):Duration{
        return entry.shiftTo('days', 'hours', 'minutes', 'seconds');
    }
    
    checkAppointmentStart() {

        if (!this.isInAppointment || !(this.appointmentStatus === AppointmentStatus.AppointmentContextCached || this.appointmentStatus === AppointmentStatus.AppointmentSet)) {
            this.puzzleStatus = PuzzleStatus.None;
            this.triggerPuzzleStatusChanged();
            return null;
        }

        const now = DateTime.local();

        const time = this.localAppointmentTime.toUTC();

        if (now < time) {

            const delta = this.expainDuration(time.diff(now));

            // humanize
            let format = '';

            const days = Math.floor(delta.days);

            if (days > 0) {
                format += days + ' day(s) ';
            }

            const hours = Math.floor(delta.hours);

            if (hours > 0) {
                format += hours + ' hour(s) ';
            }

            const minutes = Math.floor(delta.minutes);

            if (minutes > 0) {
                format += minutes + ' minute(s) ';
            }

            const seconds = Math.floor(delta.seconds);

            if (seconds > 0) {
                format += seconds + ' second(s) ';
            }

            this.currentRemainingTimeVal = format;

            if (minutes <= 5) {

                // this.puzzleStatus = PuzzleStatus.Preparation;
                // time to trigger the puzzle!
                this.triggerPuzzleWindow();
            }
        } else {
            const delta = this.expainDuration(now.diff(time));
            const seconds = delta.seconds;

            if (seconds <= this.appointmentDetails.AppointmentWindow) {
                // this.puzzleStatus = PuzzleStatus.Execution;

                this.triggerPuzzleWindow();
            } else {
                // this.puzzleStatus = PuzzleStatus.PostProcess;
            }
        }

        this.triggerPuzzleStatusChanged();
    }

    updateRemainingTime() {

        if (!this.isInAppointment || !(this.appointmentStatus === AppointmentStatus.AppointmentContextCached || this.appointmentStatus === AppointmentStatus.AppointmentSet)) {
            clearTimeout(this.timer);
            return null;
        }

        this.timer = setTimeout(() => {

            this.checkAppointmentStart();

            this.updateRemainingTime();

        }, 1000);
    }

    callQueryAppointmentConfirmationResult(): Promise<AccountAppointmentConfirmationResult> {
        return this.walletService.queryAppointmentConfirmationResult();
    }

}
