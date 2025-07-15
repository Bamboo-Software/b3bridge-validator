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
import { concat, ethers, keccak256, Signature, toUtf8Bytes } from 'ethers';
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
    this.validator = new ethers.Wallet(
      seiValidatorConfig.privateKey,
      new ethers.JsonRpcProvider(seiChainConfig.rpcUrl),
    );
    this.logger.log('Sei validator: ', this.validator.address);
    this.contract = new ethers.Contract(
      seiChainConfig.contractAddress,
      this.contractAbi,
      this.validator,
    );
    this.logger.log('Sei contract initialized');

    this.listenToEvents();
    this.signMessage(
      '0x366ada605d8b9dff6e5666b718424c8dfa816be49572aad15a3d84b2629b5c60',
    );
    // 0x13b10b125153868f791cbc625d02414634de4e57c36ec99797701a005ff1cc670c49376623e6399b1ee75dcd5b572a23ccca2ef1de6500ade5c8bf9be3d132921c
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
    this.logger.log('BurnTokenVL payload: ', payload);
    const signature = await this.ethContractService.signMessage(txHash);
    this.logger.log('BurnTokenVL signature: ', signature);
    const receipt = await this.ethContractService.unLockTokenVL(
      signature,
      payload,
    );
    this.logger.log('BurnTokenVL receipt: ', receipt);
    return receipt;
  }

  async signMessage(message: string) {
    // hash the message
    // const messageHash = keccak256();
    this.logger.log('Message: ' + message);
    const signResult = await this.validator.signMessage(toUtf8Bytes(message));
    this.logger.log('Sign result: ' + signResult);
    return signResult;
  }

  async mintTokenVL(signature: string, payload: any) {
    this.logger.log('MintTokenVL args: ', signature, payload);
    const tx = await this.contract.mintTokenVL(signature, payload);
    const receipt = await tx.wait();
    this.logger.log('MintTokenVL receipt: ', receipt);
    return receipt;
  }
}
