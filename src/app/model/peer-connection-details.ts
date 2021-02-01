
export interface PeerStatistics
{
    metric: number;
    inputKBps: number;
    inputMB: number;
    outputMB: number;
    outputKBps: number;
    latency: number;
    logins: number;
    logouts: number;
}
export interface PeerConnectionDetails {
    id:number;                                           
    ip: string;
    port: number;
    iPMode : number;
    isConnectable: boolean;   
    isConnected: boolean;
    type: string;                                          
    state: string;
    stats: PeerStatistics;      
}