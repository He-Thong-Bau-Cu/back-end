import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Users } from './users.schema';
import { SEVERITY, STATUS } from 'src/common/enums/status.enum';

export type ReportsDocument = Reports & Document;

@Schema()
export class Reports extends BaseSchema {
  @Prop({ required: true })
  type: string;

  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, default: null })
  reviewedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  signedBy: Types.ObjectId;

  @Prop({ default: null })
  description: string;

  @Prop({ default: null })
  fileUrl: string;

  @Prop({ default: STATUS.ACTIVE })
  status: string;

  @Prop({ default: SEVERITY.LOW })
  severity: string;

  @Prop({ default: null })
  summary: string;

  @Prop({ default: new Date() })
  reviewedAt: Date;
}

export const ReportsSchema = SchemaFactory.createForClass(Reports);
