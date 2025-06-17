/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { EthSmartcontractService } from './services/eth-smartcontract.service';

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [
        EthSmartcontractService
    ],
    exports: [
        EthSmartcontractService
    ],
})
export class EthModule { }
