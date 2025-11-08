import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from './base.schema';
import { Users } from './users.schema';

export type SystemLogDocument = SystemLog & Document;

@Schema({
  timestamps: true,
})
export class SystemLog extends BaseSchema {
  @Prop({ required: true })
  method: string;

  @Prop({ required: true })
  url: string;

  @Prop({ default: null })
  statusCode: number;

  @Prop({ default: null })
  ipAddress: string;

  @Prop({ type: Types.ObjectId, ref: Users.name, default: null })
  userId: Types.ObjectId;

  @Prop({ type: Object, default: null })
  body: Record<string, any>;

  @Prop({ type: Object, default: null })
  query: Record<string, any>;

  @Prop({ type: Object, default: null })
  headers: Record<string, any>;

  @Prop({ default: null })
  responseTime: number;
}

export const SystemLogSchema = SchemaFactory.createForClass(SystemLog);
