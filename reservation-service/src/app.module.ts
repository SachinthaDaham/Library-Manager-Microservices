import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Reservation, ReservationSchema } from './reservation.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost'),
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
