import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type PermissionsDocument = Permissions & Document;

@Schema()
export class Permissions extends BaseSchema {
  @Prop({ unique: true })
  permissionName: string;

  @Prop({ unique: true })
  permissionCode: string;

  @Prop({ unique: true })
  url: string;

  @Prop({ default: null })
  description: string;

  @Prop({default: STATUS.ACTIVE })
  status: string;
}

export const PermissionsSchema = SchemaFactory.createForClass(Permissions);
