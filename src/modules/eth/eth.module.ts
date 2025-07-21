/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { EthContractService } from './services/eth-contract.service';
import { appConfig } from '../../config';
import { EthSmartcontractService } from './services/eth-smartcontract.service';

const services = appConfig.useLibEthers ? [
  EthContractService
] : [
  EthSmartcontractService
];

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [...services],
  exports: [...services],
})
export class EthModule { }
