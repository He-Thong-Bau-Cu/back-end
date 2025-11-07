import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';

export type UserDocument = Users & Document;

@Schema()
export class Users extends BaseSchema {
  @Prop({ unique: true, required: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: false })
  isTempPassword: boolean;

  @Prop({ required: true })
  fullName: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ required: true, unique: true })
  citizenId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: USER_ROLE.USER })
  status: string;

  @Prop({ type: Types.ObjectId, ref: Roles.name, required: true })
  roleId: Types.ObjectId;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  department: string;

  @Prop()
  image: string;

  @Prop({ default: true })
  isTwoFaEnabled: boolean;

  @Prop({ default: '' })
  twoFaSecret: string;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
