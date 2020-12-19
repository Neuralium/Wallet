
import { DateTime } from 'luxon';

export class MiningStatistics {
    
    startedSession:  DateTime | null = null;
    blockStartedSession: number = 0;
    blocksProcessedSession: number = 0;
    blocksElectedSession: number = 0;
    lastBlockElectedSession: number = 0;
    percentElectedSession: number = 0;
    averageBountyPerBlockSession: number = 0;

    totalBountiesSession: number = 0;
    totalTipsSession: number = 0;
    
    blocksProcessedAggregate: number = 0;
    blocksElectedAggregate: number = 0;
    lastBlockElectedAggregate: number = 0;
    percentElectedAggregate: number = 0;
    averageBountyPerBlockAggregate: number = 0;
    miningSessionsAggregate: number = 0;

    totalBountiesAggregate: number = 0;
    totalTipsAggregate: number = 0;
}
