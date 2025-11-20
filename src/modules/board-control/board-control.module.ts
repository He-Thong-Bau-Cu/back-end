import { Module } from '@nestjs/common';
import { BoardControlService } from './board-control.service';
import { BoardControlController } from './board-control.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Ballots, BallotsSchema } from 'src/database/schemas/ballots.schema';
import { Results, ResultsSchema } from 'src/database/schemas/results.schema';
import { AuditLogs, AuditLogsSchema } from 'src/database/schemas/auditLogs.schema';
import { SystemLog, SystemLogSchema } from 'src/database/schemas/systemLog.schema';
import { Reports, ReportsSchema } from 'src/database/schemas/reports.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { Meetings, MeetingsSchema } from 'src/database/schemas/meetings.schema';
import { MeetingAttendees, MeetingAttendeesSchema } from 'src/database/schemas/meetingAttendees.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Elections.name, schema: ElectionsSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: Ballots.name, schema: BallotsSchema },
      { name: Results.name, schema: ResultsSchema },
      { name: AuditLogs.name, schema: AuditLogsSchema },
      { name: SystemLog.name, schema: SystemLogSchema },
      { name: Reports.name, schema: ReportsSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Meetings.name, schema: MeetingsSchema },
      { name: MeetingAttendees.name, schema: MeetingAttendeesSchema },
    ]),
  ],
  controllers: [BoardControlController],
  providers: [BoardControlService],
})
export class BoardControlModule {}

