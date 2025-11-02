import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Roles } from 'src/database/schemas/roles.schema';
import { Model, Types } from 'mongoose';
import { paginate } from 'src/common/dto/paignation';
import { BaseRequest } from 'src/common/dto/base-request.dto';
import { RolesDto } from './dto/roles.dto';
import { STATUS } from 'src/common/enums/status.enum';
import { CreateRoleDTO } from './dto/create-role-dto';
import { MESSAGE } from 'src/common/enums/message.enum';


@Injectable()
export class RolesService {
  constructor(@InjectModel(Roles.name)
  private readonly rolesModel: Model<Roles>) { }

  async findAll(req: BaseRequest) {
    try {
      const roles = await this.rolesModel.find().exec();
      return paginate(roles, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  async getRoleById(id: string) {
    try {
      const role = await this.rolesModel.findById(new Types.ObjectId(id)).exec();
      return role;
    } catch (error) {
      throw error;
    }
  }

  async createRole(req: CreateRoleDTO) {
    try {
      const role = await this.rolesModel.create(req);
      return role;
    } catch (error) {
      throw error;
    }
  }

  async updateRole(id: string, data: RolesDto) {
    try {
      const role = await this.rolesModel
        .findByIdAndUpdate(new Types.ObjectId(id), data, { new: true }).exec();
      return role;
    } catch (error) {
      throw error;
    }
  }

  async deleteRole(id: string) {
    try {
      const role = await this.rolesModel.findById(new Types.ObjectId(id)).exec();
      if (!role) {
        throw new Error(MESSAGE.ROLE_NOT_FOUND);
      }
      role.status = STATUS.DELETED;
      await role.save();
      return role;
    } catch (error) {
      throw error;
    }
  }
}
