export interface PeerConnectionDetails {
    id:number;                                           
    ip: string;
    port: number;
    isConnectable: boolean;   
    isConnected: boolean;
    type: string;                                          
    state: string;       
}