import { Injectable, OnDestroy, OnInit } from '@angular/core';
import { NotificationService } from './notification.service';

import { HubConnectionBuilder, HttpTransportType, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { LogService } from './log.service';
import { WalletCreation } from '../model/wallet';
import { NullBlockchainType, NeuraliumBlockchainType } from '../model/blockchain';

import { ConfigService } from './config.service';
import { NeuraliumCall } from '../business/serverCall/neuraliumCall';
import { TransactionsCall } from '../business/serverCall/transactionsCall';
import { ServerConnectionEvent, EventTypes, ResponseResult } from '../model/serverConnectionEvent';
import { ServerCall } from '../business/serverCall/serverCall';
import { PortMappingCall } from '../business/serverCall/portMappingCall';
import { MiningCall } from '../business/serverCall/miningCall';
import { AccountCall } from '../business/serverCall/accountCall';
import { WalletCall } from '../business/serverCall/walletCall';
import { BlockchainCall } from '../business/serverCall/blockchainCall';
import { DebugCall } from '../business/serverCall/debugCall';
import { KeyPassphraseParameters, PassphraseParameters } from '../model/passphraseRequiredParameters';
import { PassphrasesCall } from '../business/serverCall/passphrasesCall';
import { remote } from 'electron';
import { DateTime } from 'luxon';
import { takeUntil } from 'rxjs/operators';

const RETRY_DURATION = 3000;
export const MESSAGE_BUFFER_SIZE = 4000;

export class ServerMessage {

  public message: string;
  public timestamp:  DateTime;
  public level: string;
  public properties: Array<Object>;

  constructor(message: string, timestamp:  DateTime, level: string, properties: Array<Object>) {
      this.message = message;
      this.timestamp = timestamp;
      this.level = level;
      this.properties = properties;
  }

  GetThread(): object {
    return this.properties[0];
  }
}

@Injectable({
  providedIn: 'root'
})
export class ServerConnectionService {

  get showServerNotConnected(): Observable<boolean> {
    return this.showServerNotConnectedObs;
  }

  constructor(
    private notificationService: NotificationService,
    private logService: LogService,
    private configService: ConfigService) {

    this.serverPort = this.configService.serverPort;
    this.serverPath = this.configService.serverPath;

    this.beginConnection();

    this.configService.setServerConnectionService(this);

  }


  public get IsConnected(): boolean {
    return this.connection && this.connection.state === HubConnectionState.Connected;
  }

  get connection(): HubConnection {
    if(!this.cnx){

      this.serverPort = this.configService.serverPort;
      this.cnx = new HubConnectionBuilder()
        .configureLogging(LogLevel.None)
        .withUrl('http://127.0.0.1:' + this.serverPort.toString().trim() + '/signal', {
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets
        })

        .withAutomaticReconnect()
        .build();

        this.cnx.serverTimeoutInMilliseconds = 60 * 1000;
        this.cnx.keepAliveIntervalInMilliseconds = 30 * 1000;
    }

    this.cnx.onclose(() => {
      this.cnx.stop();
      this.logService.logDebug(' Connection Closed', {  });
      this.notifyServerConnectionStatusIfNeeded(false);
      this.isConnecting = false;
      this.beginConnection();
    });

    return this.cnx;
  }

  private showServerNotConnectedObs: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  serverPort: number;
  serverPath: string;
  eventNotifier: Subject<ServerConnectionEvent> = new Subject<ServerConnectionEvent>();
  serverConnection: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private isCurrentlyConnected: boolean = false;

  public messages:Array<ServerMessage> = new Array<ServerMessage>();
  consoleMessagesEnabled: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


  private isConnecting:boolean = false;

  private cnx:HubConnection;

  registerConnectionEvent(action:string, newMethod: (...args: any[]) => void): void{
    const cnx = this.connection;

    cnx.off(action);
    cnx.on(action, newMethod);
  }

  setShowServerNotConnected(value: boolean) {
    this.showServerNotConnectedObs.next(value);
  }


  public beginConnection(){

    this.tryConnectToServer().then(() => {
      this.notifyServerConnectionStatusIfNeeded(true);
      this.startListeningWalletCreationEvents()
      this.startListeningAccountPublicationEvents();
      this.startListeningBlockchainSyncEvents();
      this.startListeningKeyGenerationEvents();
      this.startListeningMiningEvents();
      this.startListeningTransactionEvents();
      this.startListeningWalletSyncEvents();
      this.startOtherEventsListening();
      this.startListeningAppointmentEvents();
      this.startListeningTHSEvents();
    });
  }

getMessages(): Array<ServerMessage> {
    return this.messages;
  }

  startOtherEventsListening() {
    this.listenToRequestCopyWallet();
    this.listenToRequestCopyWalletKeyFile();
    this.listenToLongRunningStatusUpdate();
    this.listenToReturnClientLongRunningEvent();

    this.listenToAccountTotalUpdated();
    this.listenToPeerTotalUpdated();

    this.listenToServerShutdownStarted();
    this.listenToServerShutdownCompleted();

    this.listenToBlockInserted();

    this.listenToConsoleMessage();

    this.listenToError();
    this.listenToMessage();
    this.listenToAlert();
    this.listenToImportantWalletUpdate();

    this.listenToEnterKeyPassphrase();
    this.listenToEnterWalletPassphrase();

    this.listenToRequireNodeUpdate();
  }

  startListeningWalletCreationEvents() {
    this.listenToWalletCreationStarted();
    this.listenToWalletCreationEnded();
  }



  startListeningKeyGenerationEvents() {
    this.listenToKeyGenerationEnded();
    this.listenToKeyGenerationPercentageUpdate();
    this.listenToKeyGenerationStarted();
  }

  startListeningAccountPublicationEvents() {
    this.listenToAccountPublicationStarted();
    this.listenToAccountPublicationEnded();
    this.listenToAccountPublicationError();
  }


  startListeningWalletSyncEvents() {
    this.listenToWalletSyncEnded();
    this.listenToWalletSyncUpdate();
    this.listenToWalletSyncStarted();
  }

  startListeningBlockchainSyncEvents() {
    this.listenToBlockchainSyncEnded();
    this.listenToBlockchainSyncUpdate();
    this.listenToBlockchainSyncStarted();
  }

  startListeningTransactionEvents() {
    this.listenToTransactionConfirmed();
    this.listenToTransactionError();
    this.listenToTransactionMessage();
    this.listenToTransactionReceived();
    this.listenToTransactionRefused();
    this.listenToTransactionSent();
    this.listenToTransactionHistoryUpdated();
    this.listenToNeuraliumTimelineUpdated();
  }

  startListeningMiningEvents() {
    this.listenToNeuraliumMiningBountyAllocated();
    this.listenToMiningConnectableStatusChanged();
    this.listenToNeuraliumMiningPrimeElected();
    this.listenToMiningElected();
    this.listenToMiningPrimeElectedMissed();
    this.listenToMiningEnded();
    this.listenToMiningStarted();
    this.listenToElectionContextCached();
    this.listenToElectionProcessingCompleted();

  }

  startListeningAppointmentEvents() {
    this.listenToAppointmentPuzzleBegin();
    this.listenToAppointmentVerificationCompleted();
    this.listenToInvalidPuzzleEngineVersion();
  }

  startListeningTHSEvents() {
    this.listenToTHSTrigger();
    this.listenToTHSBegin();
    this.listenToTHSRound();
    this.listenToTHSIteration();
    this.listenToTHSSolution();
  }



  // DEBUG

  callRefillNeuraliums(accountCode: string): Promise<boolean> {
    const service = DebugCall.create(this, this.logService);
    return service.callRefillNeuraliums(accountCode);
  }

  // FIN DEBUG

  //server call methods
  callSetActiveAccount(chainType: number, accountCode: string): Promise<boolean> {
    const service = AccountCall.create(this, this.logService);
    return service.callSetActiveAccount(chainType, accountCode);
  }

  callServerShutdown(): Promise<boolean> {
    const service = ServerCall.create(this, this.logService);
    return service.callServerShutdown();
  }

  callTestP2pPort(): Promise<boolean> {
    const service = ServerCall.create(this, this.logService);
    return service.callTestP2pPort();
  }

  callCreateNewWallet(chainType: number, wallet: WalletCreation): Promise<number> {
    const service = WalletCall.create(this, this.logService);
    return service.callCreateNewWallet(chainType, wallet);
  }

  callSetWalletPassphrase(correlationId: number, password: string, setKeysToo : boolean) {
    const service = WalletCall.create(this, this.logService);
    return service.callSetWalletPassphrase(correlationId, password, setKeysToo);
  }

  callSetKeysPassphrase(correlationId: number, password: string) {
    const service = WalletCall.create(this, this.logService);
    return service.callSetKeysPassphrase(correlationId, password);
  }

  callQuerySystemVersion() {
    const service = ServerCall.create(this, this.logService);
    const result = service.callQuerySystemVersion();

    result.then(response => {
      // capture the results
      this.consoleMessagesEnabled.next(response.consoleEnabled);
    });
    return result;
  }

  callQueryWalletTransactionHistory(chainType: number, accountCode: string) {
    const service = TransactionsCall.create(this, this.logService);
    return service.callQueryWalletTransactionHistory(chainType, accountCode);
  }

  callQueryTransationHistoryDetails(chainType: number, accountCode: string, transactionId: string) {
    const service = TransactionsCall.create(this, this.logService);
    return service.callQueryTransationHistoryDetails(chainType, accountCode, transactionId);
  }

  callQueryWalletAccounts(chainType: number) {
    const service = WalletCall.create(this, this.logService);
    return service.callQueryWalletAccounts(chainType);
  }

  callQueryWalletAccountDetails(chainType: number, accountCode: string) {
    const service = WalletCall.create(this, this.logService);
    return service.callQueryWalletAccountDetails(chainType, accountCode);
  }

  callBypassAppointmentVerification(chainType: number, accountCode: string) {
    const service = WalletCall.create(this, this.logService);
    return service.callBypassAppointmentVerification(chainType, accountCode);
  }

  callQueryWalletAccountAppointmentDetails(chainType: number, accountCode: string) {
    const service = WalletCall.create(this, this.logService);
    return service.callQueryWalletAccountAppointmentDetails(chainType, accountCode);
  }

  callRequestAppointment(chainType: number, accountCode: string, preferredRegion:number) {
    const service = WalletCall.create(this, this.logService);
    return service.callRequestAppointment(chainType, accountCode, preferredRegion);
  }


  callSetPuzzleAnswers(chainType: number, answers: Array<number>) {
    const service = BlockchainCall.create(this, this.logService);
    return service.callSetPuzzleAnswers(chainType, answers);
  }

  callQueryBlockChainInfo(chainType: number) {
    const service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlockChainInfo(chainType);
  }

  callQuerySupportedChains() {
    const service = BlockchainCall.create(this, this.logService);
    return service.callQuerySupportedChains();
  }

  callCompleteLongRunningEvent(correlationId: number) {
    const service = ServerCall.create(this, this.logService);
    return service.callCompleteLongRunningEvent(correlationId);
  }

  callRenewLongRunningEvent(correlationId: number) {
    const service = ServerCall.create(this, this.logService);
    return service.callRenewLongRunningEvent(correlationId);
  }

  callQueryChainStatus(chainType: number) {
    const service = BlockchainCall.create(this, this.logService);
    return service.callQueryChainStatus(chainType);
  }



  callQueryApi(chainType: number, method:string, parameters:string){
    const service = ServerCall.create(this, this.logService);
    return service.callApiQuery(chainType, method, parameters);
  }

  callQueryBlock(chainType: number, blockId:number){
    const service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlock(chainType, blockId);
  }


  callGetCurrentOperatingMode(chainType: number){
    const service = BlockchainCall.create(this, this.logService);
    return service.callGetCurrentOperatingMode(chainType);
  }

  callQueryWalletInfo(chainType: number){
    const service = BlockchainCall.create(this, this.logService);
    return service.callQueryWalletInfo(chainType);
  }

  callStartMining(chainType: number, tier:number, delegateAccountId: string) {
    const service = MiningCall.create(this, this.logService);
    return service.callStartMining(chainType, tier, delegateAccountId);
  }

  callStopMining(chainType: number) {
    const service = MiningCall.create(this, this.logService);
    return service.callStopMining(chainType);
  }

  callIsMiningEnabled(chainType: number) {
    const service = MiningCall.create(this, this.logService);
    return service.callIsMiningEnabled(chainType);
  }

  callQueryMiningHistory(chainType: number, page: number, pageSize: number, maxLevel: number) {
    const service = MiningCall.create(this, this.logService);
    return service.callQueryMiningHistory(chainType, page, pageSize, maxLevel);
  }

  callQueryMiningStatistics(chainType: number) {
    const service = MiningCall.create(this, this.logService);
    return service.callQueryMiningStatistics(chainType);
  }

  callClearCachedCredentials(chainType: number) {
    const service = MiningCall.create(this, this.logService);
    return service.callClearCachedCredentials(chainType);
  }


  callQueryCurrentDifficulty(chainType: number) {
    const service = MiningCall.create(this, this.logService);
    return service.callQueryCurrentDifficulty(chainType);
  }

  callQueryTotalConnectedPeersCount() {
    const service = ServerCall.create(this, this.logService);
    return service.callQueryTotalConnectedPeersCount();
  }
  callQueryPeerConnectionDetails() {
    const service = ServerCall.create(this, this.logService);
    return service.callQueryPeerConnectionDetails();
  }
  callQueryMiningPortConnectable(){
    const service = ServerCall.create(this, this.logService);
    return service.callQueryMiningPortConnectable();
  }

  GetPortMappingStatus(){
    const service = PortMappingCall.create(this, this.logService);
    return service.GetPortMappingStatus();
  }

  callConfigurePortMappingMode(useUPnP:boolean, usePmP:boolean, natDeviceIndex:number){
    const service = PortMappingCall.create(this, this.logService);
    return service.callConfigurePortMappingMode(useUPnP, usePmP, natDeviceIndex);
  }
  callQueryMiningIPMode(chainType: number){
    const service = MiningCall.create(this, this.logService);
    return service.callQueryMiningIPMode(chainType);
  }

  callQueryBlockchainSynced(chainType: number) {
    const service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlockchainSynced(chainType);
  }

  callIsBlockchainSynced(chainType: number): Promise<boolean> {
    const service = BlockchainCall.create(this, this.logService);
    return service.callIsBlockchainSynced(chainType);
  }

  callQueryWalletSynced(chainType: number) {
    const service = WalletCall.create(this, this.logService);
    return service.callQueryWalletSynced(chainType);
  }

  callIsWalletLoaded(chainType: number) {
    const service = WalletCall.create(this, this.logService);
    return service.callIsWalletLoaded(chainType);
  }

  callWalletExists(chainType: number) {
    const service = WalletCall.create(this, this.logService);
    return service.callWalletExists(chainType);
  }

  callLoadWallet(chainType: number, passphrase:string) {
    const service = WalletCall.create(this, this.logService);
    return service.callLoadWallet(chainType, passphrase);
  }

  callIsWalletSynced(chainType: number): Promise<boolean> {
    const service = WalletCall.create(this, this.logService);
    return service.callIsWalletSynced(chainType);
  }

  callCanPublishAccount(chainType: number, accountCode: string) {
    const service = WalletCall.create(this, this.logService);
    return service.callCanPublishAccount(chainType, accountCode);
  }

  callQueryAppointmentConfirmationResult(chainType: number, accountCode: string) {
    const service = WalletCall.create(this, this.logService);
    return service.callQueryAppointmentConfirmationResult(chainType, accountCode);
  }

  callSetSMSConfirmationCode(chainType: number, accountCode: string, confirmationCode:string){
    const service = WalletCall.create(this, this.logService);
    return service.callSetSMSConfirmationCode(chainType, accountCode, confirmationCode);
  }

  callQueryBlockHeight(chainType: number) {
    const service = BlockchainCall.create(this, this.logService);
    return service.callQueryBlockHeight(chainType);
  }

  callPublishAccount(chainType: number, accountUuId: string) {
    const service = AccountCall.create(this, this.logService);
    return service.callPublishAccount(chainType, accountUuId);
  }

  callSendNeuraliums(targetAccountId: string, amount: number, tip: number, note: string) {
    const service = NeuraliumCall.create(this, this.logService);
    return service.callSendNeuraliums(targetAccountId, amount, tip, note);
  }

  callQueryAccountTotalNeuraliums(accountCode: string) {
    const service = NeuraliumCall.create(this, this.logService);
    return service.callQueryAccountTotalNeuraliums(accountCode);
  }

  callQueryNeuraliumTimelineHeader(accountCode: string) {
    const service = NeuraliumCall.create(this, this.logService);
    return service.callQueryNeuraliumTimelineHeader(accountCode);
  }

  callQueryNeuraliumTimelineSection(accountCode: string, day:  DateTime) {
    const service = NeuraliumCall.create(this, this.logService);
    return service.callQueryNeuraliumTimelineSection(accountCode, day);
  }

  // PASSPHRASES CALL

  callEnterWalletPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string, setKeysToo: boolean): Promise<boolean> {
    const service = PassphrasesCall.create(this, this.logService);
    return service.callEnterWalletPassphrase(correlationId, chainType, keyCorrelationCode, passphrase, setKeysToo);
  }

  callEnterKeyPassphrase(correlationId: number, chainType: number, keyCorrelationCode: number, passphrase: string): Promise<boolean> {
    const service = PassphrasesCall.create(this, this.logService);
    return service.callEnterKeyPassphrase(correlationId, chainType, keyCorrelationCode, passphrase);
  }

  callWalletKeyFileCopied(correlationId: number, chainType: number, keyCorrelationCode: number): Promise<boolean> {
    const service = PassphrasesCall.create(this, this.logService);
    return service.callWalletKeyFileCopied(correlationId, chainType, keyCorrelationCode);
  }

  callEnableConsoleMessages(enabled:boolean): Promise<boolean> {
    const service = ServerCall.create(this, this.logService);
    const result = service.callEnableConsoleMessages(enabled);

    result.then(enabled => {
      // capture the result and propagate it
      this.consoleMessagesEnabled.next(enabled);
    });
    return result;

  }

  //server listening
  listenToServerShutdownStarted() {
    const cnx = this.connection;
    const action = 'ShutdownStarted';


    this.registerConnectionEvent(action, () => {
      this.logEvent(action + ' - event', null);
      this.propagateEvent(0, EventTypes.ShutdownStarted, ResponseResult.Success, NullBlockchainType, 'Shutdown Started');
    });
  }

  listenToServerShutdownCompleted() {
    const cnx = this.connection;
    const action = 'ShutdownCompleted';


    this.registerConnectionEvent(action, () => {
      this.logEvent(action + ' - event', null);
      this.propagateEvent(0, EventTypes.ShutdownCompleted, ResponseResult.Success, NullBlockchainType, 'Shutdown Completed');
    });
  }

  listenToRequestCopyWallet() {
    const cnx = this.connection;
    const action = 'requestCopyWallet';

    this.registerConnectionEvent(action, (correlationId: number, chainType: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType': chainType });
      this.propagateEvent(correlationId, EventTypes.RequestCopyWallet, ResponseResult.Success, chainType, {'correlationId': correlationId, 'chainType': chainType});
    });
  }
  listenToRequestCopyWalletKeyFile() {
    const cnx = this.connection;
    const action = 'requestCopyWalletKeyFile';

    this.registerConnectionEvent(action, (correlationId: number, chainType: number, keyCorrelationCode: number, accountID:string, keyname:string, attempt:number) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'chainType': chainType, 'keyCorrelationCode' : keyCorrelationCode, 'accountID' : accountID, 'keyname' : keyname, 'attempt' : attempt });
      this.propagateEvent(correlationId, EventTypes.RequestCopyKeyFile, ResponseResult.Success, chainType, { 'correlationId':correlationId,'chainType': chainType, 'keyCorrelationCode' : keyCorrelationCode, 'accountID' : accountID, 'keyname' : keyname, 'attempt' : attempt });
    });
  }


  listenToMiningStatusChanged() {
    const cnx = this.connection;
    const action = 'miningStatusChanged';


    this.registerConnectionEvent(action, (chainType: number, isMining: boolean) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'isMining': isMining });
      this.propagateEvent(chainType, EventTypes.MiningStatusChanged, ResponseResult.Success, chainType, isMining);
    });
  }

  listenToReturnClientLongRunningEvent() {
    const cnx = this.connection;
    const action = 'returnClientLongRunningEvent';


    this.registerConnectionEvent('returnClientLongRunningEvent', (correlationId: number, result: number, blockchainType:number, message: string) => {
      this.logEvent('returnClientLongRunningEvent - event', { 'correlationId': correlationId, 'result': result, 'message': message });
      if (result === 0) {
        this.propagateEvent(correlationId, EventTypes.Message, ResponseResult.Success, blockchainType, message);
      }
      else {
        this.propagateEvent(correlationId, EventTypes.Error, ResponseResult.Error, blockchainType, message);
      }
    });
  }

  listenToLongRunningStatusUpdate() {
    const cnx = this.connection;
    const action = 'longRunningStatusUpdate';


    this.registerConnectionEvent('longRunningStatusUpdate', (correlationId: number, eventId: number, eventType: number, blockchainType: number, message: any) => {
      const eventName = EventTypes[eventId];
      this.logEvent('longRunningStatusUpdate - event', { 'correlationId': correlationId, 'eventId': eventId, 'eventName': eventName, 'eventType': eventType, 'blockchainType' : blockchainType, 'message': message });
      this.propagateEvent(correlationId, eventId, ResponseResult.Success, blockchainType, message);
    });
  }


  // ACCOUNT EVENTS

  listenToAccountTotalUpdated() {
    const cnx = this.connection;
    const action = 'accountTotalUpdated';


    this.registerConnectionEvent(action, (accountId: string, total: number) => {
      this.logEvent(action + ' - event', { 'accountId': accountId, 'total': total });
      this.propagateEvent(0, EventTypes.AccountTotalUpdated, ResponseResult.Success, NeuraliumBlockchainType, total.toString());
    });
  }

  listenToPeerTotalUpdated() {
    const cnx = this.connection;
    const action = 'peerTotalUpdated';


    this.registerConnectionEvent(action, (count: number) => {
      this.logEvent(action + ' - event', { 'count': count });
      this.propagateEvent(count, EventTypes.PeerTotalUpdated, ResponseResult.Success, NullBlockchainType, count.toString());
    });
  }

  listenToEnterWalletPassphrase() {
    const cnx = this.connection;
    const action = 'enterWalletPassphrase';


    this.registerConnectionEvent(action, (correlationId: number, chainType: number, keyCorrelationCode: number, attempt: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'attempt': attempt });
      const event = ServerConnectionEvent.createNew(correlationId, EventTypes.RequestWalletPassphrase, ResponseResult.Success, chainType, <PassphraseParameters>{ 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'attempt': attempt });
      this.eventNotifier.next(event);
    });
  }

  listenToEnterKeyPassphrase() {
    const cnx = this.connection;
    const action = 'enterKeysPassphrase';


    this.registerConnectionEvent(action, (correlationId: number, chainType: number, keyCorrelationCode: number, accountID: string, keyname: string, attempt: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'accountID': accountID, 'keyname': keyname, 'attempt': attempt });
      const event = ServerConnectionEvent.createNew(correlationId, EventTypes.RequestKeyPassphrase, ResponseResult.Success, chainType, <KeyPassphraseParameters>{ 'correlationId': correlationId, 'chainType': chainType, 'keyCorrelationCode': keyCorrelationCode, 'accountID': accountID, 'keyname': keyname, 'attempt': attempt });
      this.eventNotifier.next(event);
    });
  }




  // WALLET CREATION EVENTS

  listenToWalletCreationStarted() {

    const action = 'walletCreationStarted';

    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.WalletCreationStarted, blockchainType);
    });
  }

  listenToWalletCreationEnded() {
    const cnx = this.connection;
    const action = 'walletCreationEnded';


    this.registerConnectionEvent(action, (correlationId: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.WalletCreationEnded);
    });
  }

  // KEY CREATION EVENTS

  listenToKeyGenerationStarted() {
    const cnx = this.connection;
    const action = 'keyGenerationStarted';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, keyName: string, keyIndex : number, totalKeys: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'keyIndex' : keyIndex, 'totalKeys': totalKeys });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationStarted, ResponseResult.Success, blockchainType,{ 'keyName': keyName, 'keyIndex': keyIndex, 'totalKeys': totalKeys });
    });
  }

  listenToKeyGenerationEnded() {
    const cnx = this.connection;
    const action = 'keyGenerationEnded';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, keyName: string, keyIndex : number, totalKeys: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'keyIndex' : keyIndex, 'totalKeys': totalKeys });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationEnded, ResponseResult.Success, blockchainType, { 'keyName': keyName, 'keyIndex': keyIndex, 'totalKeys': totalKeys });
    });
  }

  listenToKeyGenerationPercentageUpdate() {
    const cnx = this.connection;
    const action = 'keyGenerationPercentageUpdate';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, keyName: string, percentage: number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'percentage': percentage });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationPercentageUpdate, ResponseResult.Success, blockchainType, { 'keyName': keyName, 'percentage': percentage });
    });
  }


  listenToKeyGenerationError() {
    const cnx = this.connection;
    const action = 'KeyGenerationError';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, keyName: string, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'keyName': keyName, 'error': error });
      this.propagateEvent(correlationId, EventTypes.KeyGenerationError, ResponseResult.Error, blockchainType, { 'keyName': keyName, 'error': error });
    });
  }

  // ACCOUNT PUBLICATION EVENTS

  listenToAccountPublicationStarted() {
    const cnx = this.connection;
    const action = 'accountPublicationStarted';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationStarted, ResponseResult.Success, blockchainType);
    });
  }

  listenToAccountPublicationEnded() {
    const cnx = this.connection;
    const action = 'accountPublicationEnded';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationEnded, ResponseResult.Success, blockchainType);
    });
  }

  listenToAccountPublicationError() {
    const cnx = this.connection;
    const action = 'accountPublicationError';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, error: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'error': error });
      this.propagateEvent(correlationId, EventTypes.AccountPublicationError, ResponseResult.Error, blockchainType, error);
    });
  }

  // WALLET SYNC EVENT

  listenToWalletSyncStarted() {
    const cnx = this.connection;
    const action = 'walletSyncStarted';


    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
      this.propagateEvent(chainType, EventTypes.WalletSyncStarted, ResponseResult.Success, chainType, { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
    });
  }

  listenToWalletSyncEnded() {
    const cnx = this.connection;
    const action = 'walletSyncEnded';


    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
      this.propagateEvent(chainType, EventTypes.WalletSyncEnded, ResponseResult.Success, chainType,{ 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage });
    });
  }

  listenToWalletSyncUpdate() {
    const cnx = this.connection;
    const action = 'WalletSyncUpdate';


    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, blockHeight: number, percentage: number, estimatedTimeRemaining: string) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
      this.propagateEvent(chainType, EventTypes.WalletSyncUpdate, ResponseResult.Success, chainType,{ 'chainType': chainType, 'currentBlockId': currentBlockId, 'blockHeight': blockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
    });
  }

  // BLOCKCHAIN SYNC EVENT

  listenToBlockchainSyncStarted() {
    const cnx = this.connection;
    const action = 'blockchainSyncStarted';


    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, publicBlockHeight: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncStarted, ResponseResult.Success, chainType,{ 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight});
    });
  }

  listenToBlockchainSyncEnded() {
    const cnx = this.connection;
    const action = 'blockchainSyncEnded';


    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, publicBlockHeight: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncEnded, ResponseResult.Success, chainType,{ 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight});
    });
  }

  listenToBlockchainSyncUpdate() {
    const cnx = this.connection;
    const action = 'blockchainSyncUpdate';


    this.registerConnectionEvent(action, (chainType: number, currentBlockId: number, publicBlockHeight: number, percentage: number, estimatedTimeRemaining: string) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
      this.propagateEvent(chainType, EventTypes.BlockchainSyncUpdate, ResponseResult.Success, chainType,{ 'chainType': chainType, 'currentBlockId': currentBlockId, 'publicBlockHeight': publicBlockHeight, 'percentage': percentage, 'estimatedTimeRemaining': estimatedTimeRemaining });
    });
  }

  // TRANSACTION EVENT


  listenToNeuraliumTimelineUpdated(){
    const cnx = this.connection;
    const action = 'neuraliumTimelineUpdated';

    this.registerConnectionEvent(action, () => {
      this.logEvent(action + ' - event', {  });
      this.propagateEvent(0, EventTypes.NeuraliumTimelineUpdated, ResponseResult.Success, NeuraliumBlockchainType, {});
    });
  }

  listenToTransactionHistoryUpdated(){
    const cnx = this.connection;
    const action = 'transactionHistoryUpdated';

    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType':chainType });
      this.propagateEvent(0, EventTypes.TransactionHistoryUpdated, ResponseResult.Success, chainType,{ 'chainType': chainType});
    });
  }

  listenToTransactionSent() {
    const cnx = this.connection;
    const action = 'transactionSent';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, transactionId: string, transaction: any) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(correlationId, EventTypes.TransactionSent, ResponseResult.Success, blockchainType, transaction);
    });
  }

  listenToTransactionConfirmed() {
    const cnx = this.connection;
    const action = 'transactionConfirmed';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, transactionId: string, transaction: any) => {
      this.logEvent(action + ' - event', {  'correlationId':correlationId,'transactionId': transactionId, 'transaction': transaction });
      this.propagateEvent(correlationId, EventTypes.TransactionConfirmed, ResponseResult.Success, blockchainType, transaction);
    });
  }

  listenToTransactionReceived() {
    const cnx = this.connection;
    const action = 'transactionReceived';

    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, transactionId: string) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId });
      this.propagateEvent(correlationId, EventTypes.TransactionReceived, ResponseResult.Success, blockchainType, transactionId);
    });
  }

  listenToTransactionMessage() {
    const cnx = this.connection;
    const action = 'transactionMessage';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, transactionId: string, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.TransactionMessage, ResponseResult.Success, blockchainType, message);
    });
  }

  listenToTransactionRefused() {
    const cnx = this.connection;
    const action = 'transactionRefused';


    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, transactionId: string, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'message': message });
      this.propagateEvent(correlationId, EventTypes.TransactionRefused, ResponseResult.Error, blockchainType, message);
    });
  }

  listenToTransactionError() {
    const cnx = this.connection;
    const action = 'transactionError';

    this.registerConnectionEvent(action, (correlationId: number, blockchainType:number, transactionId: string, errorCodes: Array<number>) => {
      this.logEvent(action + ' - event', { 'correlationId':correlationId, 'transactionId': transactionId, 'errorCodes': errorCodes });
      this.propagateEvent(correlationId, EventTypes.TransactionError, ResponseResult.Error, blockchainType, {'transactionId': transactionId, 'errorCodes': errorCodes });
    });
  }

  // MINING EVENTS

  listenToMiningStarted() {
    const cnx = this.connection;
    const action = 'miningStarted';

    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.MiningStarted, ResponseResult.Success, chainType);
    });
  }

  listenToMiningEnded() {
    const cnx = this.connection;
    const action = 'miningEnded';


    this.registerConnectionEvent(action, (chainType: number, status: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'status': status });
      this.propagateEvent(chainType, EventTypes.MiningEnded, ResponseResult.Success, chainType, {chainType, status});
    });
  }

  listenToElectionContextCached() {
    const cnx = this.connection;
    const action = 'electionContextCached';


    this.registerConnectionEvent(action, (chainType: number, blockId: number, maturityId: number, difficulty:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'blockId': blockId, 'maturityId': maturityId, 'difficulty': difficulty });
      this.propagateEvent(chainType, EventTypes.ElectionContextCached, ResponseResult.Success, chainType, {chainType, blockId, maturityId, difficulty});
    });
  }

  listenToElectionProcessingCompleted() {
    const cnx = this.connection;
    const action = 'electionProcessingCompleted';


    this.registerConnectionEvent(action, (chainType: number, blockId: number, electionResultCount:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'blockId': blockId, 'electionResultCount': electionResultCount });
      this.propagateEvent(chainType, EventTypes.ElectionProcessingCompleted, ResponseResult.Success, chainType, {chainType, blockId, electionResultCount});
    });
  }




  listenToMiningElected() {
    const cnx = this.connection;
    const action = 'miningElected';

    this.registerConnectionEvent(action, (chainType: number, electionBlockId:number, level:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'electionBlockId' : electionBlockId, 'level' : level });
      this.propagateEvent(chainType, EventTypes.MiningElected, ResponseResult.Success, chainType, {'chainType': chainType, 'electionBlockId' : electionBlockId, 'level' : level});
    });
  }

  listenToMiningPrimeElectedMissed() {
    const cnx = this.connection;
    const action = 'miningPrimeElectedMissed';

    this.registerConnectionEvent(action, (chainType: number, publicationBlockId:number, electionBlockId:number, level:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'publicationBlockId' : publicationBlockId, 'electionBlockId' : electionBlockId, 'level' : level });
      this.propagateEvent(chainType, EventTypes.MiningPrimeElectedMissed, ResponseResult.Success, chainType, {'chainType': chainType, 'publicationBlockId' : publicationBlockId, 'electionBlockId' : electionBlockId, 'level' : level});
    });
  }


  listenToNeuraliumMiningPrimeElected() {
    const cnx = this.connection;
    const action = 'neuraliumMiningPrimeElected';

    this.registerConnectionEvent(action, (chainType: number, blockId: number, bounty: number, transactionTip: number, delegateAccountId: string, level:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType , blockId, bounty, transactionTip, delegateAccountId, level});
      this.propagateEvent(chainType, EventTypes.NeuraliumMiningPrimeElected, ResponseResult.Success, chainType, {chainType, blockId, bounty, transactionTip, delegateAccountId, level});
    });
  }

  listenToNeuraliumMiningBountyAllocated() {
    const cnx = this.connection;
    const action = 'neuraliumMiningBountyAllocated';


    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.NeuraliumMiningBountyAllocated, ResponseResult.Success, NeuraliumBlockchainType);
    });
  }

  listenToMiningConnectableStatusChanged(){
    const cnx = this.connection;
    const action = 'connectableStatusChanged';


    this.registerConnectionEvent(action, (connectable: boolean) => {
      this.logEvent(action + ' - event', { 'connectable': connectable });
      this.propagateEvent(0, EventTypes.ConnectableStatusChanged, ResponseResult.Success, NeuraliumBlockchainType, { connectable });
    });
  }

  // BLOCKS AND DIGESTS

  listenToBlockInserted() {
    const cnx = this.connection;
    const action = 'blockInserted';


    this.registerConnectionEvent(action, (chainType: number, blockId: number, timestamp:  DateTime, hash: string, publicBlockId: number, lifespan: number) => {
      this.logEvent(action + ' - event', { chainType, blockId, publicBlockId, timestamp, hash, lifespan });
      this.propagateEvent(blockId, EventTypes.BlockInserted, ResponseResult.Success, chainType, { chainType, blockId, publicBlockId, timestamp, hash, lifespan });
    });
  }

  listenToRequireNodeUpdate(){
    const cnx = this.connection;
    const action = 'requireNodeUpdate';


    this.registerConnectionEvent(action, (chainType: number, chainName:string) => {
      this.logEvent(action + ' - event', { chainType, chainName  });
      this.propagateEvent(chainType, EventTypes.RequireNodeUpdate, ResponseResult.Success, chainType, { chainType,  chainName });
    });
  }

  // MESSAGE AND ERROR

  listenToConsoleMessage() {
    const cnx = this.connection;
    const action = 'ConsoleMessage';


    this.registerConnectionEvent(action, (message: string, timestamp:  DateTime, level:string, properties:Array<Object>) => {

      if(this.messages.length > MESSAGE_BUFFER_SIZE){
        this.messages.shift();
      }
      this.messages.push(new ServerMessage(message, timestamp, level, properties));

      this.logEvent(action + ' - event', { 'message': message });
      this.propagateEvent(1, EventTypes.ConsoleMessage, ResponseResult.Success, NullBlockchainType, message);
    });
  }

  listenToError() {
    const cnx = this.connection;
    const action = 'error';


    this.registerConnectionEvent(action, (correlationId: number, chainType: number, message: string) => {
      this.logEvent(action + ' - event', { 'correlationId': correlationId, 'chainType' : chainType, 'message': message });
      this.propagateEvent(correlationId, EventTypes.Error, ResponseResult.Error, chainType, {chainType, message});
    });
  }

  listenToMessage() {
    const cnx = this.connection;
    const action = 'message';


    this.registerConnectionEvent(action, (chainType: number, messageCode:number, defaultMessage: string, parameters:Array<string>|null) => {
      this.logEvent(action + ' - event', { 'chainType' : chainType, 'messageCode': messageCode, 'defaultMessage': defaultMessage, 'parameters': parameters });
      this.propagateEvent(1, EventTypes.Message, ResponseResult.Error, chainType, {chainType, messageCode, defaultMessage, parameters});
    });
  }

  listenToAlert() {
    const cnx = this.connection;
    const action = 'alert';


    this.registerConnectionEvent(action, (chainType: number, messageCode:number, defaultMessage: string, priorityLevel:number, reportLevel:number, parameters:Array<string>|null) => {
      this.logEvent(action + ' - event', { 'chainType' : chainType, 'messageCode': messageCode, 'defaultMessage': defaultMessage, 'priorityLevel': priorityLevel, 'reportLevel': reportLevel, 'parameters': parameters });
      this.propagateEvent(1, EventTypes.Alert, ResponseResult.Error, chainType, {chainType, messageCode, defaultMessage, priorityLevel, reportLevel, parameters});
    });
  }

  listenToImportantWalletUpdate() {
    const cnx = this.connection;
    const action = 'ImportantWalletUpdate';


    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType' : chainType});
      this.propagateEvent(1, EventTypes.ImportantWalletUpdate, ResponseResult.Error, chainType, {chainType});
    });
  }
  
  // appointments

  listenToAppointmentPuzzleBegin() {
    const cnx = this.connection;
    const action = 'AppointmentPuzzleBegin';

    this.registerConnectionEvent(action, (chainType: number, secretCode:number, puzzles:Array<string>, instructions:Array<string>) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'secretCode' : secretCode, 'puzzles' : puzzles, 'instructions' : instructions });
      this.propagateEvent(chainType, EventTypes.AppointmentPuzzleBegin, ResponseResult.Success, chainType,{'chainType': chainType, 'secretCode' : secretCode, 'puzzles' : puzzles, 'instructions' : instructions});
    });
  }


  listenToAppointmentVerificationCompleted() {
    const cnx = this.connection;
    const action = 'AppointmentVerificationCompleted';

    this.registerConnectionEvent(action, (chainType: number, verified:boolean, appointmentConfirmationId:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'verified' : verified, 'appointmentConfirmationId' : appointmentConfirmationId });
      this.propagateEvent(chainType, EventTypes.AppointmentVerificationCompleted, ResponseResult.Success, chainType,{'chainType': chainType, 'verified' : verified, 'appointmentConfirmationId' : appointmentConfirmationId});
    });
  }

  listenToInvalidPuzzleEngineVersion() {
    const cnx = this.connection;
    const action = 'InvalidPuzzleEngineVersion';

    this.registerConnectionEvent(action, (chainType: number, requiredVersion:number, minimumSupportedVersion:number, maximumSupportedVersion:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'requiredVersion' : requiredVersion, 'minimumSupportedVersion' : minimumSupportedVersion, 'maximumSupportedVersion': maximumSupportedVersion });
      this.propagateEvent(chainType, EventTypes.InvalidPuzzleEngineVersion, ResponseResult.Success, chainType,{'chainType': chainType, 'requiredVersion' : requiredVersion, 'minimumSupportedVersion' : minimumSupportedVersion, 'maximumSupportedVersion' : maximumSupportedVersion});
    });
  }



  listenToTHSTrigger(){
    const cnx = this.connection;
    const action = 'THSTrigger';

    this.registerConnectionEvent(action, (chainType: number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType });
      this.propagateEvent(chainType, EventTypes.THSTrigger, ResponseResult.Success, chainType,{'chainType': chainType});
    });
  }

  listenToTHSBegin(){
    const cnx = this.connection;
    const action = 'THSBegin';

    this.registerConnectionEvent(action, (chainType: number, difficulty:number, targetNonce:number, targetTotalDuration:number, estimatedIterationTime:number, estimatedRemainingTime:number, startingNonce:number, startingTotalNonce:number, startingRound:number, nonces:Array<number>, solutions:Array<number>) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'difficulty' : difficulty, 'targetNonce' : targetNonce, 'targetTotalDuration' : targetTotalDuration, 'estimatedIterationTime' : estimatedIterationTime, 'estimatedRemainingTime' : estimatedRemainingTime, 'startingNonce' : startingNonce, 'startingTotalNonce' : startingTotalNonce, 'startingRound' : startingRound,  'nonces' : nonces, 'solutions' : solutions });
      this.propagateEvent(chainType, EventTypes.THSBegin, ResponseResult.Success, chainType,{'chainType': chainType, 'difficulty' : difficulty, 'targetNonce' : targetNonce, 'targetTotalDuration' : targetTotalDuration, 'estimatedIterationTime' : estimatedIterationTime, 'estimatedRemainingTime' : estimatedRemainingTime,'startingNonce' : startingNonce, 'startingTotalNonce' : startingTotalNonce, 'startingRound' : startingRound,  'nonces' : nonces, 'solutions' : solutions});
    });
  }

  listenToTHSRound(){
    const cnx = this.connection;
    const action = 'THSRound';

    this.registerConnectionEvent(action, (chainType: number, round:number, totalNonce:number, lastNonce:number, lastSolution:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'round' : round, 'totalNonce' : totalNonce, 'lastNonce' : lastNonce, 'lastSolution' : lastSolution });
      this.propagateEvent(chainType, EventTypes.THSRound, ResponseResult.Success, chainType,{'chainType': chainType, 'round' : round, 'totalNonce' : totalNonce, 'lastNonce' : lastNonce, 'lastSolution' : lastSolution});
    });
  }
  
  listenToTHSIteration(){
    const cnx = this.connection;
    const action = 'THSIteration';

    this.registerConnectionEvent(action, (chainType: number, nonces:number, elapsed:number, estimatedIterationTime:number, estimatedRemainingTime:number, benchmarkSpeedRatio:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'nonces' : nonces, 'elapsed' : elapsed , 'estimatedIterationTime' : estimatedIterationTime, 'estimatedRemainingTime' : estimatedRemainingTime, 'benchmarkSpeedRatio' : benchmarkSpeedRatio});
      this.propagateEvent(chainType, EventTypes.THSIteration, ResponseResult.Success, chainType,{'chainType': chainType, 'nonces' : nonces, 'elapsed' : elapsed, 'estimatedIterationTime' : estimatedIterationTime, 'estimatedRemainingTime' : estimatedRemainingTime, 'benchmarkSpeedRatio' : benchmarkSpeedRatio});
    });
  }

  listenToTHSSolution(){
    const cnx = this.connection;
    const action = 'THSSolution';

    this.registerConnectionEvent(action, (chainType: number, nonces:Array<number>, solutions:Array<number>, difficulty:number) => {
      this.logEvent(action + ' - event', { 'chainType': chainType, 'nonces' : nonces, 'solutions' : solutions, 'difficulty': difficulty });
      this.propagateEvent(chainType, EventTypes.THSSolution, ResponseResult.Success, chainType,{'chainType': chainType, 'nonces' : nonces, 'solutions' : solutions, 'difficulty' : difficulty});
    });
  }

  // UTILS

  isConnectedToServer(): Observable<boolean> {
    return this.serverConnection;
  }

  isConsoleMessagesEnabled(): Observable<boolean> {
    return this.consoleMessagesEnabled;
  }


  logEvent(message: string, data: any) {
    this.logService.logDebug(message, data);
  }

  propagateEvent(correlationId: number,
    eventType: EventTypes = EventTypes.DefaultEvent,
    eventResponse: ResponseResult = ResponseResult.Success,
    blockchainType: number = NullBlockchainType,
    message: any = '') {
    const event = ServerConnectionEvent.createNew(correlationId, eventType, eventResponse, blockchainType, message);
    this.eventNotifier.next(event);
  }

  public tryConnectToServer(): Promise<void> {
    return this.tryConnectToServerTyped<void>();
  }

  public tryConnectToServerTyped<T = any>(): Promise<T> {
    return new Promise<T>((resolve, reject) => {

      if(this.IsConnected){
        this.isCurrentlyConnected = true;
        this.isConnecting = false;
        resolve();
        return;
      }
      this.isCurrentlyConnected = false;
      this.notifyServerConnectionStatusIfNeeded(false);
      setTimeout(() => {
          if(!this.isCurrentlyConnected && !this.isConnecting){
            this.isConnecting = true;
            this.ping()
              .then(() => {
                this.notifyServerConnectionStatusIfNeeded(true);
                resolve();
                this.isConnecting = false;
              })
              .catch(reason => {
                this.notifyServerConnectionStatusIfNeeded(false);
                this.isConnecting = false;
                this.logService.logDebug(reason, null);
                this.tryConnectToServer().then(() => resolve());
              });
          }
          else{
            if(!this.isConnecting){
              this.tryConnectToServer().then(() => resolve());
            }
          }
      }, RETRY_DURATION);
    });
  }


  public invoke<T = any>(methodName: string, ...args: any[]): Promise<T>{

    // if we are connected, then go right to the request.
    if(this.IsConnected){
      return this.connection.invoke<T>(methodName, ...args);
    }
    else{

      // now we need to conenct before we fulfill the request.
      return new Promise<T>((resolve, reject) => {
        this.tryConnectToServerTyped<T>().then(() => {
          this.connection.invoke<T>(methodName, ...args).then(() => resolve()).catch(() => reject());
        })
        .catch(reason => {
          console.log('Connection not connected, failed to reconnect.');
          reject();
        });
      });
    }
  }


  notifyServerConnectionStatusIfNeeded(connected: boolean) {
    if (connected !== this.isCurrentlyConnected) {
      this.isCurrentlyConnected = connected;
      this.serverConnection.next(connected);
    }
  }

  // utility method

  ping(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const cnx = this.connection;

      cnx.start()
        .then(() => {
          cnx.invoke<string>('ping')
            .then(
              response => {
                if (response === 'pong') {
                  resolve();
                }
                else {
                  reject('Ping error : \'pong\' not received => ' + response)
                }
              })
            .catch(reason => {
              cnx.stop();
              reject('Ping error : ' + reason);

            });
        })
        .catch(reason => {
          reject('Connection error : ' + reason);
        });
    });
  }

  setLocale(locale:string): Promise<void> {
    return new Promise<void>((resolve, reject) => {

      if(!this.IsConnected){
        reject('Not connected');
        return;
      }
      console.log('setting locale to: ' + locale);
      this.connection.invoke('SetUILocale', locale).then(() => {
        resolve();
      })
      .catch(reason => {
              reject('Set locale error : ' + reason);
            });
        });

  }

  // test method

  testMiningEvent() {
    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningStarted, NeuraliumBlockchainType, ResponseResult.Success);
    }, 20);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningStatusChanged, NeuraliumBlockchainType, ResponseResult.Success);
    }, 40);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningPrimeElected, NeuraliumBlockchainType, ResponseResult.Success);
    }, 50);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningElected, NeuraliumBlockchainType, ResponseResult.Success);
    }, 60);

    setTimeout(() => {
      this.propagateEvent(1000, EventTypes.MiningEnded, NeuraliumBlockchainType, ResponseResult.Success);
    }, 80);
  }
}
