import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type VotingMethodsDocument = VotingMethods & Document;

@Schema()
export class VotingMethods extends BaseSchema {
  @Prop({ required: true, unique: true })
  methodName: string;

  @Prop({ required: true, unique: true })
  methodCode: string;

  @Prop({ default: null })
  description: string;

  @Prop({ required: true, default: STATUS.ACTIVE })
  status: string;
}

export const VotingMethodsSchema = SchemaFactory.createForClass(VotingMethods);
