import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, Document, Types } from 'mongoose';
import { Elections } from './elections.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { ElectionsParticipants } from './electionParticipants.schema';
import { BaseSchema } from './base.schema';

export type ElectionDocument = ElectionDocuments & Document;

@Schema()
export class ElectionDocuments extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Elections.name, required: true })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ElectionsParticipants.name, default: null })
  preparedBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: null })
  fileUrl: string;

  @Prop({ default: STATUS.ACTIVE })
  status: string;

  @Prop({ default: null })
  remark: string;
}

export const ElectionDocumentSchema =
  SchemaFactory.createForClass(ElectionDocuments);
