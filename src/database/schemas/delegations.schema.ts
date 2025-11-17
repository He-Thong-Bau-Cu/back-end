import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Users } from './users.schema';
import { ElectionDocuments } from './electionDocuments.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type DelegationsDocument = Delegations & Document;

@Schema()
export class Delegations extends BaseSchema {
  @Prop({ required: true })
  delegationType: string;

  @Prop({ type: Types.ObjectId, ref: Elections.name, default: null })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  delegatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name })
  delegateId: Types.ObjectId;

  @Prop({ type: Object })
  delegateInfo: Record<string, any>;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Types.ObjectId, ref: ElectionDocuments.name, default: null, required: false })
  documentId: Types.ObjectId;

  @Prop({ default: null })
  delegateReason: string;

  @Prop({ default: null })
  signature: string;

  @Prop({ default: STATUS.DARFT })
  status: string;

  @Prop({ type: Types.ObjectId, ref: Users.name, default: null })
  confirmedBy: Types.ObjectId;

  @Prop({ default: null })
  confirmedAt: Date;
}

export const DelegationsSchema = SchemaFactory.createForClass(Delegations);
