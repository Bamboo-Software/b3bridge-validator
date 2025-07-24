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
import { ethers, getBytes } from 'ethers';
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
    const provider = new ethers.JsonRpcProvider(ethChainConfig.rpcUrl);
    this.validator = new ethers.Wallet(ethValidatorConfig.privateKey, provider);
    this.logger.log('Eth validator: ' + this.validator.address);

    this.contract = new ethers.Contract(
      ethChainConfig.contractAddress,
      this.contractAbi,
      this.validator,
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
    const signature = await this.seiContractService.signMessage(txHash);
    const tx = await this.seiContractService.mintTokenVL(
      signature as any,
      payload,
    );
    this.logger.log('LockedTokenVL successed tx: ', tx);
  }

  async unLockTokenVL(signature: string, payload: any) {
    this.logger.log('UnLockTokenVL args: ', signature, payload);
    const tx = await this.contract.unLockTokenVL(signature, payload);
    const receipt = await tx.wait();
    this.logger.log('UnLockTokenVL receipt hash: ' + receipt?.hash);
    return tx;
  }

  async signMessage(message: string): Promise<string> {
    const signResult = await this.validator.signMessage(getBytes(message));
    return signResult;
  }
}
