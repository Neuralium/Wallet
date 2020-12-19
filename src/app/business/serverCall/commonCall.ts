import { LogService } from "../..//service/log.service";
import { ServerConnectionService } from '../..//service/server-connection.service';

export abstract class CommonCall {

    constructor(
        protected serviceConnectionService : ServerConnectionService,
        private logService: LogService) {
    }

    logEvent(message: string, data: any) {
        this.logService.logDebug(message, data);
    }
}