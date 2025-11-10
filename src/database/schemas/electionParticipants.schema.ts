import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { ElectionTypes } from './electionTypes.schema';
import { VotingMethods } from './votingMethods.schema';
import { Thresholds } from './thresholds.schema';
import { Elections } from './elections.schema';
import { Users } from './users.schema';
import { Roles } from './roles.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type ElectionsParticipantsDocument = ElectionsParticipants & Document;

@Schema()
export class ElectionsParticipants extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Roles.name, required: true })
  roleId: Types.ObjectId;

  @Prop({ required: true })
  position: string;

  @Prop({ default: STATUS.PENDING })
  status: string;

}

export const ElectionsParticipantsSchema = SchemaFactory.createForClass(ElectionsParticipants);
