import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      colors: true,
    }),
  });
}
bootstrap();
