import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { ElectionEntities } from './electionEntities.schema';
import { LargeNumberLike } from 'crypto';
import { Voters } from './voters.schema';

export type BallotsDocument = Ballots & Document;

export class Ballots extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: Voters.name, required: true})
  voterId: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: ElectionEntities.name, required: true})
  entityId: Types.ObjectId;

  @Prop({required: true})
  voteValue: number;

  @Prop({required: true})
  otpCode: string;

  @Prop({required: true})
  signature: string;

  @Prop({required: true})
  attempts: number;

  @Prop({required: true})
  encryptedVote: string;

  @Prop({required: true})
  status: string;

  @Prop({required: true})
  issuedAt: Date;

  @Prop({required: true})
  castAt: Date;
}

export const BallotsSchema = SchemaFactory.createForClass(Ballots);
