import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemConfig, SystemConfigSchema } from 'src/database/schemas/systemConfig.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SystemConfig.name, schema: SystemConfigSchema }])],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}

