import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Users } from './users.schema';
import { ElectionEntities } from './electionEntities.schema';
import { LargeNumberLike } from 'crypto';
import { Voters } from './voters.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type BallotsDocument = Ballots & Document;

@Schema()
export class Ballots extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Voters.name, required: true })
  voterId: Types.ObjectId;

  // @Prop({ type: Types.ObjectId, ref: ElectionEntities.name, required: true })
  // entityId: Types.ObjectId;

  @Prop({ default: null })
  voteValue: number;

  @Prop({ default: null })
  otpCode: string;

  @Prop({ default: null })
  signature: string;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: null })
  encryptedVote: string;

  @Prop({ default: STATUS.DRAFT })
  status: string;

  @Prop({ default: null })
  issuedAt: Date;

  @Prop({ default: null })
  castAt: Date;
}

export const BallotsSchema = SchemaFactory.createForClass(Ballots);
