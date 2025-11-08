import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { Permissions } from './permissions.schema';
import { Users } from './users.schema';

export type BackupsDocument = Backups & Document;

@Schema()
export class Backups extends BaseSchema {
  @Prop({ default: null })
  tableName: string;

  @Prop({ default: null })
  recordId: number;

  @Prop({ type: Object, default: null })
  dataBefore: Record<string, any>;

  @Prop({ type: Object, default: null })
  dataAfter: Record<string, any>;

  @Prop({ default: null })
  action: string;

  @Prop({ type: Types.ObjectId, ref: Users.name, required: true })
  actionBy: Types.ObjectId;

  @Prop({ default: null })
  filePath: string;
}

export const BackupsSchema = SchemaFactory.createForClass(Backups);
