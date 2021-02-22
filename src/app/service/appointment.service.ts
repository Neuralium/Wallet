import { Injectable, OnDestroy ,NgZone} from '@angular/core';
import { WalletService } from './wallet.service';
import { WalletAccountAppointment, AppointmentStatus } from '../model/walletAccountAppointment';
import { ServerConnectionService } from './server-connection.service';
import { EventTypes, ServerConnectionEvent } from '../model/serverConnectionEvent';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from './notification.service';

import { NeuraliumBlockchainType } from '..//model/blockchain';

import { WalletAccount, NO_WALLET_ACCOUNT, WalletAccountStatus, WalletAccountVerification, AccountAppointmentConfirmationResult, AccountCanPublish, AccountPublicationModes } from '../model/walletAccount';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventHandler } from '../tools/events';
import { DateTime, Duration } from 'luxon';

export enum PuzzleStatus {

    None = 0,
    Preparation = 1,
    Execution = 2,
    PostProcess = 3,
    Failed = 4
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
    published: boolean;
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
    private currentRemainingTimePreparationVal: string;
    
    private totalRemainingTime = 0;

    private timer: NodeJS.Timeout;
    private timesInUTCVal: boolean = false;
    readonly onAppointmentStatusChanged = new EventHandler<AppointmentStatus>();
    readonly onAppointmentEventOccured = new EventHandler<ServerConnectionEvent>();
    readonly onPuzzleWindowOpen = new EventHandler<void>();
    readonly onPuzzleStatusChange = new EventHandler<PuzzleStatus>();

    constructor(private walletService: WalletService,
        private serverConnectionService: ServerConnectionService,
        private notificationService: NotificationService,
        private translateService: TranslateService,
        private _ngZone: NgZone,) {

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

                        if(this.accountPublished){
                            const verified = this.account.value.verification === WalletAccountVerification.Appointment;
                            const verificationDetails: IVerificationCompletedDetails = {verified : verified, published:true, confirmationCode : null, chainType: NeuraliumBlockchainType};
                                this.setVerificationCompletedDetails(verificationDetails);
                        }
                        else{
                            this.walletService.canPublishAccount().then(canPublishResult => {
                                const verificationDetails: IVerificationCompletedDetails = {verified : canPublishResult.canPublish, published:false, confirmationCode : canPublishResult.confirmationCode, chainType: NeuraliumBlockchainType};
                                this.setVerificationCompletedDetails(verificationDetails);
                            });  
                        }
                        
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

    get timesInUTC(): boolean {
        return this.timesInUTCVal;
    }

    set timesInUTC(value: boolean) {
        this.timesInUTCVal = value;
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
                    case EventTypes.AppointmentPuzzleFailed:
                        this.triggerAppointmentEventOccured(event);
                        this.puzzleStatus = PuzzleStatus.Failed;
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
            
            if(this.verificationDetails.value){
                return (this.verificationDetails.value.verified);
            }
        }
        return false;
    }

    get accountPublished(): boolean {

        const account = this.account.value;

        if(account && account.status === WalletAccountStatus.Published){
            return true;
        }
        return false;
    }

    
    get localAppointmentTime():  DateTime {
        return this.appointmentDetails.AppointmentTime.toLocal();
    }

    get localAppointmentPreparationTime():  DateTime {
        return this.appointmentDetails.appointmentPreparationWindowStart.toLocal();
    }

    get currentRemainingTime(): string {

        if (!this.isInAppointment || !(this.appointmentStatus === AppointmentStatus.AppointmentContextCached || this.appointmentStatus === AppointmentStatus.AppointmentSet)) {
            return null;
        }
        return this.currentRemainingTimeVal;
    }

    get currentRemainingTimePreparation(): string {

        if (!this.isInAppointment || this.appointmentStatus !== AppointmentStatus.AppointmentSet) {
            return null;
        }
        return this.currentRemainingTimePreparationVal;
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
    
    getTimeRemaining(timeStamp:DateTime):string{
        const now = DateTime.local();

        const time = timeStamp.toUTC();

        if (now < time) {

            const delta = this.expainDuration(time.diff(now));

            // humanize
            let format = '';
            let added:boolean = false;
            const days = Math.floor(delta.days);
            if (days > 0) {
                format += days + ' day';
                if(days > 1){
                    format += 's ';
                }
                else{
                    format += ' ';
                }
                added = true;
            }

            const hours = Math.floor(delta.hours);

            if (hours > 0) {
                if(added){
                    format += ' ';
                }
                format += hours + ' hour';
                if(hours > 1){
                    format += 's ';
                }
                else{
                    format += ' ';
                }
                added = true;
            }

            const minutes = Math.floor(delta.minutes);

            if (minutes > 0) {
                if(added){
                    format += ' ';
                }
                format += minutes + ' minute';
                if(minutes > 1){
                    format += 's ';
                }
                else{
                    format += ' ';
                }
                added = true;
            }

            const seconds = Math.floor(delta.seconds);

            if (seconds > 0) {
                if(added){
                    format += ' ';
                }
                format += seconds + ' second';
                if(seconds > 1){
                    format += 's ';
                }
                else{
                    format += ' ';
                }
                added = true;
            }

            if(seconds == 0 && format === ''){
                const milliseconds = Math.floor(delta.milliseconds);

                if (milliseconds > 0) {
                    if(added){
                        format += ' ';
                    }
                    format += 'less than a second';
                }
            }

            return format;
        }

        return '';
    }
    checkAppointmentStart() {

        this._ngZone.run(() => {
            if (!this.isInAppointment || !(this.appointmentStatus === AppointmentStatus.AppointmentContextCached || this.appointmentStatus === AppointmentStatus.AppointmentSet)) {
                this.puzzleStatus = PuzzleStatus.None;
                this.triggerPuzzleStatusChanged();
                return null;
            }

            const now = DateTime.utc();

            const time = this.localAppointmentTime.toUTC();

            if (now < time) {

                this.currentRemainingTimeVal = this.getTimeRemaining(this.localAppointmentTime);


                const delta = this.expainDuration(time.diff(now));
                const minutes = Math.floor(delta.minutes);

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

            if(this.appointmentStatus === AppointmentStatus.AppointmentSet){
                const timePreparation = this.localAppointmentPreparationTime.toUTC();
    
                if (now < timePreparation) {
                    this.currentRemainingTimePreparationVal = this.getTimeRemaining(this.localAppointmentPreparationTime);
                }
            }

            this.triggerPuzzleStatusChanged();
        });
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
