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
import {
  seiChainConfig,
  seiTokenMapperConfig,
  seiValidatorConfig,
} from '../../../config';
import { readFileSync } from 'fs';
import { EthSmartcontractService } from '../../eth/services/eth-smartcontract.service';

@Injectable()
export class SeiSmartcontractService {
  private contract: Contract<ContractAbi>;
  private readonly logger = new Logger(SeiSmartcontractService.name);
  private web3: Web3;
  private validator: Web3Account;

  private reconnectInterval = 3000;
  private reconnecting = false;

  private subscription;

  constructor(
    @Inject(forwardRef(() => EthSmartcontractService))
    private readonly ethSmartcontractService: EthSmartcontractService,
  ) {
    this.initWeb3();
    setInterval(() => this.heartbeat(), 30000);
  }

  private initWeb3() {
    this.logger.log('Initializing Web3 WebSocket provider...');

    const wsProvider = new Web3.providers.WebsocketProvider(
      seiChainConfig.wsUrl,
    );

    wsProvider.on('connect', (evt) => {
      this.logger.log('WebSocket connected chainId: ' + evt.chainId);
    });

    wsProvider.on('disconnect', (evt) => {
      this.logger.log('WebSocket disconnected with message: ' + evt.message);
    });

    wsProvider.on('error', (e) => {
      this.logger.error('WebSocket error', e);
      this.reconnect(); // bạn đã viết hàm reconnect()
    });

    wsProvider.on('end', (e) => {
      this.logger.warn('WebSocket closed', e);
      this.reconnect();
    });

    this.web3 = new Web3(wsProvider);
    // Thêm validator
    if (seiValidatorConfig.privateKey) {
      this.validator = this.web3.eth.accounts.privateKeyToAccount(
        seiValidatorConfig.privateKey,
      );
      this.web3.eth.accounts.wallet.add(this.validator);
      this.logger.log('Validator address: ' + this.validator.address);
    } else {
      this.logger.warn('Validator not found');
    }

    // Load lại contract
    const contractABIString = readFileSync(
      seiChainConfig.contractABIPath,
      'utf8',
    );
    const contractABI = JSON.parse(contractABIString);
    this.contract = new this.web3.eth.Contract(
      contractABI,
      seiChainConfig.contractAddress,
    );

    // Lắng nghe event
    this.listenToEvents();
  }

  private reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.logger.warn('Reconnecting WebSocket in 5s...');
    setTimeout(() => {
      this.initWeb3();
      this.reconnecting = false;
    }, this.reconnectInterval);
  }

  listenToEvents() {
    if (this.subscription) {
      this.subscription?.unsubscribe?.((err, success) => {
        if (success) {
          this.logger.log('[SUB] Unsubscribed successfully');
        } else if (err) {
          this.logger.log('[SUB] Unsubscribed error: ' + err?.message);
        }
      });
      this.subscription = null;
    }

    this.subscription = this.contract.events.BurnTokenVL?.({
      fromBlock: 'latest',
    });
    this.subscription?.on('data', async (event) => this.onBurnTokenVL(event));
    this.subscription?.on('error', (err) =>
      this.logger.log('BurnTokenVL on error: ' + err?.message, err),
    );
  }

  heartbeat() {
    if (this.web3?.eth) {
      this.web3.eth
        .getBlockNumber()
        .catch((err) => this.logger.warn('heartbeat err: ' + err?.message));
    }
  }

  async callReadContractMethod(method: string, ...args: any[]) {
    if (!this.contract.methods[method]) {
      throw new NotFoundException('Not found method: ' + method);
    }
    return this.contract.methods[method](...args).call();
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
      `callWriteContractMethod ${method} successed! Transaction Hash: ` +
      receipt.transactionHash,
    );
    return receipt;
  }

  async onBurnTokenVL(event: any) {
    this.logger.log('onBurnTokenVL event', event);
    try {
      // call unLockToken on eth
      const args: any[] = [];
      const txHash = event.transactionHash;
      const signResult = this.ethSmartcontractService.signMessage(txHash);
      this.logger.log(
        'onBurnTokenVL signResult.signature: ' + signResult.signature,
      );
      const wTokenAddress = event.returnValues.wTokenAddress;
      const tokenMap = seiTokenMapperConfig[wTokenAddress] || null;
      if (!tokenMap) {
        this.logger.warn('onBurnTokenVL tokenMap not found');
        return false;
      }
      args.push(signResult.signature);
      // const nonce = await this.ethSmartcontractService.nonces();
      const payload = {
        txKey: txHash,
        from: event.returnValues.sender,
        to: event.returnValues.destWalletAddress,
        tokenAddr: tokenMap.address, // tokenType = 0
        // tokenAddr: '0x42B4fdB1888001BB4C06f8BaFfB8a96B56693614', // tokenType =1
        amount: event.returnValues.amount,
        // tokenType: tokenMap.type,
        // nonce: nonce + 1,
        chainId: event.returnValues.chainId,
      };
      args.push(payload);
      // return this.ethSmartcontractService.unLockTokenVL(...args);
    } catch (error) {
      this.logger.error('onBurnTokenVL err: ' + error.message);
    }
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
    this.logger.log('signMessage signature: ' + signResult.signature);
    return signResult;
  }

  async getNonce() {
    const addr = this.validator.address;
    if (!this.contract.methods.nonces) {
      throw new NotFoundException('Invalid method nonces');
    }
    const nonce = await this.callReadContractMethod('getNonce', addr);
    this.logger.log(`nonce of address ${addr}`, nonce);
    return Number(nonce);
  }
}
