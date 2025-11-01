import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { ElectionDocuments } from './electionDocuments.schema';
import { Voters } from './voters.schema';
import { Delegations } from './delegations.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type DelegateCardDocument = DelegateCard & Document;

@Schema()
export class DelegateCard extends BaseSchema{
  @Prop({required: true})
  token: string;

  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Voters.name, required: true })
  voterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Delegations.name})
  delegationId: Types.ObjectId;

  @Prop({required: true})
  issuedAt: Date;

  @Prop({required: true})
  expiresAt: Date;

  @Prop({default:STATUS.ACTIVE})
  status: string;
}

export const DelegateCardSchema = SchemaFactory.createForClass(DelegateCard);
