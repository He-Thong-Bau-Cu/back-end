import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';

export type ElectionEntitiesDocument = ElectionEntities & Document;

export class ElectionEntities extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: ElectionTypes.name, required: true})
  electionType: Types.ObjectId;

  @Prop({required: true})
  title: string;

  @Prop({required: true})
  description: string;

  @Prop({type: Object})
  metaData: Record<string, any>;

  @Prop()
  fileUrl: string;

  @Prop({type: Types.ObjectId, ref: User.name, required: true})
  proposerId: Types.ObjectId;

  @Prop({required: true})
  status: string;
}

export const ElectionEntitiesSchema = SchemaFactory.createForClass(ElectionEntities);
