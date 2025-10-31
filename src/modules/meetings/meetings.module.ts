import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Meetings, MeetingsSchema } from 'src/database/schemas/meetings.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';

@Module({
  imports: [
    MongooseModule. forFeature([
      { name: Meetings.name, schema: MeetingsSchema },
      { name: Elections.name, schema: ElectionsSchema },
    ]),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
