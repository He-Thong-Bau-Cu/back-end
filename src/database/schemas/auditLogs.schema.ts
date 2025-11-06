import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { Permissions } from './permissions.schema';
import { Users } from './users.schema';

export type AuditLogsDocument = AuditLogs & Document;

@Schema()
export class AuditLogs extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  module: string;

  @Prop({ type: Number })
  reference_id?: number;

  @Prop({ type: Object })
  old_value?: Record<string, any>;

  @Prop({ type: Object })
  new_value?: Record<string, any>;

  @Prop({ type: String })
  ip_address?: string;

  @Prop({ type: String })
  user_agent?: string;
}

export const AuditLogsSchema = SchemaFactory.createForClass(AuditLogs);
