import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionDocuments, ElectionDocumentSchema } from 'src/database/schemas/electionDocuments.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Elections.name, schema: ElectionsSchema},
      {name: ElectionDocuments.name, schema: ElectionDocumentSchema}
    ])
  ],
  providers: [ElectionsService],
  controllers: [ElectionsController]
})
export class ElectionsModule {}
