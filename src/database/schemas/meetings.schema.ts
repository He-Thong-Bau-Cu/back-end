import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type MeetingsDocument = Meetings & Document;

@Schema()
export class Meetings extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop()
  title: string;

  @Prop({required: true})
  meetingDate: Date;

  @Prop({required: true})
  location: string;

  @Prop()
  description: string;

  @Prop({default:STATUS.SCHEDULED})
  status: string;
}

export const MeetingsSchema = SchemaFactory.createForClass(Meetings);
