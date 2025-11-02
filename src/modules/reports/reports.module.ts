import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Reports, ReportsSchema } from 'src/database/schemas/reports.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Reports.name, schema: ReportsSchema },
    {name: Elections.name, schema: ElectionsSchema},
    {name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema},
  ])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
