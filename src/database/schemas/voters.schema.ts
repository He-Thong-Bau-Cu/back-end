import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type VotersDocument = Voters & Document;

@Schema()
export class Voters extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  eligible: boolean;

  @Prop({required: true, default:STATUS.PENDING})
  status: string;

  
}

export const VotersSchema = SchemaFactory.createForClass(Voters);
