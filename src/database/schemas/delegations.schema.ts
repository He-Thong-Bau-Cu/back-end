import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { ElectionDocuments } from './electionDocuments.schema';

export type DelegationsDocument = Delegations & Document;

@Schema()
export class Delegations extends BaseSchema{
  @Prop({required: true})
  delegationType: string;

  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  delegatorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  delegateId: Types.ObjectId;

  @Prop({required: true})
  startDate: Date;

  @Prop({required: true})
  endDate: Date;

  @Prop({ type: Types.ObjectId, ref: ElectionDocuments.name, required: true })
  documentId: Types.ObjectId;

  @Prop({required: true})
  delegateReason: string;

  @Prop({required: true})
  signature: string;

  @Prop({required: true})
  status: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  confirmedBy: Types.ObjectId;

  @Prop({required: true})
  confirmedAt: Date;
}

export const DelegationsSchema = SchemaFactory.createForClass(Delegations);
