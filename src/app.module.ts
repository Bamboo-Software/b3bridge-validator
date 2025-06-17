import { SeiModule } from './modules/sei/sei.module';
import { EthModule } from './modules/eth/eth.module';
import { CoreModule } from './modules/core/core.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    SeiModule,
    EthModule,
    CoreModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
