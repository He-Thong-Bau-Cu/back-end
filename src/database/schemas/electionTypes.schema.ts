import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { STATUS } from 'src/common/enums/status.enum';

export type ElectionTypesDocument = ElectionTypes & Document;

@Schema()
export class ElectionTypes extends BaseSchema {
  @Prop({ required: true, unique: true })
  typeName: string;

  @Prop({ required: true, unique: true })
  typeCode: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: STATUS.ACTIVE })
  status: string;
}

export const ElectionTypesSchema = SchemaFactory.createForClass(ElectionTypes);
