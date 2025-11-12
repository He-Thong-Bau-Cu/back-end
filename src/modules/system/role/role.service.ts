import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Roles, RolesDocument } from '../../../database/schemas/roles.schema';
import { Model, Types } from 'mongoose';
import {
  RolePermissions,
  RolePermissionsDocument,
} from '../../../database/schemas/rolePermissions.schema';
import { Permissions, PermissionsDocument } from '../../../database/schemas/permissions.schema';
import { RoleDto } from '../../../common/dto/role.dto';
import { STATUS } from '../../../common/enums/status.enum';
import { RolePermissionDto } from '../../../common/dto/rolePermission.dto';
import { PermissionDto } from '../../../common/dto/permission.dto';
import { paginate } from '../../../common/dto/paignation';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Roles.name) private readonly roleModel: Model<RolesDocument>,
    @InjectModel(RolePermissions.name)
    private readonly rolePermissionModel: Model<RolePermissionsDocument>,
    @InjectModel(Permissions.name) private readonly permissionModel: Model<PermissionsDocument>,
  ) {}

  async searchRole(req: RoleDto) {
    try {
      if (req.roleName) {
        const roleData = await this.roleModel.find({ roleName: req.roleName }).exec();
        return paginate(roleData, req.page, req.limit);
      }
      const roleData = await this.roleModel.find().exec();
      return paginate(roleData, req.page, req.limit);
    } catch (e) {
      throw e;
    }
  }

  async getStatsRole() {
    try {
      const totalRole = await this.roleModel.countDocuments();
      const activeRole = await this.roleModel.countDocuments({ status: STATUS.ACTIVE });
      const inactiveRole = await this.roleModel.countDocuments({ status: STATUS.INACTIVE });
      return { totalRole, activeRole, inactiveRole };
    } catch (e) {
      throw e;
    }
  }

  async getStatsPermission() {
    try {
      const totalPermission = await this.permissionModel.countDocuments();
      const activePermission = await this.permissionModel.countDocuments({ status: STATUS.ACTIVE });
      const inactivePermission = await this.permissionModel.countDocuments({
        status: STATUS.INACTIVE,
      });
      return { totalPermission, activePermission, inactivePermission };
    } catch (e) {
      throw e;
    }
  }

  async createRole(req: RoleDto) {
    try {
      const checkRole = await this.roleModel
        .findOne({ $or: [{ roleName: req.roleName }, { roleCode: req.roleCode }] })
        .exec();
      if (checkRole) {
        throw new Error('Tên quyền hoặc mã quyền đã tồn tại');
      }
      const newRole = new this.roleModel({
        roleName: req.roleName,
        roleCode: req.roleCode,
        description: req.description,
        status: STATUS.ACTIVE,
      });
      await newRole.save();
      const newRolePermission = new this.rolePermissionModel({
        roleId: newRole._id,
        permissionIds: [],
      });
      await newRolePermission.save();
      return newRole;
    } catch (e) {
      throw e;
    }
  }

  async updateRole(req: RoleDto) {
    try {
      const roleData = await this.roleModel.findById(new Types.ObjectId(req.roleId)).exec();
      if (!roleData) {
        throw new Error('Quyền không tồn tại');
      }
      const checkValidRole = await this.roleModel.findOne({
        $or: [{ roleName: req.roleName }, { roleCode: req.roleCode }],
        _id: { $ne: roleData._id },
      });
      if (checkValidRole) {
        throw new Error('Tên quyền hoặc mã quyền đã tồn tại');
      }
      if (req.roleName) {
        roleData.roleName = req.roleName;
      }
      if (req.roleCode) {
        roleData.roleCode = req.roleCode;
      }
      if (req.description) {
        roleData.description = req.description;
      }
      if (req.status) {
        roleData.status = req.status;
      }
      return await roleData.save();
    } catch (e) {
      throw e;
    }
  }

  async detailRole(roleId: string) {
    try {
      const roleData = await this.roleModel.findById(new Types.ObjectId(roleId)).exec();
      if (!roleData) {
        throw new Error('Quyền không tồn tại');
      }
      return roleData;
    } catch (e) {
      throw e;
    }
  }

  async deleteRole(id: string) {
    try {
      const roleData = await this.roleModel.findById(new Types.ObjectId(id)).exec();
      if (!roleData) {
        throw new Error('Quyền không tồn tại');
      }
      roleData.status = STATUS.INACTIVE;
      return await roleData.save();
    } catch (e) {
      throw e;
    }
  }

  async searchRolePermission(req: RolePermissionDto) {
    try {
      const rolePermissionData = await this.rolePermissionModel.find().populate('roleId').exec();

      const mapRole = rolePermissionData.map((role) => {
        const populatedRole = role.roleId as unknown as Roles;
        return {
          id: role._id,
          roleId: populatedRole?._id,
          roleName: populatedRole?.roleName,
          roleCode: populatedRole?.roleCode,
          description: populatedRole?.description,
          status: populatedRole?.status,
          permissionIds: role.permissionIds,
        };
      });

      return paginate(mapRole, req.page, req.limit);
    } catch (e) {
      throw e;
    }
  }

  async getAllPermission() {
    try {
      const permissionData = await this.permissionModel
        .find({ status: STATUS.ACTIVE })
        .sort({ permissionName: 1 })
        .exec();
      return permissionData;
    } catch (e) {
      throw e;
    }
  }

  async updateRolePermission(req: RolePermissionDto) {
    try {
      const rolePermissionData = await this.rolePermissionModel
        .findOne({
          _id: new Types.ObjectId(req.rolePermissionId),
          roleId: new Types.ObjectId(req.roleId),
        })
        .exec();
      if (!rolePermissionData) {
        throw new Error('Phân quyền không tồn tại');
      }
      rolePermissionData.permissionIds = req.permissionIds.map((id) => new Types.ObjectId(id));
      return await rolePermissionData.save();
    } catch (e) {
      throw e;
    }
  }

  async searchPermission(req: PermissionDto) {
    try {
      const query: any = {};

      if (req.permissionName && req.permissionName.trim() !== '') {
        query.permissionName = { $regex: req.permissionName, $options: 'i' };
      }

      const permissionData = await this.permissionModel.find(query).exec();

      return paginate(permissionData, req.page, req.limit);
    } catch (e) {
      throw e;
    }
  }

  async createPermission(req: PermissionDto) {
    try {
      const checkPermission = await this.permissionModel
        .findOne({
          permissionName: req.permissionName,
          permissionCode: req.permissionCode,
          url: req.url,
        })
        .exec();
      if (checkPermission) {
        throw new Error('Tên quyền, mã quyền hoặc url đã tồn tại');
      }
      const newPermission = new this.permissionModel({
        permissionName: req.permissionName,
        permissionCode: req.permissionCode,
        url: req.url,
        description: req.description,
        status: STATUS.ACTIVE,
      });
      return await newPermission.save();
    } catch (e) {
      throw e;
    }
  }

  async updatePermission(req: PermissionDto) {
    try {
      const permissionData = await this.permissionModel
        .findById(new Types.ObjectId(req.permissionId))
        .exec();
      if (!permissionData) {
        throw new Error('Quyền không tồn tại');
      }
      const checkValidPermission = await this.permissionModel.findOne({
        _id: { $ne: permissionData._id },
        $or: [
          { permissionName: req.permissionName },
          { permissionCode: req.permissionCode },
          { url: req.url },
        ],
      });
      if (checkValidPermission) {
        throw new Error('Tên quyền, mã quyền hoặc url đã tồn tại');
      }
      if (req.permissionName) {
        permissionData.permissionName = req.permissionName;
      }
      if (req.permissionCode) {
        permissionData.permissionCode = req.permissionCode;
      }
      if (req.url) {
        permissionData.url = req.url;
      }
      if (req.description) {
        permissionData.description = req.description;
      }
      if (req.status) {
        permissionData.status = req.status;
      }
      return await permissionData.save();
    } catch (e) {
      throw e;
    }
  }

  async detailPermission(permissionId: string) {
    try {
      const permissionData = await this.permissionModel
        .findById(new Types.ObjectId(permissionId))
        .exec();
      if (!permissionData) {
        throw new Error('Quyền không tồn tại');
      }
      return permissionData;
    } catch (e) {
      throw e;
    }
  }

  async deletePermission(id: string) {
    try {
      const permissionData = await this.permissionModel.findById(new Types.ObjectId(id)).exec();
      if (!permissionData) {
        throw new Error('Quyền không tồn tại');
      }
      permissionData.status = STATUS.INACTIVE;
      return await permissionData.save();
    } catch (e) {
      throw e;
    }
  }
}
