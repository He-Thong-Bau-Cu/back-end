import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { Permissions } from './permissions.schema';
import { User } from './users.schema';

export type BackupsDocument = Backups & Document;

@Schema()
export class Backups extends BaseSchema {
  @Prop()
  tableName: string;

  @Prop()
  recordId: number;

  @Prop({ type: Object })
  dataBefore: Record<string, any>;

  @Prop({ type: Object })
  dataAfter: Record<string, any>;

  @Prop()
  action: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  actionBy: Types.ObjectId;

  @Prop()
  filePath: string;
}

export const BackupsSchema = SchemaFactory.createForClass(Backups);
