import { EventTypes } from './serverConnectionEvent';

export class MiningHistory {
    blockId: number;
    transactionIds: Array<string>;
    bountyShare: number;
    transactionTips: number;
    timestamp: Date;
    level: number;
    message: EventTypes;
    parameters: Array<Object>;

    static create(blockId: number, message: EventTypes, timestamp: Date, level: number, parameters: Array<Object>, transactionIds: Array<string> = [], bountyShare: number = 0, transactionTips: number = 0): MiningHistory {
        const miningHistory = new MiningHistory();
        miningHistory.blockId = blockId;
        miningHistory.transactionIds = transactionIds;
        miningHistory.bountyShare = bountyShare;
        miningHistory.transactionTips = transactionTips;

        miningHistory.message = message;
        miningHistory.timestamp = timestamp;
        miningHistory.level = level;
        miningHistory.parameters = parameters;

        return miningHistory;
    }
}
