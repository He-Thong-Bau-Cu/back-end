import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';

export type MeetingsDocument = Meetings & Document;

@Schema()
export class Meetings extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({required: true})
  title: string;

  @Prop({required: true})
  meetingDate: Date;

  @Prop({required: true})
  location: string;

  @Prop({required: true})
  description: string;
}

export const MeetingsSchema = SchemaFactory.createForClass(Meetings);
