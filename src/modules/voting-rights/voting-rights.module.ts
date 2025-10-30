import { Module } from '@nestjs/common';
import { VotingRightsService } from './voting-rights.service';
import { VotingRightsController } from './voting-rights.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { VotingRights, VotingRightsSchema } from 'src/database/schemas/votingRights.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VotingRights.name, schema:VotingRightsSchema},
      {name:Elections.name, schema:ElectionsSchema},
      {name:Voters.name, schema:VotersSchema},
    ]),
  ],
  controllers: [VotingRightsController],
  providers: [VotingRightsService],
})
export class VotingRightsModule {}
