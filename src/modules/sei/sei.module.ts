/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { SeiContractService } from './services/sei-contract.service';
import { appConfig } from '../../config';
import { SeiSmartcontractService } from './services/sei-smartcontract.service';

const services = appConfig.useLibEthers ? [SeiSmartcontractService] : [SeiContractService];

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [...services],
  exports: [...services],
})
export class SeiModule { }
