import { Injectable } from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Roles, RolesDocument} from "../../../database/schemas/roles.schema";
import {Model, Types} from "mongoose";
import {RolePermissions, RolePermissionsDocument} from "../../../database/schemas/rolePermissions.schema";
import {Permissions, PermissionsDocument} from "../../../database/schemas/permissions.schema";
import {RoleDto} from "../../../common/dto/role.dto";
import {STATUS} from "../../../common/enums/status.enum";
import {RolePermissionDto} from "../../../common/dto/rolePermission.dto";
import {PermissionDto} from "../../../common/dto/permission.dto";
import {paginate} from "../../../common/dto/paignation";

@Injectable()
export class RoleService {
    constructor(
        @InjectModel(Roles.name) private readonly roleModel: Model<RolesDocument>,
        @InjectModel(RolePermissions.name) private readonly rolePermissionModel: Model<RolePermissionsDocument>,
        @InjectModel(Permissions.name) private readonly permissionModel: Model<PermissionsDocument>,
    ) {
    }

    async searchRole(req: RoleDto){
        try{
            const roleData = await this.roleModel.find({roleName: req.roleName}).exec();
            return paginate(roleData, req.page, req.limit);
        }catch (e) {
            throw e;
        }
    }

    async createRole(req: RoleDto){
        try{
            const checkRole = await this.roleModel.findOne({ roleName: req.roleName, roleCode: req.roleCode }).exec();
            if(checkRole){
                throw new Error("Tên quyền hoặc mã quyền đã tồn tại");
            }
            const newRole = new this.roleModel({
                roleName: req.roleName,
                roleCode: req.roleCode,
                description: req.description,
                status: STATUS.ACTIVE
            });
            await newRole.save();
            const newRolePermission = new this.rolePermissionModel({
                roleId: newRole.id,
                permissionIds: []
            })
            await newRolePermission.save()
            return newRole;
        }catch (e) {
            throw e;
        }
    }

    async updateRole(req: RoleDto){
        try{
            const roleData = await this.roleModel.findById(new Types.ObjectId(req.roleId)).exec();
            if(!roleData){
                throw new Error("Quyền không tồn tại");
            }
            const checkValidRole = await this.roleModel.findOne({
                _id: { $ne: new Types.ObjectId(req.roleId) },
                $or: [
                    { name: req.roleName },
                    { code: req.roleCode }
                ]
            })
            if(checkValidRole){
                throw new Error("Tên quyền hoặc mã quyền đã tồn tại");
            }
            roleData.roleName = req.roleName;
            roleData.roleCode = req.roleCode;
            roleData.description = req.description;
            roleData.status = req.status;
            return await roleData.save();
        }catch (e) {
            throw e;
        }
    }

    async detailRole(roleId: string){
        try{
            const roleData = await this.roleModel.findById(new Types.ObjectId(roleId)).exec();
            if(!roleData){
                throw new Error("Quyền không tồn tại");
            }
            return roleData;
        }catch (e) {
            throw e;
        }
    }

    async deleteRole(req: RoleDto){
        try{
            const roleData = await this.roleModel.findById(new Types.ObjectId(req.roleId)).exec();
            if(!roleData){
                throw new Error("Quyền không tồn tại");
            }
            roleData.status = STATUS.INACTIVE;
            return await roleData.save();
        }catch (e) {
            throw e;
        }
    }

    async updateRolePermission(req: RolePermissionDto){
        try{
            const rolePermissionData = await this.rolePermissionModel.findOne({_id: new Types.ObjectId(req.rolePermissionId), roleId: new Types.ObjectId(req.roleId) }).exec();
            if(!rolePermissionData){
                throw new Error("Phân quyền không tồn tại");
            }
            rolePermissionData.permissionIds = req.permissionIds.map(id => new Types.ObjectId(id));
            return await rolePermissionData.save();
        }catch (e) {
            throw e;
        }
    }

    async searchPermission(req: PermissionDto){
        try{
            const permissionData = await this.permissionModel.find({permissionName: req.permissionName}).exec();
            return paginate(permissionData, req.page, req.limit);
        }catch (e) {
            throw e;
        }
    }

    async createPermission(req: PermissionDto){
        try{
            const checkPermission = await this.permissionModel.findOne({ permissionName: req.permissionName, permissionCode: req.permissionCode, url: req.url }).exec();
            if(checkPermission){
                throw new Error("Tên quyền, mã quyền hoặc url đã tồn tại");
            }
            const newPermission = new this.permissionModel({
                permissionName: req.permissionName,
                permissionCode: req.permissionCode,
                url: req.url,
                description: req.description,
                status: STATUS.ACTIVE
            })
            return await newPermission.save();
        }catch (e) {
            throw e;
        }
    }

    async updatePermission(req: PermissionDto){
        try{
            const permissionData = await this.permissionModel.findById(new Types.ObjectId(req.permissionId)).exec();
            if(!permissionData){
                throw new Error("Quyền không tồn tại");
            }
            const checkValidPermission = await this.permissionModel.findOne({
                _id: { $ne: new Types.ObjectId(req.permissionId) },
                $or: [
                    { permissionName: req.permissionName },
                    { permissionCode: req.permissionCode },
                    { url: req.url }
                ]
            })
            if(checkValidPermission){
                throw new Error("Tên quyền, mã quyền hoặc url đã tồn tại");
            }
            permissionData.permissionName = req.permissionName;
            permissionData.permissionCode = req.permissionCode;
            permissionData.url = req.url;
            permissionData.description = req.description;
            permissionData.status = req.status;
            return await permissionData.save();
        }catch (e) {
            throw e;
        }
    }

    async detailPermission(permissionId: string){
        try{
            const permissionData = await this.permissionModel.findById(new Types.ObjectId(permissionId)).exec();
            if(!permissionData){
                throw new Error("Quyền không tồn tại");
            }
            return permissionData;
        }catch (e) {
            throw e;
        }
    }

    async deletePermission(req: PermissionDto){
        try{
            const permissionData = await this.permissionModel.findById(new Types.ObjectId(req.permissionId)).exec();
            if(!permissionData){
                throw new Error("Quyền không tồn tại");
            }
            permissionData.status = STATUS.INACTIVE;
            return await permissionData.save();
        }catch (e) {
            throw e;
        }
    }
}
