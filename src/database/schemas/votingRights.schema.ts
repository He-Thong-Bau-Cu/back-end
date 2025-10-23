import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { Voters } from './voters.schema';

export type VotingRightsDocument = VotingRights & Document;

export class VotingRights extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Voters.name, required: true })
  voterId: Types.ObjectId;

  @Prop({ required: true })
  shares: number;

  @Prop({ required: true })
  votes: number;

  @Prop({required: true})
  status: string;
}

export const VotingRightsSchema = SchemaFactory.createForClass(VotingRights);
