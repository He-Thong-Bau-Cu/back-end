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

  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  delegatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  delegateId: Types.ObjectId;


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

  @Prop({ default: STATUS.PENDING })
  status: string;

  @Prop({ type: Types.ObjectId, ref: Users.name, default: null })
  confirmedBy: Types.ObjectId;

  @Prop({ default: new Date() })
  confirmedAt: Date;
}

export const DelegationsSchema = SchemaFactory.createForClass(Delegations);
