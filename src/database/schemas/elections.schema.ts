import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type ElectionsDocument = Elections & Document;

@Schema()
export class Elections extends BaseSchema {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Types.ObjectId, ref: ElectionTypes.name, default: null })
  typeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: VotingMethods.name, default: null })
  votingMethodId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Thresholds.name, default: null })
  thresholdId: Types.ObjectId;

  @Prop({ default: null })
  startDate: Date;

  @Prop({ default: null })
  endDate: Date;

  @Prop({ type: Object, default: null })
  timeline: {
    checkinAt?: Date;
    reportAt?: Date;
    votingAt?: Date;
    resultAnnouncedAt?: Date;
    closingAt?: Date;
  }

  @Prop({ type: Object, default: null })
  stages: {
    checkin?: string; // 'STARTED' | 'COMPLETED'
    report?: string;
    voting?: string;
    result?: string;
    closing?: string;
  }



  @Prop({ default: null })
  delegationStart: Date;

  @Prop({ default: null })
  delegationEnd: Date;

  @Prop({ default: STATUS.ACTIVE })
  status: string;

  @Prop({ default: null })
  statusData: string;

  @Prop({ required: true })
  decisionNumber: string;

  @Prop({ required: true })
  decisionName: string;

  @Prop({ default: null })
  rejectReason: string;

  @Prop({ default: false })
  createByUser: boolean;

  @Prop({ default: false })
  isUserCreate: boolean;

  @Prop({ default: false })
  isUserBasicCreate: boolean;

  @Prop({ type: Object, default: null })
  tempSecretaryInfo: {
    fullName?: string;
    email?: string;
    phone?: string;
    citizenId?: string;
    address?: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'Users', default: null })
  secretaryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users', default: null })
  boardOfControlId: Types.ObjectId;
}

export const ElectionsSchema = SchemaFactory.createForClass(Elections);
