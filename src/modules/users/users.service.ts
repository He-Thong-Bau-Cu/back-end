import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from 'src/database/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { Roles } from 'src/database/schemas/roles.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name) 
    private userModel: Model<Users>,
    @InjectModel(Roles.name)
    private roleModel: Model<Roles>,
  ){}

  async getAll(){
    try {
      const users = await this.userModel.find().populate('roleId').exec();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string){
    try {

      const user = await this.userModel
      .findById(new Types.ObjectId(id))
      .populate('roleId')
      .exec();
      
      if (!user) {
        throw new Error(MESSAGE.USER_NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
