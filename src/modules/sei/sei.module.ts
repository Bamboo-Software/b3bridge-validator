/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { SeiContractService } from './services/sei-contract.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [SeiContractService],
  exports: [SeiContractService],
})
export class SeiModule {}
