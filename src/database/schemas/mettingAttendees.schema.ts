import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Meetings } from './mettings.schema';
import { ElectionsParticipants } from './electionParticipants.schema';

export type MeetingAttendeesDocument = MeetingAttendees & Document;

@Schema()
export class MeetingAttendees extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Meetings.name, required: true })
  meetingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ElectionsParticipants.name, required: true })
  participantId: Types.ObjectId;

  @Prop({required: true})
  checkInTime: Date;

  @Prop({required: true})
  attended: boolean;
}

export const MeetingAttendeesSchema = SchemaFactory.createForClass(MeetingAttendees);
