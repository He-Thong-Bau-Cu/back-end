import { Module } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { ThresholdsController } from './thresholds.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Thresholds, ThresholdsSchema } from 'src/database/schemas/thresholds.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{name:Thresholds.name, schema:ThresholdsSchema}])
  ],
  controllers: [ThresholdsController],
  providers: [ThresholdsService],
})
export class ThresholdsModule {}
