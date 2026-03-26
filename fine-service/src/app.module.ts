import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Fine, FineSchema } from './fine.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/library-fine-db',
      }),
    }),
    MongooseModule.forFeature([{ name: Fine.name, schema: FineSchema }])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
