
export enum ReportLevels {
    Default = 1,
	Modal = 2
}

export enum PriorityLevels {
    Verbose = 1,
    Information = 2,
    Warning = 3,
    Fatal = 4
}

export interface AlertMessage {
    chainType: number;
    messageCode:  number;
    defaultMessage:string;
    priorityLevel : PriorityLevels;
    reportLevel:ReportLevels;
    parameters:Array<string>|null;
}

export interface MessageMessage {
    chainType: number;
    messageCode:  number;
    defaultMessage:string;
    parameters:Array<string>|null;
}
