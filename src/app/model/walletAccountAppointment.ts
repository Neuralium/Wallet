
import { DateTime } from 'luxon';


export class WalletAccountAppointment {
    Status: AppointmentStatus;
    AppointmentConfirmationId: number | null;
    appointmentRequestTimeStamp:  DateTime | null;
    AppointmentTime:  DateTime | null;
    AppointmentContextTime:  DateTime | null;
    AppointmentVerificationTime:  DateTime | null;
    AppointmentConfirmationIdExpiration:  DateTime | null;
    AppointmentWindow: number | null;
    AppointmentRequestedRegion: number | null;

    appointmentPreparationWindowStart: DateTime | null;
    appointmentPreparationWindowEnd: DateTime | null;
    

    static createNew(
        status: AppointmentStatus,
        appointmentConfirmationId: number | null,
        appointmentRequestTimeStamp:  DateTime | null,
        appointmentTime:  DateTime | null,
        appointmentContextTime:  DateTime | null,
        appointmentVerificationTime:  DateTime | null,
        appointmentConfirmationIdExpiration:  DateTime | null,
        appointmentWindow: number | null,
        appointmentRequestedRegion: number | null,
        appointmentPreparationWindowStart: DateTime | null,
        appointmentPreparationWindowEnd: DateTime | null) {
        const newAppointment = new WalletAccountAppointment();

        newAppointment.Status = status;
        newAppointment.AppointmentConfirmationId = appointmentConfirmationId;
        newAppointment.appointmentRequestTimeStamp = appointmentRequestTimeStamp;
        newAppointment.AppointmentTime = appointmentTime;
        newAppointment.AppointmentContextTime = appointmentContextTime;
        newAppointment.AppointmentVerificationTime = appointmentVerificationTime;
        newAppointment.AppointmentConfirmationIdExpiration = appointmentConfirmationIdExpiration;
        newAppointment.AppointmentWindow = appointmentWindow;
        newAppointment.AppointmentRequestedRegion = appointmentRequestedRegion;
        newAppointment.appointmentPreparationWindowStart = appointmentPreparationWindowStart;
        newAppointment.appointmentPreparationWindowEnd = appointmentPreparationWindowEnd;

        return newAppointment;
    }
}


export enum AppointmentStatus {
    None = 0,
    AppointmentRequested = 1,
    AppointmentSet = 2,
    AppointmentContextCached = 3,
    AppointmentPuzzleCompleted = 4,
    AppointmentCompleted = 5
}

