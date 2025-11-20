import { Module } from '@nestjs/common';
import { SystemReportService } from './system-report.service';
import { SystemReportController } from './system-report.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLog, SystemLogSchema } from 'src/database/schemas/systemLog.schema';
import { AuditLogs, AuditLogsSchema } from 'src/database/schemas/auditLogs.schema';
import { Backups, BackupsSchema } from 'src/database/schemas/backups.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema },
      { name: AuditLogs.name, schema: AuditLogsSchema },
      { name: Backups.name, schema: BackupsSchema },
    ]),
  ],
  controllers: [SystemReportController],
  providers: [SystemReportService],
})
export class SystemReportModule {}

