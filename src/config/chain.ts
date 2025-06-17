import { resolve } from 'path';
import { cwd } from 'process';

export const ethChainConfig = {
  chainId: process.env.ETH_CHAIN_ID || '',
  rpcUrl: process.env.ETH_CHAIN_RPC_URL || '',
  wsUrl: process.env.ETH_CHAIN_WS_URL || '',
  privateKey: process.env.ETH_CHAIN_PRIVATE_KEY || '',
  contractAddress: process.env.ETH_CHAIN_CONTRACT_ADDRESS || '',
  contractABIPath:
    process.env.ETH_CHAIN_CONTRACT_ABI_PATH ||
    resolve(cwd(), 'data/json/ethChainContractABI.json'),
};

export const seiChainConfig = {
  chainId: process.env.SEI_CHAIN_ID || '',
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
  '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238': {
    address: '0x12CD8503ECBd48B4c3F920c48565a56c328207E4',
    type: 1,
  },
  '0x0000000000000000000000000000000000000000': {
    address: '0xe7Fd15568E498c7e62E8397597c23fA6e008189C',
    type: 0,
  },
};

export const ethTokenMapperConfig: Record<string, ITokenMap> = {
  '0x12CD8503ECBd48B4c3F920c48565a56c328207E4': {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    type: 1,
  },
  '0xe7Fd15568E498c7e62E8397597c23fA6e008189C': {
    address: '0x0000000000000000000000000000000000000000',
    type: 0,
  },
};
