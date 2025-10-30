import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { Voters } from './voters.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type VoterInvitationsDocument = VoterInvitations & Document;
@Schema()
export class VoterInvitations extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Voters.name, required: true })
  voterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ required: true })
  sentAt: Date;

  @Prop({required: true, default:STATUS.SENT})
  status: string;

  @Prop( { required: true })
  token: string;

  @Prop({required: true})
  expiresAt: Date;
}

export const VoterInvitationsSchema = SchemaFactory.createForClass(VoterInvitations);
