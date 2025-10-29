import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLog, SystemLogSchema } from 'src/database/schemas/systemLog.schema';
import { AuditLogs, AuditLogsSchema } from 'src/database/schemas/auditLogs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema},
      { name: AuditLogs.name, schema: AuditLogsSchema}
    ])
  ],
  controllers: [SystemController],
  providers: [SystemService]
})
export class SystemModule {}
