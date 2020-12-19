import { Injectable, OnInit, OnDestroy, NgZone } from '@angular/core';
import { BlockChain, NO_BLOCKCHAIN, NEURALIUM_BLOCKCHAIN, ChainStatus } from '../model/blockchain';
import { Observable, BehaviorSubject } from 'rxjs';
import { WalletService } from './wallet.service';
import { ServerConnectionService } from './server-connection.service';
import { BlockchainInfo, NO_BLOCKCHAIN_INFO, BlockInfo, DigestInfo } from '../model/blockchain-info';
import { OperatingModes } from '../model/enums';


import { EventTypes } from '../model/serverConnectionEvent';
import { DateTime, Duration } from 'luxon';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BlockchainService implements OnInit, OnDestroy {

  
  constructor(private walletService: WalletService, private serverConnectionService: ServerConnectionService,  private _ngZone: NgZone) {
    this.subscribeToBlockchainEvents();

    this.remainingTimeForNextBlock.pipe(takeUntil(this.unsubscribe$)).subscribe(seconds => {
      this._ngZone.run(() => {
        this.totalRemainingTime = seconds;
      this.tempTime = seconds;
      
      this.currentRemainingTimeVal = Duration.fromObject({seconds : this.tempTime});
      this.remainingTimePercent = (this.totalRemainingTime - this.tempTime) / this.totalRemainingTime * 100;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.updateRemainingTime();
      });

      
    });
  }

  get currentRemainingTime(): Duration {
    return this.currentRemainingTimeVal;
  }
  
  get remainingTimePercentVal(): Number {
    return this.remainingTimePercent;
  }

  get showRemainingTime(): boolean {
    return this.tempTime > 0;
  }

  get CurrentBlockchainInfo(): BlockchainInfo {
    return this.currentBlockchainInfo;
  }

  set CurrentBlockchainInfo(blockchainInfo: BlockchainInfo) {
    this.currentBlockchainInfo = blockchainInfo;
    this.blockchainInfo.next(this.currentBlockchainInfo);
  }
  blockchains: Array<BlockChain>;
  selectedBlockchain: BehaviorSubject<BlockChain> = new BehaviorSubject<BlockChain>(NO_BLOCKCHAIN);
  currentBlockchain: BlockChain = NO_BLOCKCHAIN;

  remainingTimeForNextBlock : BehaviorSubject<number> = new BehaviorSubject<number>(0);


  blockchainInfo: BehaviorSubject<BlockchainInfo> = new BehaviorSubject<BlockchainInfo>(NO_BLOCKCHAIN_INFO);
  currentBlockchainInfo: BlockchainInfo = NO_BLOCKCHAIN_INFO;

  private currentRemainingTimeVal: Duration = Duration.fromObject({});
  private totalRemainingTime: number = 0;
  private remainingTimePercent: number;
  private tempTime: number = 0;
  private timer: NodeJS.Timeout;

  private unsubscribe$ = new Subject<void>();

  updateRemainingTime() {
    this.timer = setTimeout(() => {
      this._ngZone.run(() => {
        this.tempTime--;

        this.currentRemainingTimeVal = Duration.fromObject({seconds : this.tempTime});
        this.remainingTimePercent = (this.totalRemainingTime - this.tempTime) / this.totalRemainingTime * 100;

        if (this.tempTime === 0) {
          clearTimeout(this.timer);
        }
        else {
          this.updateRemainingTime();
        }
      });
    }, 1000);
  }


  ngOnInit() {
    
  }


  ngOnDestroy(): void {
       this.unsubscribe$.next();
       this.unsubscribe$.complete();
     }

  runApiQuery(method:string, parameters:string): Promise<string>{

    return new Promise<string>((resolve, reject) => {
      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callQueryApi(this.currentBlockchain.id, method, parameters).then(json => {
          resolve(json);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(null);
      }
    });


  }

  getCurrentOperatingMode(): Promise<OperatingModes> {
    return new Promise<OperatingModes>((resolve, reject) => {
      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callGetCurrentOperatingMode(this.currentBlockchain.id).then(mode => {
          resolve(mode);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(OperatingModes.Unknown);
      }
    });
  }

  queryBlockJson(blockId:number): Promise<string>{

    return new Promise<string>((resolve, reject) => {

      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callQueryBlock(this.currentBlockchain.id, blockId).then(json => {
          resolve(json);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(null);
      }
    });
  }

  subscribeToBlockchainEvents() {
    this.serverConnectionService.eventNotifier.pipe(takeUntil(this.unsubscribe$)).subscribe(event => {
      switch (event.eventType) {
        case EventTypes.BlockInserted:
          this._ngZone.run(() => {
            this.updateBlockInfos(event.message);

          });
          break;
        case EventTypes.DigestInserted:
          this._ngZone.run(() => {
            this.updateDigestInfos(event.message);

          });
          break;
        case EventTypes.BlockchainSyncEnded:
          this._ngZone.run(() => {
            this.updateCurrentBlockchainInfo(this.currentBlockchain.id);

          });
          break;
        default:
          break;
      }
    })
  }

  updateBlockInfos(infos: any) {
    const blockId: number = infos['blockId'];
    const blockHash: string = infos['hash'];
    const publicBlockId: number = infos['publicBlockId'];

    const blockTimestamp:  DateTime =  DateTime.fromISO(infos['timestamp']).toUTC();
    const lifespan: number = infos['lifespan'];
    const blockInfo = BlockInfo.create(blockId, blockTimestamp, blockHash, publicBlockId, lifespan);
    this.currentBlockchainInfo.blockInfo = blockInfo;
    this.blockchainInfo.next(this.currentBlockchainInfo);
    this.remainingTimeForNextBlock.next(lifespan);
  }

  updateDigestInfos(infos: any) {
    const digestId: number = infos['digestId'];
    const digestHash: string = infos['digestHash'];
    const digestBlockId: number = infos['digestBlockId'];
    const digestTimestamp:  DateTime =  DateTime.fromISO(infos['digestTimestamp']).toUTC();
    const publicDigestId: number = infos['publicDigestId'];
    const digestInfo = DigestInfo.create(digestId, digestBlockId, digestTimestamp, digestHash, publicDigestId);
    this.currentBlockchainInfo.digestInfo = digestInfo;
    this.blockchainInfo.next(this.currentBlockchainInfo);
  }

  updateCurrentBlockchainInfo(blockchainId: number) {
    this.serverConnectionService.callQueryBlockChainInfo(blockchainId).then(blockchainInfo => {
      this.currentBlockchainInfo = blockchainInfo;
      this.blockchainInfo.next(this.currentBlockchainInfo);
    })
  }

  getBlockchainInfo(): Observable<BlockchainInfo> {
    return this.blockchainInfo;
  }

  getAvailableBlockchains(): Promise<BlockChain[]> {
    return new Promise<BlockChain[]>((resolve, reject) => {
      this.blockchains = new Array<BlockChain>();
      this.serverConnectionService.callQuerySupportedChains()
        .then(blockchains => {
          blockchains.forEach(blockchain => {
            if (blockchain['enabled']) {
              if (blockchain['id'] === NEURALIUM_BLOCKCHAIN.id) {
                this.blockchains.push(NEURALIUM_BLOCKCHAIN);
              }
            }
          });
        }).finally(() => {
          resolve(this.blockchains);
        })
    })
  }

  getSelectedBlockchain(): Observable<BlockChain> {
    return this.selectedBlockchain;
  }

  getCurrentBlockchain() {
    return this.currentBlockchain;
  }

  setSelectedBlockchain(blockchain: BlockChain): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.walletService.changeWallet(blockchain.id);
      this.currentBlockchain = blockchain;
      this.selectedBlockchain.next(this.currentBlockchain);
      this.updateCurrentBlockchainInfo(blockchain.id);
      resolve(true);
    })
  }

  updateChainStatus(): Promise<ChainStatus>{

    return new Promise<ChainStatus>((resolve, reject) => {

      if(this.currentBlockchain && this.currentBlockchain.id && this.currentBlockchain.id !== 0){
        this.serverConnectionService.callQueryChainStatus(this.currentBlockchain.id).then(chainStatus => {
          resolve(chainStatus);
        }).catch(error => {
          reject(error);
        });
      }
      else{
        resolve(null);
      }
    });


  }
}
