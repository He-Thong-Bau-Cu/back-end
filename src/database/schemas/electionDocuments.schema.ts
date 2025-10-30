import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Date, Document, Types } from 'mongoose';
import { Elections } from './elections.schema';

export type ElectionDocument = ElectionDocuments & Document;

@Schema()
export class ElectionDocuments {
  @Prop({ type: Types.ObjectId, ref: Elections.name })
  electionId: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  fileUrl: string;

  @Prop()
  status: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;

  @Prop()
  remark: string;
}

export const ElectionDocumentSchema =
  SchemaFactory.createForClass(ElectionDocuments);
