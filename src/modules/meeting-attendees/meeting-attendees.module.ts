import { Module } from '@nestjs/common';
import { MeetingAttendeesService } from './meeting-attendees.service';
import { MeetingAttendeesController } from './meeting-attendees.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingAttendees, MeetingAttendeesSchema } from 'src/database/schemas/meetingAttendees.schema';
import { Meetings, MeetingsSchema } from 'src/database/schemas/meetings.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MeetingAttendees.name, schema: MeetingAttendeesSchema },
      { name: Meetings.name, schema: MeetingsSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Elections.name, schema: ElectionsSchema },
    ]),
    NotificationModule,
  ],
  controllers: [MeetingAttendeesController],
  providers: [MeetingAttendeesService],
})
export class MeetingAttendeesModule { }
