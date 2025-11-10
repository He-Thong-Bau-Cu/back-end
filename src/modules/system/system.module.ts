import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLog, SystemLogSchema } from 'src/database/schemas/systemLog.schema';
import { AuditLogs, AuditLogsSchema } from 'src/database/schemas/auditLogs.schema';
import { RoleModule } from './role/role.module';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { Results, ResultsSchema } from 'src/database/schemas/results.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema },
      { name: AuditLogs.name, schema: AuditLogsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Results.name, schema: ResultsSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema}
    ]),
    RoleModule,
  ],
  controllers: [SystemController],
  providers: [SystemService]
})
export class SystemModule {}
