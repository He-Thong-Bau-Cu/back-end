import { Module } from '@nestjs/common';
import { DataManagementService } from './data-management.service';
import { DataManagementController } from './data-management.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Backups, BackupsSchema } from 'src/database/schemas/backups.schema';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Backups.name, schema: BackupsSchema }]),
    MinioModule,
  ],
  controllers: [DataManagementController],
  providers: [DataManagementService],
  exports: [DataManagementService],
})
export class DataManagementModule {}

