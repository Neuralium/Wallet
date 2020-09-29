import { MenuConfig } from "./ui-config";

export const NullBlockchainType:number = 0;
export const NeuraliumBlockchainType:number = 1001;

export class ChainStatus {
 
  walletInfo : WalletInfo;
  minRequiredPeerCount: number;
  miningTier: number;
}

export class WalletInfo {
  walletExists: boolean;
  walletFullyCreated : boolean;
  isWalletLoaded: boolean;
  walletEncrypted: boolean;
  walletPath: string;
}

export class BlockChain {
  id: number;
  label: string;
  enabled: boolean;
  menuConfig: MenuConfig;
  icon: string = "fas fa-lock";
}

export const NO_BLOCKCHAIN = <BlockChain>{
  id: 0,
  label: "No Blockchain",
  enabled: true,
  menuConfig: {
    showDashboard: false,
    showSend: false,
    showReceive: false,
    showHistory: false,
    showTools: false,
    showContacts: false,
    showSettings: false
  }
}

export const NEURALIUM_BLOCKCHAIN = <BlockChain>{
  id: NeuraliumBlockchainType, label: "Neuralium",
  enabled: true,
  icon: "fas fa-bezier-curve",
  menuConfig: {
    showDashboard: true,
    showSend: true,
    showReceive: true,
    showHistory: true,
    showTools : true,
    showContacts: true,
    showSettings: true
  }
}
