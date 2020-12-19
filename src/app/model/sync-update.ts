import { EventTypes } from '../model/serverConnectionEvent';

export class SyncUpdate{
    chainType: number; 
    currentBlockId: number;
    blockHeight: number; 
    percentage: number;
    estimatedTimeRemaining: string;
    eventType: EventTypes;
    private constructor(){}

    static create(eventType: EventTypes, chainType: number, currentBlockId: number, blockHeight: number, percentage: number, estimatedTimeRemaining: string){
        let update = new SyncUpdate();

        update.eventType = eventType;
        update.chainType = chainType;
        update.currentBlockId = currentBlockId;
        update.blockHeight = blockHeight;

        if(isNaN(percentage)){
            percentage = 0;
          }
        update.percentage = percentage;
        update.estimatedTimeRemaining = estimatedTimeRemaining;
        return update;
    }
  }
  
  export const NO_SYNC_UPDATE = <SyncUpdate>{
     chainType:0,
     currentBlockId:0,
     blockHeight:0,
     percentage:0,
     eventType: 0,
     estimatedTimeRemaining: ''
    };