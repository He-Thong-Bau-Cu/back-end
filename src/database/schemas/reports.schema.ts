import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';

export type ReportsDocument = Reports & Document;

@Schema()
export class Reports extends BaseSchema{
  @Prop({required: true})
  type: string;

  @Prop({type: Types.ObjectId, ref: Elections.name, required: true})
  electionId: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: User.name, required: true})
  reviewedBy: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: User.name, required: true})
  signedBy: Types.ObjectId;

  @Prop()
  description: string;

  @Prop({required: true})
  fileUrl: string;

  @Prop({required: true})
  status: string;

  @Prop({required: true})
  serverity: string;

  @Prop({required: true})
  summary: string;

  @Prop({required: true})
  reviewedAt: Date;
}

export const ReportsSchema = SchemaFactory.createForClass(Reports);
