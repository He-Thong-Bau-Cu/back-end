import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Users } from './users.schema';
import { SEVERITY, STATUS } from 'src/common/enums/status.enum';
import { ElectionDocuments } from './electionDocuments.schema';

export type ReportsDocument = Reports & Document;

@Schema()
export class Reports extends BaseSchema {
  @Prop({ required: true })
  type: string;

  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, default: null })
  reviewedBy: Types.ObjectId;

  // @Prop({ type: Types.ObjectId, ref: Users.name, default: null })
  // signedBy: Types.ObjectId;

  @Prop({ default: null })
  description: string;

  @Prop({ type: Types.ObjectId, ref: ElectionDocuments.name, default: null })
  documentId: Types.ObjectId;

  @Prop({ default: STATUS.ACTIVE })
  status: string;

  @Prop({ default: SEVERITY.LOW })
  severity: string;

  @Prop({ default: null })
  summary: string;

  @Prop({ default: null })
  reviewedAt: Date;
}

export const ReportsSchema = SchemaFactory.createForClass(Reports);
