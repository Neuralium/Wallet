import { DateTime } from 'luxon';

export class BlockchainInfo{
    blockInfo:BlockInfo;
    digestInfo:DigestInfo;

    static create(blockInfo:BlockInfo, digestInfo:DigestInfo):BlockchainInfo{
      const blockchainInfo = new BlockchainInfo();
      blockchainInfo.blockInfo = blockInfo;
      blockchainInfo.digestInfo = digestInfo;
      return blockchainInfo;
    }
}

export class BlockInfo{
    id:number;
    timestamp:DateTime;
    hash:string;
    publicId:number;
    lifespan:number;

    static create(id:number, timestamp:DateTime, hash:string, publicId:number, lifespan:number = 0):BlockInfo{
      const block = new BlockInfo();
      block.id = id;
      block.timestamp = timestamp;
      block.hash = hash;
      block.publicId = publicId;
      block.lifespan = lifespan;
      return block;
    }
}

export class DigestInfo{
  id:number;
  blockId:number;
  timestamp:DateTime;
  hash:string;
  publicId:number;

  static create(id:number, blockId:number, timestamp:DateTime, hash:string, publicId:number):DigestInfo{
    const digest = new DigestInfo();
    digest.id = id;
    digest.timestamp = timestamp;
    digest.hash = hash;
    digest.publicId = publicId;
    return digest;
  }
}

export class ElectionInfo{
    type:string;
    maturity:string;
    publicationTimes:number;
}

export const NO_ELECTION_INFO = <ElectionInfo>{
    type:"",
    maturity:"",
    publicationTimes:0
  }

export const NO_BLOCK_INFO = <BlockInfo>{
    id:0,
    timestamp:null,
    hash:"",
    publicId:0
  }

  export const NO_DIGEST_INFO = <DigestInfo>{
    id:0,
    blockId:0,
    timestamp:null,
    hash:"",
    publicId:0
  }

export const NO_BLOCKCHAIN_INFO = <BlockchainInfo>{
    blockInfo:NO_BLOCK_INFO,
    digestInfo:NO_DIGEST_INFO
  }

  