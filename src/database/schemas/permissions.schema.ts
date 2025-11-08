import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';

export type PermissionsDocument = Permissions & Document;

@Schema()
export class Permissions extends BaseSchema {
  @Prop({ required: true, unique: true })
  permissionName: string;

  @Prop({ required: true, unique: true })
  permissionCode: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ default: null })
  description: string;

  @Prop({ required: true })
  status: string;
}

export const PermissionsSchema = SchemaFactory.createForClass(Permissions);
