/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { EthContractService } from './services/eth-contract.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [EthContractService],
  exports: [EthContractService],
})
export class EthModule {}
