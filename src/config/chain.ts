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

export const ethTokenAddressConfig = {
  ETH:
    process.env.ETH_TOKEN_ADDRESS_ETH ||
    '0x0000000000000000000000000000000000000000',
  USDC:
    process.env.ETH_TOKEN_ADDRESS_USDC ||
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
};

export const seiTokenAddressConfig = {
  wETH:
    process.env.SEI_TOKEN_ADDRESS_W_ETH ||
    '0xe7Fd15568E498c7e62E8397597c23fA6e008189C',
  wUSDC:
    process.env.SEI_TOKEN_ADDRESS_W_USDC ||
    '0x12CD8503ECBd48B4c3F920c48565a56c328207E4',
};

export const seiTokenMapperConfig: Record<string, ITokenMap> = {
  [seiTokenAddressConfig.wUSDC]: {
    address: ethTokenAddressConfig.USDC,
    type: 1,
  },
  [seiTokenAddressConfig.wETH]: {
    address: ethTokenAddressConfig.ETH,
    type: 0,
  },
};

export const ethTokenMapperConfig: Record<string, ITokenMap> = {
  [ethTokenAddressConfig.USDC]: {
    address: seiTokenAddressConfig.wUSDC,
    type: 1,
  },
  [ethTokenAddressConfig.ETH]: {
    address: seiTokenAddressConfig.wETH,
    type: 0,
  },
};
