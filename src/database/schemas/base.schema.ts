import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Users } from "./users.schema";

@Schema()
export class BaseSchema extends Document {
  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  updatedBy: Types.ObjectId;
}

export const BaseSchemaSchema = SchemaFactory.createForClass(BaseSchema);
