import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors();

  // Aggregate Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Library API Gateway')
    .setDescription('Centralized Swagger Documentation for all Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    explorer: true,
    swaggerOptions: {
      urls: [
        { url: 'http://localhost:3001/api/docs-json', name: 'Member Service' },
        { url: 'http://localhost:3002/api/docs-json', name: 'Book Service' },
        { url: 'http://localhost:3003/api/docs-json', name: 'Borrow Service' },
        { url: 'http://localhost:3004/api/docs-json', name: 'Fine Service' },
        { url: 'http://localhost:3005/api/docs-json', name: 'Reservation Service' },
        { url: 'http://localhost:3006/api/docs-json', name: 'Notification Service' },
      ],
      primaryName: 'Borrow Service'
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway is running on http://localhost:${port}`);
}
bootstrap();
