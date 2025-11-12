import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type RolesDocument = Roles & Document;

@Schema()
export class Roles extends BaseSchema {
  @Prop({ required: true, unique: true })
  roleName: string;

  @Prop({ unique: true })
  roleCode: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: STATUS.ACTIVE })
  status: string;
}

export const RolesSchema = SchemaFactory.createForClass(Roles);
