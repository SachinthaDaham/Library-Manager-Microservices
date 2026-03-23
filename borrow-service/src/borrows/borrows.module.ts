import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BorrowsService } from './borrows.service';
import { BorrowsController } from './borrows.controller';

@Module({
  imports: [
    HttpModule,
    ClientsModule.register([
      {
        name: 'LIBRARY_EVENT_BUS',
        transport: Transport.REDIS,
        options: { host: 'localhost', port: 6379 },
      },
    ]),
  ],
  controllers: [BorrowsController],
  providers: [BorrowsService],
})
export class BorrowsModule {}
