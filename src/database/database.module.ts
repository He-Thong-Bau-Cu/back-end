import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseProvider } from './database.provider';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mydatabase',
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryAttempts: 5,
      }),
    }),
  ],
  exports: [MongooseModule],
  providers: [DatabaseProvider],
})
export class DatabaseModule {}
