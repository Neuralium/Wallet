import { NeuraliumBlockchainType, NullBlockchainType } from '../model/blockchain';

export const CONNECTED = true;

export class ServerConnectionEvent {
    correlationId: number;
    eventType: EventTypes;
    eventResponse: ResponseResult;
    blockchainType: number;
    message: any;

    static createNew(
        correlationId: number,
        eventType: EventTypes = EventTypes.DefaultEvent,
        eventResponse: ResponseResult = ResponseResult.Success,
        blockchainType: number = NullBlockchainType,
        message: any = "")
        : ServerConnectionEvent {
        var item = new ServerConnectionEvent();
        item.correlationId = correlationId;
        item.eventType = eventType;
        item.eventResponse = eventResponse;
        item.blockchainType = blockchainType;
        item.message = message;
        return item;
    }

    get isNeuralium(): boolean {
        return this.blockchainType === NeuraliumBlockchainType;
    }

    static NO_EVENT = <ServerConnectionEvent>{ correlationId: 0, message: "No event", blockchainType: NeuraliumBlockchainType };
}

export enum ResponseResult {
    Default = 0,
    Success = 1,
    Error = 99
}

export enum EventTypes {

    DefaultEvent = 0,
    WalletLoadingStarted = 1,
    WalletLoadingEnded = 2,
    WalletLoadingError = 3,
    RequestWalletPassphrase = 4,
    RequestKeyPassphrase = 5,
    RequestCopyWallet = 6,
    PeerTotalUpdated = 7,
    WalletCreationStarted = 108,
    WalletCreationEnded = 109,
    WalletCreationMessage = 110,
    WalletCreationStep = 111,
    WalletCreationError = 112,
    AccountCreationStarted = 113,
    AccountCreationEnded = 114,
    AccountCreationMessage = 115,
    AccountCreationStep = 116,
    AccountCreationError = 117,
    KeyGenerationStarted = 118,
    KeyGenerationEnded = 119,
    KeyGenerationMessage = 120,
    KeyGenerationPercentageUpdate = 121,
    KeyGenerationError = 122,
    AccountStatusUpdated = 123,
    AccountPublicationStarted = 124,
    AccountPublicationEnded = 125,
    AccountPublicationMessage = 126,
    AccountPublicationStep = 127,
    AccountPublicationError = 128,
    WalletSyncStarted = 129,
    WalletSyncEnded = 130,
    WalletSyncUpdate = 131,
    WalletSyncError = 132,
    TransactionSent = 133,
    TransactionCreated = 134,
    TransactionConfirmed = 135,
    TransactionReceived = 136,
    TransactionMessage = 137,
    TransactionRefused = 138,
TransactionError = 139,
BlockchainSyncStarted = 140,
BlockchainSyncEnded = 141,
BlockchainSyncUpdate = 142,
BlockchainSyncError = 143,
MiningStarted = 144,
MiningEnded = 145,
MiningElected = 146,
MiningPrimeElected = 147,
MiningPrimeElectedMissed = 148,
MiningStatusChanged = 149,
BlockInserted = 150,
DigestInserted = 151,
BlockInterpreted = 152,
Message = 153,
Error = 154,
RequestCopyKeyFile = 155,
Alert = 156,
ConnectableStatusChanged = 157,
RequireNodeUpdate = 158,
ImportantWalletUpdate = 159,
TransactionHistoryUpdated = 160,
ElectionContextCached = 161,
ElectionProcessingCompleted = 162,
RequestShutdown = 163,
THSTrigger = 164,
THSBegin = 165,
THSRound = 166,
THSIteration = 167,
THSSolution = 168,
AppointmentReset = 169,
AppointmentRequestSent = 170,
AppointmentRequestFailed = 171,
AppointmentRequestConfirmed = 172,
AppointmentContextCached = 173,
AppointmentPuzzlePreparation = 174,
AppointmentPuzzleBegin = 175,
AppointmentPuzzleCompleted = 176,
AppointmentPuzzleFailed = 177,
AppointmentVerificationRequestCompleted = 178,
AppointmentVerificationCompleted = 179,
InvalidPuzzleEngineVersion = 180,





    AccountTotalUpdated = 1001,
    NeuraliumMiningBountyAllocated = 1002,
    NeuraliumMiningPrimeElected = 1003,
    NeuraliumTimelineUpdated = 1004,

    // INTERNAL TO WALLET DESKTOP
    ShutdownStarted = 10001,
    ShutdownCompleted = 10002,
    ConsoleMessage = 10003

}

