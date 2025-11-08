import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import {UserDocument, Users} from 'src/database/schemas/users.schema';
import { Model, Types } from 'mongoose';
import {Roles, RolesDocument} from 'src/database/schemas/roles.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import {STATUS} from "../../common/enums/status.enum";
import {UserDto} from "../../common/dto/user.dto";
import { MailService } from '../mail/mail.service';
import {paginate} from "../../common/dto/paignation";
import * as bcrypt from 'bcrypt';
import {USER_ROLE} from "../../common/enums/config.enum";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Users.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Roles.name)
    private roleModel: Model<RolesDocument>,
    private mailService: MailService,
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

  async search(req: UserDto){
    try {
      const userData = await this.userModel.find({
        $or: [
          { fullName: { $regex: req.fullName ? req.fullName : '', $options: 'i' } },
          { email: { $regex: req.email ? req.email : '', $options: 'i' } },
          { phone: { $regex: req.phone ? req.phone : '', $options: 'i' } },
          { citizenId: { $regex: req.citizenId ? req.citizenId : '', $options: 'i' } },
        ],
      }).exec();
      return paginate(userData.length > 0 ? userData : [], req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  async create(req: UserDto) {
    try {
      if (!req.fullName) {
        throw new Error('Họ và tên không được để trống !');
      }
      if (!req.email) {
        throw new Error('Gmail không được để trống !');
      }
      if (!req.phone) {
        throw new Error('Số điện thoại không được để trống !');
      }
      if (!req.citizenId) {
        throw new Error('Số căn cước công dân không được để trống !');
      }
      const checkValidUser = await this.userModel
          .findOne({
            $or: [{ email: req.email }, { phone: req.phone }],
          })
          .exec();

      if (checkValidUser) {
        throw new Error('Gmail hoặc số điện thoại đã tồn tại !');
      }

      const username = await this.generateUserName(req.fullName);
      const password = this.generateRandomPassword(8);
      const passwordHash = await bcrypt.hash(password, 10);

      let roleData = await this.roleModel.findOne({ roleCode: USER_ROLE.USER }).exec();
      if (!roleData) {
        throw new Error(
            'Vai trò người dùng không tồn tại trong hệ thống. Vui lòng tạo vai trò trước khi thêm người dùng.',
        );
      }

      const newUser = new this.userModel({
        username: username,
        password: passwordHash,
        fullName: req.fullName,
        dateOfBirth: req.dateOfBirth,
        citizenId: req.citizenId,
        email: req.email,
        phone: req.phone,
        address: req.address,
        roleId: req.roleId !== null ? new Types.ObjectId(req.roleId) : roleData._id ,
        position: req.position,
        department: req.department,
        isTempPassword: true,
        status: STATUS.ACTIVE,
        image: req.image,
      });
      await newUser.save();
      await this.mailService.sendMail(req.email, req.fullName, username, password);
      return newUser;
    } catch (e) {
      throw e;
    }
  }

  async updateUser(userId: string, req: UserDto){
    try {
      const userData = await this.userModel.findById(new Types.ObjectId(userId)).exec();
      if(!userData){
        throw new Error('Người dùng không tồn tại !');
      }
      const checkEmail = await this.userModel.find({
        $or: [{ email: req.email }],
        _id: { $ne: new Types.ObjectId(userId) },
      }).exec();
      if(checkEmail.length > 0){
        throw new Error('Gmail đã tồn tại !');
      }
      const checkPhone = await this.userModel.find({
        $or: [{ phone: req.phone }],
        _id: { $ne: new Types.ObjectId(userId) },
      }).exec();
      if(checkPhone.length > 0){
        throw new Error('Số điện thoại đã tồn tại !');
      }
      const checkCitizenId = await this.userModel.find({
        $or: [{ citizenId: req.citizenId }],
        _id: { $ne: new Types.ObjectId(userId) },
      }).exec();
      if(checkCitizenId.length > 0){
        throw new Error('Số căn cước công dân đã tồn tại !');
      }
      userData.fullName = req.fullName ? req.fullName : userData.fullName;
      userData.dateOfBirth = req.dateOfBirth ? req.dateOfBirth : userData.dateOfBirth;
      userData.citizenId = req.citizenId ? req.citizenId : userData.citizenId;
      userData.email = req.email ? req.email : userData.email;
      userData.phone = req.phone ? req.phone : userData.phone;
      userData.address = req.address ? req.address : userData.address;
      userData.roleId = req.roleId ? new Types.ObjectId(req.roleId) : userData.roleId;
      userData.position = req.position ? req.position : userData.position;
      userData.department = req.department ? req.department : userData.department;
      userData.image = req.image ? req.image : userData.image;
      await userData.save();
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async detail (userId: string) {
    try {
      const userData = await this.userModel.findById(new Types.ObjectId(userId), "_id username isTempPassword fullName dateOfBirth citizenId email phone address roleId position department image").exec();
      if(!userData){
        throw new Error('Người dùng không tồn tại !');
      }
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async delete (userId: string){
    try{
      const userData = await this.userModel.findById(new Types.ObjectId(userId)).exec();
      if(!userData){
        throw new Error('Người dùng không tồn tại !');
      }
      userData.status = STATUS.INACTIVE;
      return await userData.save();
    }catch(error){
      throw error;
    }
  }

  async generateUserName(fullName: string): Promise<string> {
    const removeVietnameseTones = (str: string) => {
      return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D');
    };

    const normalizedFullName = removeVietnameseTones(fullName.trim().toLowerCase());
    const parts = normalizedFullName.split(/\s+/);

    if (parts.length < 2)
      throw new Error('Tên không hợp lệ. Cần ít nhất họ và tên.');

    const lastName = parts[parts.length - 1];
    const middleAndFirst = parts.slice(0, parts.length - 1);
    const initials = middleAndFirst.map((word) => word[0]).join('');
    const baseUserName = lastName + initials;

    const existingUsers: { username: string }[] = await this.userModel
        .find({ username: new RegExp(`^${baseUserName}\\d*$`, 'i') })
        .select('username')
        .lean();

    const suffixes = existingUsers.map((user) => {
      const match = user.username.match(new RegExp(`^${baseUserName}(\\d*)$`, 'i'));
      return match ? parseInt(match[1] || '0', 10) : 0;
    });

    const isBaseTaken = existingUsers.some(
        (user) => user.username.toLowerCase() === baseUserName.toLowerCase(),
    );

    const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0;
    const newUserName = isBaseTaken ? `${baseUserName}${maxSuffix + 1}` : baseUserName;

    return newUserName;
  }

  generateRandomPassword(length: number = 8): string {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const allChars = upperChars + lowerChars + numberChars;
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars[randomIndex];
    }
    return password;
  }
}
