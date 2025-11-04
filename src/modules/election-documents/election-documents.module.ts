import { Module } from '@nestjs/common';
import { ElectionDocumentsService } from './election-documents.service';
import { ElectionDocumentsController } from './election-documents.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ElectionDocuments, ElectionDocumentSchema } from 'src/database/schemas/electionDocuments.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
@Module({
  imports:[
    MongooseModule.forFeature([
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
    ]),
  ],
  controllers: [ElectionDocumentsController],
  providers: [ElectionDocumentsService],
})
export class ElectionDocumentsModule {}
