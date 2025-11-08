import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Users } from './users.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type ElectionEntitiesDocument = ElectionEntities & Document;

@Schema()
export class ElectionEntities extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ElectionTypes.name, required: true })
  electionTypeId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ default: null })
  description: string;

  @Prop({ type: Object, required: true })
  metaData: Record<string, any>;

  @Prop({ default: null })
  fileUrl: string;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  proposerId: Types.ObjectId;

  @Prop({ default: STATUS.ACTIVE })
  status: string;
}

export const ElectionEntitiesSchema = SchemaFactory.createForClass(ElectionEntities);
