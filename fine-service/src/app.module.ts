import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Fine, FineSchema } from './fine.schema';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost'),
    MongooseModule.forFeature([{ name: Fine.name, schema: FineSchema }])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
