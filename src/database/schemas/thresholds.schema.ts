import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';

export type ThresholdsDocument = Thresholds & Document;

@Schema()
export class Thresholds extends BaseSchema {
  @Prop({required: true})
  thresholdName: string;

  @Prop({required: true, unique: true})
  thresholdCode: string;

   @Prop({required: true})
  thresholdType: string;

  @Prop({required: true})
  value: number;

  @Prop()
  description: string;

  @Prop({required: true})
  status: string;
}

export const ThresholdsSchema = SchemaFactory.createForClass(Thresholds);
