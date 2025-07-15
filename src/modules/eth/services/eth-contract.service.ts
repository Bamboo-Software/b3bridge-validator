/*
https://docs.nestjs.com/providers#services
*/

import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import {
  ethChainConfig,
  ethTokenMapperConfig,
  ethValidatorConfig,
} from '@/config';
import { ethers } from 'ethers';
import { SeiContractService } from '../../sei/services/sei-contract.service';

@Injectable()
export class EthContractService {
  private readonly logger = new Logger(EthContractService.name);

  private contractAbi: any;

  private contract: ethers.Contract;

  private validator: ethers.Wallet;

  constructor(
    @Inject(forwardRef(() => SeiContractService))
    private readonly seiContractService: SeiContractService,
  ) {
    this.logger.log('EthContractService initialized');

    const contractAbiString = readFileSync(
      ethChainConfig.contractABIPath,
      'utf8',
    );
    this.contractAbi = JSON.parse(contractAbiString);

    this.validator = new ethers.Wallet(
      ethValidatorConfig.privateKey,
      new ethers.JsonRpcProvider(ethChainConfig.rpcUrl),
    );
    this.logger.log('Eth validator: ', this.validator.address);
    const provider = new ethers.JsonRpcProvider(ethChainConfig.rpcUrl);
    this.contract = new ethers.Contract(
      ethChainConfig.contractAddress,
      this.contractAbi,
      provider,
    );
    this.logger.log('Eth contract initialized');
    this.listenToEvents();
  }

  async listenToEvents() {
    this.contract.on('LockedTokenVL', (...args: any[]) => {
      this.onLockedTokenVL(...args).catch((error) => {
        this.logger.error('LockedTokenVL error: ', error);
      });
    });
  }

  async onLockedTokenVL(...args: any[]) {
    const event = args[args.length - 1];
    const [sender, receiverAddress, tokenAddr, amount, destAddress, chainId] =
      event.args;
    const txHash = event?.log?.transactionHash || args[0];
    const tokenMap = ethTokenMapperConfig[tokenAddr] || null;
    if (!tokenMap) {
      this.logger.warn('onLockedTokenVL tokenMap not found');
      return false;
    }
    this.logger.log('LockedTokenVL event: ', txHash, event.args);
    const payload = {
      txKey: txHash,
      from: sender,
      to: receiverAddress,
      tokenAddr: tokenMap.address,
      amount: amount,
      chainId: chainId,
    };
    this.logger.log('LockedTokenVL payload: ', payload);
    const signature = await this.seiContractService.signMessage(txHash);
    this.logger.log('LockedTokenVL signature: ', signature);
    const receipt = await this.seiContractService.mintTokenVL(
      signature as any,
      payload,
    );
    this.logger.log('LockedTokenVL receipt: ', receipt);
  }

  async unLockTokenVL(signature: string, payload: any) {
    this.logger.log('UnLockTokenVL args: ', signature, payload);
    const tx = await this.contract.unLockTokenVL(signature, payload);
    const receipt = await tx.wait();
    this.logger.log('UnLockTokenVL receipt: ', receipt);
    return receipt;
  }

  async signMessage(message: string): Promise<string> {
    const signResult = await this.validator.signMessage(message);
    return signResult;
  }
}
