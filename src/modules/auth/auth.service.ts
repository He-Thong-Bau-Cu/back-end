import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { Users, UserDocument } from "../../database/schemas/users.schema";
import { Model } from "mongoose";
import { Roles, RolesDocument } from "../../database/schemas/roles.schema";
import { RolePermissions, RolePermissionsDocument } from "../../database/schemas/rolePermissions.schema";
import { Permissions, PermissionsDocument } from "../../database/schemas/permissions.schema";

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Users.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Roles.name) private readonly roleModel: Model<RolesDocument>,
        @InjectModel(RolePermissions.name) private readonly rolePermissionModel: Model<RolePermissionsDocument>,
        @InjectModel(Permissions.name) private readonly permissionModel: Model<PermissionsDocument>,
    ) {
    }


}
