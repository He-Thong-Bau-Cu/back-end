import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Results, ResultsSchema } from 'src/database/schemas/results.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionEntities, ElectionEntitiesSchema } from 'src/database/schemas/electionEntities.schema';
import { Ballots, BallotsSchema } from 'src/database/schemas/ballots.schema';
import { VotingMethods, VotingMethodsSchema } from 'src/database/schemas/votingMethods.schema';
import { Sign } from 'crypto';
import { MinioModule } from '../minio/minio.module';
import { SignatureModule } from '../signature/signature.module';
import { ElectionDocuments, ElectionDocumentSchema } from 'src/database/schemas/electionDocuments.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Results.name, schema: ResultsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionEntities.name, schema: ElectionEntitiesSchema },
      { name: Ballots.name, schema: BallotsSchema },
      { name: VotingMethods.name, schema: VotingMethodsSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
    ]),
    SignatureModule,
    MinioModule,
    MailModule,
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule { }
