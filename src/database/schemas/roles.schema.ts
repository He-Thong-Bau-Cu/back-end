import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';

export type RolesDocument = Roles & Document;

@Schema()
export class Roles extends BaseSchema {
  @Prop({required: true, unique: true})
  roleName: string;

  @Prop({required: true, unique: true})
  roleCode: string;

  @Prop()
  description: string;

  @Prop({required: true})
  status: string;
}

export const RolesSchema = SchemaFactory.createForClass(Roles);
