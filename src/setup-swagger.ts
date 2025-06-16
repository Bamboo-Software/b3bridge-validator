import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, path: string): void {
  const documentBuilder = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API Document')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addBearerAuth(
      {
        name: 'x-api-key',
        type: 'apiKey',
        in: 'header',
      },
      'apiKey'
    );

  const document = SwaggerModule.createDocument(app, documentBuilder.build());
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  Logger.log(`Documentation: ${path}`, 'setupSwagger');
}
