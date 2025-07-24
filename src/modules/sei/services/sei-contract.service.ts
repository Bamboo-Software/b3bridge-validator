/*
https://docs.nestjs.com/providers#services
*/

import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { EthSmartcontractService } from '../../eth/services/eth-smartcontract.service';
import { readFileSync } from 'fs';
import {
  seiChainConfig,
  seiTokenMapperConfig,
  seiValidatorConfig,
} from '@/config/';
import { ethers, getBytes } from 'ethers';
import { EthContractService } from '../../eth/services/eth-contract.service';

@Injectable()
export class SeiContractService {
  private readonly logger = new Logger(SeiContractService.name);

  private contractAbi: any;

  private contract: ethers.Contract;
  private contractWs: ethers.Contract;

  private validator: ethers.Wallet;

  constructor(
    @Inject(forwardRef(() => EthContractService))
    private readonly ethContractService: EthContractService,
  ) {
    const contractAbiString = readFileSync(
      seiChainConfig.contractABIPath,
      'utf8',
    );
    this.contractAbi = JSON.parse(contractAbiString);

    const provider = new ethers.JsonRpcProvider(seiChainConfig.rpcUrl);
    this.validator = new ethers.Wallet(seiValidatorConfig.privateKey, provider);
    this.logger.log('Sei validator: ' + this.validator.address);

    this.contract = new ethers.Contract(
      seiChainConfig.contractAddress,
      this.contractAbi,
      this.validator,
    );
    this.logger.log('Eth contract initialized');

    this.connect();
  }

  connect() {
    if (this.contractWs) {
      this.contractWs.removeAllListeners();
    }
    const provider = new ethers.WebSocketProvider(seiChainConfig.wsUrl);
    provider.on('error', (err) => {
      this.logger.error('💥 WebSocket error:', err);
      setTimeout(() => this.connect(), 500);
    });

    provider.on('debug', (message: any) => {
      this.logger.log('🔌 WebSocket debug: ', message);
    });

    const signer = new ethers.Wallet(seiValidatorConfig.privateKey, provider);
    this.logger.log('Sei signer: ' + signer.address);
    this.contractWs = new ethers.Contract(
      seiChainConfig.contractAddress,
      this.contractAbi,
      signer,
    );
    this.contractWs.on('BurnTokenVL', (...args: any[]) => {
      this.onBurnTokenVL(...args).catch((error) => {
        this.logger.error('BurnTokenVL error: ', error);
      });
    });
  }

  async onBurnTokenVL(...args: any[]) {
    this.logger.log('BurnTokenVL event: ', args);
    const event = args[args.length - 1];
    const [
      sender,
      destWalletAddress,
      amount,
      fee,
      sourceBridge,
      wTokenAddress,
      chainId,
    ] = event.args;
    const txHash = event?.log?.transactionHash || args[0];
    this.logger.log('BurnTokenVL event: ', txHash, event.args);
    const tokenMap = seiTokenMapperConfig[wTokenAddress] || null;
    if (!tokenMap) {
      this.logger.warn('onBurnTokenVL tokenMap not found');
      return false;
    }
    const payload = {
      txKey: txHash,
      from: sender,
      to: destWalletAddress,
      tokenAddr: tokenMap.address,
      amount: amount,
      chainId: chainId,
    };
    const signature = await this.ethContractService.signMessage(txHash);
    const tx = await this.ethContractService.unLockTokenVL(signature, payload);
    this.logger.log('BurnTokenVL successed tx: ', tx);
    return tx;
  }

  async signMessage(message: string) {
    // hash the message
    const signResult = await this.validator.signMessage(getBytes(message));
    this.logger.log('Sign result: ' + signResult);
    return signResult;
  }

  async mintTokenVL(signature: string, payload: any) {
    this.logger.log('MintTokenVL args: ', signature, payload);
    const tx = await this.contract.mintTokenVL(signature, payload);
    const receipt = await tx.wait();
    this.logger.log('MintTokenVL receipt hash: ' + receipt?.hash);
    return tx;
  }
}
