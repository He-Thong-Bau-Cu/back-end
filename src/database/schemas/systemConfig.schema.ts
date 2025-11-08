import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { Permissions } from './permissions.schema';
import { Users } from './users.schema';

export type SystemConfigDocument = SystemConfig & Document;

@Schema()
export class SystemConfig extends BaseSchema {
  @Prop({ required: true })
  configKey: string;

  @Prop({ type: Object, default: null })
  configValue: Record<string, any>;

  @Prop({ required: true })
  groupType: string;
}

export const SystemConfigSchema = SchemaFactory.createForClass(SystemConfig);
