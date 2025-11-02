import { Module } from '@nestjs/common';
import { ElectionTypesService } from './election-types.service';
import { ElectionTypesController } from './election-types.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ElectionTypes, ElectionTypesSchema } from 'src/database/schemas/electionTypes.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ElectionTypes.name, schema: ElectionTypesSchema }]),
  ],
  controllers: [ElectionTypesController],
  providers: [ElectionTypesService],
})
export class ElectionTypesModule {}
