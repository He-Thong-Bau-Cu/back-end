import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';
import { Ballots, BallotsSchema } from 'src/database/schemas/ballots.schema';
import { SystemLog, SystemLogSchema } from 'src/database/schemas/systemLog.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Elections.name, schema: ElectionsSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Ballots.name, schema: BallotsSchema },
      { name: SystemLog.name, schema: SystemLogSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule { }
