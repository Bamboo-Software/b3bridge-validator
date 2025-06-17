/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';
import { SeiSmartcontractService } from './services/sei-smartcontract.service';

@Global()
@Module({
    imports: [],
    controllers: [],
    providers: [
        SeiSmartcontractService
    ],
    exports: [
        SeiSmartcontractService
    ],
})
export class SeiModule { }
