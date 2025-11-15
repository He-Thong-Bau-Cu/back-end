import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { BaseSchema } from "./base.schema";
import { Users } from "./users.schema";
import { Types } from "mongoose";

export type NotificationDocument = Notification & Document;

@Schema()
export class Notification extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Users.name })
  userId: Types.ObjectId;

  @Prop({ })
  message: string;

  @Prop({ default: false })
  read: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
