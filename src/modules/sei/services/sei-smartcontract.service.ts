/*
https://docs.nestjs.com/providers#services
*/

import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import Web3, { Contract, ContractAbi, SignResult, Web3Account } from 'web3';
import { ethTokenMapperConfig, seiChainConfig, seiValidatorConfig } from '../../../config';
import { readFileSync } from 'fs';
import { EthSmartcontractService } from '../../eth/services/eth-smartcontract.service';

@Injectable()
export class SeiSmartcontractService {
  private contract: Contract<ContractAbi>;
  private readonly logger = new Logger(SeiSmartcontractService.name);
  private web3: Web3;
  private validator: Web3Account;
  constructor(
    @Inject(forwardRef(() => EthSmartcontractService))
    private readonly ethSmartcontractService: EthSmartcontractService,
  ) {
    const contractABIString = readFileSync(
      seiChainConfig.contractABIPath,
      'utf8',
    );
    const contractABI = JSON.parse(contractABIString);
    this.web3 = new Web3(
      new Web3.providers.WebsocketProvider(seiChainConfig.wsUrl),
    );

    if (seiValidatorConfig.privateKey) {
      this.validator = this.web3.eth.accounts.privateKeyToAccount(
        seiValidatorConfig.privateKey,
      );
      this.logger.log('validator address: ' + this.validator.address);
      this.web3.eth.accounts.wallet.add(this.validator);
    }

    this.contract = new this.web3.eth.Contract(
      contractABI,
      seiChainConfig.contractAddress,
    );

    this.listenToEvents();
  }

  listenToEvents() {
    // this.contract.events
    //   .allEvents({
    //     fromBlock: 'latest',
    //   })
    //   .on('data', (event) => {
    //     this.logger.debug('listenToEvents event', event);
    //   });
    this.contract.events
      .BurnTokenVL?.({
        fromBlock: 'latest',
      })
      .on('data', (event) => {
        this.onBurnTokenVL(event);
      });
  }

  async callWriteContractMethod(method: string, ...args: any[]) {
    if (!this.validator) {
      throw new NotFoundException('W3Account not found');
    }
    if (!this.contract.methods[method]) {
      throw new NotFoundException(`Method ${method} not found`);
    }
    const tx = this.contract.methods[method](...args);
    // Lấy gas price và gas limit
    const gasPrice = await this.web3.eth.getGasPrice();
    const gasEstimate = await tx.estimateGas({ from: this.validator.address });

    // Tạo dữ liệu giao dịch
    const txData = {
      from: this.validator.address,
      to: seiChainConfig.contractAddress,
      data: tx.encodeABI(),
      gas: gasEstimate,
      gasPrice: gasPrice,
    };

    // Ký giao dịch
    const signedTx = await this.web3.eth.accounts.signTransaction(
      txData,
      this.validator.privateKey,
    );

    // Gửi giao dịch
    const receipt = await this.web3.eth.sendSignedTransaction(
      signedTx.rawTransaction,
    );

    this.logger.log(
      `callWriteContractMethod ${method} successed! Transaction Hash:` +
      receipt.transactionHash,
    );
    return receipt;
  }

  async onBurnTokenVL(event: any) {
    this.logger.log('onBurnTokenVL event', event);
    // call unLockToken on eth
    const args: any[] = [];
    const txHash = event.transactionHash;
    const signResult = this.ethSmartcontractService.signMessage(txHash);
    this.logger.log(
      'onBurnTokenVL signResult.signature: ' + signResult.signature,
    );
    const wTokenAddress = event.returnValues.wTokenAddress;
    const tokenMap = ethTokenMapperConfig[wTokenAddress] || null;
    if (!tokenMap) {
      this.logger.warn('onBurnTokenVL tokenMap not found');
      return false;
    }
    args.push(signResult.signature);
    const payload = {
      txKey: txHash,
      from: event.returnValues.sender,
      to: event.returnValues.destWalletAddress,
      tokenAddr: tokenMap.address, // tokenType = 0
      // tokenAddr: '0x42B4fdB1888001BB4C06f8BaFfB8a96B56693614', // tokenType =1
      amount: event.returnValues.amount,
      tokenType: tokenMap.type,
      nonce: 1,
    };
    args.push(payload);
    return this.ethSmartcontractService.unLockTokenVL(...args);
  }

  async mintTokenVL(...args: any[]) {
    this.logger.log('mintToken args', args);
    try {
      await this.callWriteContractMethod('mintTokenVL', ...args);
    } catch (error) {
      this.logger.error('mintTokenVL error', error);
    }
  }

  signMessage(message: string): SignResult {
    // hash the message
    const messageHash = message; // this.web3.utils.keccak256(message);
    const signResult = this.validator.sign(messageHash);
    return signResult;
  }
}
