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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: ElectionTypes.name, schema: ElectionTypesSchema },
      { name: VotingMethods.name, schema: VotingMethodsSchema },
      { name: Thresholds.name, schema: ThresholdsSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
  ],
  providers: [ElectionsService],
  controllers: [ElectionsController],
})
export class ElectionsModule { }
