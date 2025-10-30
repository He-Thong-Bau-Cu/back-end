import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { User } from './users.schema';
import { Roles } from './roles.schema';

export type ElectionsParticipantsDocument = ElectionsParticipants & Document;
@Schema()
export class ElectionsParticipants extends BaseSchema{
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Roles.name, required: true })
  roleId: Types.ObjectId;

  @Prop({required: true})
  position: string;

  
}

export const ElectionsParticipantsSchema = SchemaFactory.createForClass(ElectionsParticipants);
