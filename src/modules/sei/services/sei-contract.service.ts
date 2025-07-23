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
    const provider = new ethers.WebSocketProvider(seiChainConfig.wsUrl);
    provider.on('error', (err) => {
      this.logger.error('💥 WebSocket error:', err);
    });

    this.validator = new ethers.Wallet(
      seiValidatorConfig.privateKey,
      provider,
    );
    this.logger.log('Sei validator: ', this.validator.address);
    this.contract = new ethers.Contract(
      seiChainConfig.contractAddress,
      this.contractAbi,
      this.validator,
    );
    this.logger.log('Sei contract initialized');

    this.listenToEvents();
    // this.signMessage(
    //   '0x315e495498b3904f8ca332df1a9028d058d723b06d749dd83e41183fc113c231',
    // );
    // 0x7fa79918a0040cdff3314b0a50e72f9294e1eb3ed5ebd57de35b136eb29ba79238377623aa2510ef99ec686e7de6a5aa0db987eca125f4a05e14546b81c0a4c91b
  }

  listenToEvents() {
    this.contract.on('BurnTokenVL', (...args: any[]) => {
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
