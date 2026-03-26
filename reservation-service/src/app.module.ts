import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Reservation, ReservationSchema } from './reservation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/library-reservation-db',
      }),
    }),
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }]),
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
