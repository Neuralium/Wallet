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
    showDashboard: true,
    showNeuralium: false,
    showReceive: false,
    showHistory: false,
    showContacts: false,
    showTools: true,
    showSettings: true,
    showServer: true
  }
}

export const NEURALIUM_BLOCKCHAIN = <BlockChain>{
  id: NeuraliumBlockchainType, label: "Neuralium",
  enabled: true,
  icon: "fas fa-bezier-curve",
  menuConfig: {
    showDashboard: true,
    showNeuralium: true,
    showReceive: true,
    showHistory: true,
    showContacts: true,
    showTools : true,
    showSettings: true,
    showServer: true
  }
}
