import { Module } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { MeetingsController } from './meetings.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Meetings, MeetingsSchema } from 'src/database/schemas/meetings.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { MeetingAttendees, MeetingAttendeesSchema } from 'src/database/schemas/meetingAttendees.schema';
import { Ballots, BallotsSchema } from 'src/database/schemas/ballots.schema';
import { STATUS } from 'src/common/enums/status.enum';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meetings.name, schema: MeetingsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: MeetingAttendees.name, schema: MeetingAttendeesSchema },
      { name: Ballots.name, schema: BallotsSchema },
    ]),
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
})
export class MeetingsModule {}
