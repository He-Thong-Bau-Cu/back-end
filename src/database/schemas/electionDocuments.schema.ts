import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Date, Document, Types } from 'mongoose';
import { Elections } from './elections.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { ElectionsParticipants } from './electionParticipants.schema';

export type ElectionDocument = ElectionDocuments & Document;

@Schema()
export class ElectionDocuments {
  @Prop({ type: Types.ObjectId, ref: Elections.name })
  electionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: ElectionsParticipants.name })
  preparedBy: Types.ObjectId;

  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  fileUrl: string;

  @Prop({default:STATUS.ACTIVE})
  status: string;

  @Prop()
  remark: string;
}

export const ElectionDocumentSchema =
  SchemaFactory.createForClass(ElectionDocuments);
