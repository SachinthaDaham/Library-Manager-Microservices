import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'reservation_queue',
      queueOptions: { durable: true },
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Reservation Service')
    .setDescription('Manages book queue and waitlists')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.startAllMicroservices();
  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`🚀 Reservation Service is running on http://localhost:${port}`);
}
bootstrap();
