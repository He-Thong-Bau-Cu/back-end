import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Users } from "./users.schema";
import moment from 'moment-timezone';
import { getCurrentDateVN } from 'src/common/utils/format';

@Schema()
export class BaseSchema extends Document {
  @Prop({ default: () => getCurrentDateVN() })
  updatedAt: Date;

  @Prop({ default: () => getCurrentDateVN() })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  updatedBy: Types.ObjectId;

  get createdAtVN(): string {
    return moment(this.createdAt).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
  }

  get updatedAtVN(): string {
    return moment(this.updatedAt).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
  }
}

export const BaseSchemaSchema = SchemaFactory.createForClass(BaseSchema);
