import { Module } from '@nestjs/common';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Results, ResultsSchema } from 'src/database/schemas/results.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionEntities, ElectionEntitiesSchema } from 'src/database/schemas/electionEntities.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Results.name, schema: ResultsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionEntities.name, schema: ElectionEntitiesSchema },
    ])
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
})
export class ResultsModule { }
