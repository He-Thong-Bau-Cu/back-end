import { Injectable } from '@nestjs/common';
import { CreateRolesDto } from './dto/create-roles.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Roles } from 'src/database/schemas/roles.schema';
import { Model } from 'mongoose';


@Injectable()
export class RolesService {
  constructor( @InjectModel(Roles.name)
    private readonly rolesModel:Model<Roles>) {}
  
    async getRoles(req:CreateRolesDto){
      try {
        const roles = await this.rolesModel.find().exec();
        return roles;
      } catch (error) {
        throw error;
      }
    }
}
