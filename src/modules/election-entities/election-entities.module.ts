import { Module } from '@nestjs/common';
import { ElectionEntitiesService } from './election-entities.service';
import { ElectionEntitiesController } from './election-entities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ElectionEntities, ElectionEntitiesSchema } from 'src/database/schemas/electionEntities.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionTypes, ElectionTypesSchema } from 'src/database/schemas/electionTypes.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:ElectionEntities.name, schema:ElectionEntitiesSchema},
      {name:Elections.name, schema:ElectionsSchema},
      {name:ElectionTypes.name, schema:ElectionTypesSchema},
      {name:ElectionsParticipants.name, schema:ElectionsParticipantsSchema},
    ])
  ],
  controllers: [ElectionEntitiesController],
  providers: [ElectionEntitiesService],
})
export class ElectionEntitiesModule {}
