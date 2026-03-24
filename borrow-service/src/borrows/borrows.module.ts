import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BorrowsService } from './borrows.service';
import { BorrowsController } from './borrows.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { Borrow, BorrowSchema } from './borrow.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{ name: Borrow.name, schema: BorrowSchema }]),
    ClientsModule.register([
      { name: 'FINE_SERVICE', transport: Transport.RMQ, options: { urls: ['amqp://localhost:5672'], queue: 'fine_queue' } },
      { name: 'RESERVATION_SERVICE', transport: Transport.RMQ, options: { urls: ['amqp://localhost:5672'], queue: 'reservation_queue' } },
      { name: 'NOTIFICATION_SERVICE', transport: Transport.RMQ, options: { urls: ['amqp://localhost:5672'], queue: 'notification_queue' } },
    ]),
  ],
  controllers: [BorrowsController],
  providers: [BorrowsService],
})
export class BorrowsModule {}
