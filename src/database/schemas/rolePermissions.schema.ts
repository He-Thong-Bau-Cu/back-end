import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  Document, Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSchema } from './base.schema';
import { Roles } from './roles.schema';
import { Permissions } from './permissions.schema';

export type RolePermissionsDocument = RolePermissions & Document;

@Schema()
export class RolePermissions extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: Roles.name, required: true })
  roleId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: Permissions.name }], required: true })
  permissionIds: Types.ObjectId[];
}

export const RolePermissionsSchema = SchemaFactory.createForClass(RolePermissions);
