import { resolve } from 'path';
import { cwd } from 'process';

export const ethChainConfig = {
  rpcUrl: process.env.ETH_CHAIN_RPC_URL || '',
  wsUrl: process.env.ETH_CHAIN_WS_URL || '',
  privateKey: process.env.ETH_CHAIN_PRIVATE_KEY || '',
  contractAddress: process.env.ETH_CHAIN_CONTRACT_ADDRESS || '',
  contractABIPath:
    process.env.ETH_CHAIN_CONTRACT_ABI_PATH ||
    resolve(cwd(), 'data/json/ethChainContractABI.json'),
};

export const seiChainConfig = {
  rpcUrl: process.env.SEI_CHAIN_RPC_URL || '',
  wsUrl: process.env.SEI_CHAIN_WS_URL || '',
  privateKey: process.env.SEI_CHAIN_PRIVATE_KEY || '',
  contractAddress: process.env.SEI_CHAIN_CONTRACT_ADDRESS || '',
  contractABIPath:
    process.env.SEI_CHAIN_CONTRACT_ABI_PATH ||
    resolve(cwd(), 'data/json/seiChainContractABI.json'),
  wEthAddress: '',
};

interface ITokenMap {
  type: 0 | 1; // 0: native, 1: custom
  address: string;
}

export const seiTokenMapperConfig: Record<string, ITokenMap> = {
  ETH: {
    address: '0x0000000000000000000000000000000000000000',
    type: 0,
  },
  USDC: {
    address: '0x42B4fdB1888001BB4C06f8BaFfB8a96B56693614',
    type: 1,
  },
};
