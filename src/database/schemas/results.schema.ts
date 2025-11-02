import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { ElectionEntities } from './electionEntities.schema';
import { LargeNumberLike } from 'crypto';

export type ResultsDocument = Results & Document;

@Schema()
export class Results extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ElectionEntities.name, required: true })
  entityId: Types.ObjectId;

  @Prop({ required: true })
  votesCount: number;

  @Prop({ required: true })
  isFinal: boolean;


}

export const ResultsSchema = SchemaFactory.createForClass(Results);
