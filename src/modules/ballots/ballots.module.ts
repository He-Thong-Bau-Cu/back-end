import { Module } from '@nestjs/common';
import { BallotsService } from './ballots.service';
import { BallotsController } from './ballots.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Ballots, BallotsSchema } from 'src/database/schemas/ballots.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { ElectionEntities, ElectionEntitiesSchema } from 'src/database/schemas/electionEntities.schema';
import { VotingRights, VotingRightsSchema } from 'src/database/schemas/votingRights.schema';
import { ElectionTypes, ElectionTypesSchema } from 'src/database/schemas/electionTypes.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ballots.name, schema: BallotsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: ElectionEntities.name, schema: ElectionEntitiesSchema },
      { name: VotingRights.name, schema: VotingRightsSchema },
      { name: ElectionTypes.name, schema: ElectionTypesSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
    NotificationModule,
  ],
  controllers: [BallotsController],
  providers: [BallotsService],
})
export class BallotsModule { }
