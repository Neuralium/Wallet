import { Wallet } from "./wallet";

export enum PassphraseRequestType {
  Wallet, Key
}

export class PassphraseParameters{

    correlationId: number;
    chainType: number;
    keyCorrelationCode: number;
    attempt: number;
  }

  export class KeyPassphraseParameters extends PassphraseParameters{

    accountID: string;
    keyname: string;
  }

  export class RequestCopyWalletParameters {
    correlationId: number;
    chainType: number;

  }

  export class RequestCopyKeyFileParameters extends RequestCopyWalletParameters{

    keyCorrelationCode: number;
    attempt: number;
    accountID: string;
    keyname: string;
  }