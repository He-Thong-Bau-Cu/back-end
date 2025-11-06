import { Module } from '@nestjs/common';
import { MinioController } from './minio.controller';
import { MinioService } from './minio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [MinioController],
  providers: [MinioService],
  exports: [MinioService],
})
export class MinioModule {}
