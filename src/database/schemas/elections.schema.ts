import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type ElectionsDocument = Elections & Document;
@Schema()
export class Elections extends BaseSchema{
  @Prop({required: true})
  title: string;

  @Prop({ type: Types.ObjectId, ref: ElectionTypes.name, required: true })
  typeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: VotingMethods.name, required: true })
  methodId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Thresholds.name, required: true })
  thresholdId: Types.ObjectId;

  @Prop({required: true})
  startDate: Date;

  @Prop({required: true})
  endDate: Date;

  @Prop({required: true})
  delegationStart: Date;

  @Prop({required: true})
  delegationEnd: Date;

  @Prop({ default:STATUS.ACTIVE})
  status: string;

  @Prop({required: true})
  statusData: string;

  @Prop({required: true})
  decisionNumber: string;

  @Prop({required: true})
  decisionName: string;
}

export const ElectionsSchema = SchemaFactory.createForClass(Elections);
