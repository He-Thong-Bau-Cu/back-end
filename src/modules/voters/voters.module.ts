import { Module } from '@nestjs/common';
import { VotersService } from './voters.service';
import { VotersController } from './voters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { VotingRights, VotingRightsSchema } from 'src/database/schemas/votingRights.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voters.name, schema: VotersSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: VotingRights.name, schema: VotingRightsSchema },
    ]),
  ],
  controllers: [VotersController],
  providers: [VotersService],
})
export class VotersModule { }
