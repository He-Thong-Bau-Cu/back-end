import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from 'src/database/schemas/users.schema';
import { Roles, RolesDocument } from '../../database/schemas/roles.schema';
import { UserDto } from '../../common/dto/user.dto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { STATUS } from '../../common/enums/status.enum';
import { USER_ROLE } from '../../common/enums/config.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Roles.name) private readonly roleModel: Model<RolesDocument>,
    private readonly mailService: MailService,
  ) {}

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

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
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
