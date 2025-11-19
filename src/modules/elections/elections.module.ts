import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Elections,
  ElectionsSchema,
} from 'src/database/schemas/elections.schema';
import {
  ElectionDocuments,
  ElectionDocumentSchema,
} from 'src/database/schemas/electionDocuments.schema';
import { ElectionTypes, ElectionTypesSchema } from 'src/database/schemas/electionTypes.schema';
import { VotingMethods, VotingMethodsSchema } from 'src/database/schemas/votingMethods.schema';
import { Thresholds, ThresholdsSchema } from 'src/database/schemas/thresholds.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: ElectionTypes.name, schema: ElectionTypesSchema },
      { name: VotingMethods.name, schema: VotingMethodsSchema },
      { name: Thresholds.name, schema: ThresholdsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: Delegations.name, schema: DelegationsSchema },
    ]),
  ],
  providers: [ElectionsService],
  controllers: [ElectionsController],
})
export class ElectionsModule { }
