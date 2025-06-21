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
import {
  ethChainConfig,
  ethTokenMapperConfig,
  ethValidatorConfig,
  seiTokenMapperConfig,
} from '@/config';
import { readFileSync } from 'fs';
import Web3, { Contract, Web3Account, ContractAbi, SignResult } from 'web3';
import { SeiSmartcontractService } from '../../sei/services/sei-smartcontract.service';

@Injectable()
export class EthSmartcontractService {
  private contract: Contract<ContractAbi>;
  private web3: Web3;
  private validator: Web3Account;
  private readonly logger = new Logger(EthSmartcontractService.name);

  private reconnectInterval = 3000;
  private reconnecting = false;

  private subscription;

  constructor(
    @Inject(forwardRef(() => SeiSmartcontractService))
    private readonly seiSmartcontractService: SeiSmartcontractService,
  ) {
    this.initWeb3();
  }

  private initWeb3() {
    this.logger.log('Initializing Web3 WebSocket provider...');

    const wsProvider = new Web3.providers.WebsocketProvider(
      ethChainConfig.wsUrl,
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
    if (ethValidatorConfig.privateKey) {
      this.validator = this.web3.eth.accounts.privateKeyToAccount(
        ethValidatorConfig.privateKey,
      );
      this.web3.eth.accounts.wallet.add(this.validator);
      this.logger.log('Validator address: ' + this.validator.address);
    } else {
      this.logger.warn('Validator not found');
    }

    // Load lại contract
    const contractABIString = readFileSync(
      ethChainConfig.contractABIPath,
      'utf8',
    );
    const contractABI = JSON.parse(contractABIString);
    this.contract = new this.web3.eth.Contract(
      contractABI,
      ethChainConfig.contractAddress,
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

    this.subscription = this.contract.events.LockedTokenVL?.({
      fromBlock: 'latest',
    });
    this.subscription?.on('data', async (event) => this.onLockedTokenVL(event));
    this.subscription?.on('error', (err) =>
      this.logger.log('LockedTokenVL on error' + err?.message, err),
    );
    // this.logger.log('listenToEvents subscription: ', this.subscription);
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
      to: ethChainConfig.contractAddress,
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

  async onLockedTokenVL(event: any) {
    try {
      this.logger.log('onLockedTokenVL event', event);
      // call mintToken wETH on sei
      const args: any[] = [];
      const txHash = event.transactionHash;
      const signResult = this.seiSmartcontractService.signMessage(txHash);
      this.logger.log(
        'onLockedTokenVL signResult.signature: ' + signResult.signature,
      );
      const tokenAddr =
        event.returnValues.tokenAddr || event.returnValues.tokenSymbol;
      const tokenMap = ethTokenMapperConfig[tokenAddr] || null;
      if (!tokenMap) {
        this.logger.warn('onLockedTokenVL tokenMap not found');
        return false;
      }
      args.push(signResult.signature);
      // const nonce = await this.seiSmartcontractService.getNonce();
      const payload = {
        txKey: txHash,
        from: event.returnValues.sender,
        to: event.returnValues.destWalletAddress,
        tokenAddr: tokenMap.address, // tokenType = 0
        // tokenAddr: '0x42B4fdB1888001BB4C06f8BaFfB8a96B56693614', // tokenType =1
        amount: event.returnValues.amount,
        tokenType: tokenMap.type,
        // nonce: nonce + 1,
      };
      args.push(payload);
      return this.seiSmartcontractService.mintTokenVL(...args);
    } catch (error) {
      this.logger.error('onLockedTokenVL err: ' + error.message);
    }
  }

  async unLockTokenVL(...args: any[]) {
    this.logger.log('unLockToken args', args);
    try {
      await this.callWriteContractMethod('unLockTokenVL', ...args);
    } catch (error) {
      this.logger.error('unLockTokenVL error', error);
    }
  }

  signMessage(message: string): SignResult {
    // hash the message
    const messageHash = message; // this.web3.utils.keccak256(message);
    const signResult = this.validator.sign(messageHash);
    return signResult;
  }

  async nonces() {
    const addr = this.validator.address;
    if (!this.contract.methods.nonces) {
      throw new NotFoundException('Invalid method nonces');
    }
    const nonce = await this.callReadContractMethod('nonces', addr);
    this.logger.log(`nonce of address ${addr}`, nonce);
    return Number(nonce);
  }
}
