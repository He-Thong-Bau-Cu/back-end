import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Users, UserDocument } from '../../database/schemas/users.schema';
import { Model, SchemaTypes } from 'mongoose';
import { Roles, RolesDocument } from '../../database/schemas/roles.schema';
import {
  RolePermissions,
  RolePermissionsDocument,
} from '../../database/schemas/rolePermissions.schema';
import { Permissions, PermissionsDocument } from '../../database/schemas/permissions.schema';
import { LoginDto } from 'src/common/dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { STATUS } from 'src/common/enums/status.enum';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { Types } from 'mongoose';
import { MailService } from '../mail/mail.service';
import { ForwardPasswordDto } from 'src/common/dto/forward-password.dto';
import { ChangePasswordDto } from 'src/common/dto/change-password.dto';
import { SendOtpDto } from 'src/common/dto/send-otp.dto';
import { VerifyOtpDto } from 'src/common/dto/verify-otp.dto';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { encryptString, decryptString } from '../../common/utils/encryption';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Roles.name) private readonly roleModel: Model<RolesDocument>,
    @InjectModel(RolePermissions.name)
    private readonly rolePermissionModel: Model<RolePermissionsDocument>,
    @InjectModel(Permissions.name) private readonly permissionModel: Model<PermissionsDocument>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) { }

  async login(req: LoginDto) {
    try {
      const user = await this.userModel.findOne({ username: req.username }).exec();
      if (!user) {
        throw new Error('Tài khoản không tồn tại!');
      }
      const valid = await bcrypt.compare(req.password, user.password);
      if (!valid) {
        throw new Error('Mật khẩu không đúng!');
      }
      if (user.status !== STATUS.ACTIVE) {
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa!');
      }
      const role = await this.roleModel.findById(user.roleId).exec();
      if (!role || role.status !== STATUS.ACTIVE) {
        throw new Error('Vai trò của bạn không hợp lệ hoặc đã bị vô hiệu hóa!');
      }

      if (user.isTwoFaEnabled) {
        return {
          requireTwoFa: true,
          isSetting: user.isTwoFaEnabled && Boolean(user.twoFaSecret?.trim()),
          userId: user._id,
        };
      }
      const rolePermissions = await this.rolePermissionModel.find({ roleId: role._id }).exec();
      if (!rolePermissions) {
        throw new Error('Vai trò của bạn chưa được cấp quyền truy cập!');
      }
      const permissionIds = rolePermissions.map((rp) => rp.permissionIds);
      const permissions = await this.permissionModel
        .find({ _id: { $in: permissionIds }, status: STATUS.ACTIVE })
        .exec();
      if (!permissions) {
        throw new Error('Vai trò của bạn chưa được cấp quyền truy cập!');
      }
      const permissionPaths = permissions.map((p) => p.url);
      const token = this.jwtService.sign({
        sub: user._id,
        fullname: user.fullName,
        username: user.username,
        role: role.roleCode,
        permissions: permissionPaths,
      });
      console.log("token", token);
      return { accessToken: token };
    } catch (error) {
      throw error;
    }
  }

  async generateTwoFaSecret(userId: string) {
    try {
      const userData = await this.userModel.findById(new Types.ObjectId(userId)).exec();
      if (!userData) {
        throw new Error('Người dùng không tồn tại!');
      }
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'keysecret123';
      if (userData.twoFaSecret) {
        const decryptedSecret = decryptString(userData.twoFaSecret, encryptionKey);
        const otpauthUrl = speakeasy.otpauthURL({
          secret: decryptedSecret,
          label: `Hệ thống bầu cử - ${userData.email}`,
          encoding: 'base32',
        });
        const qrCode = await qrcode.toDataURL(otpauthUrl);
        return { qrCode };
      }
      const secret = speakeasy.generateSecret({
        name: `Hệ thống bầu cử - ${userData.email}`,
        length: 16,
        digits: 6,
      });

      const encryptedSecret = encryptString(secret.base32, encryptionKey);
      userData.twoFaSecret = encryptedSecret;
      await userData.save();

      const qrCode = await qrcode.toDataURL(secret.otpauth_url!);
      return { qrCode };
    } catch (error) {
      throw error;
    }
  }

  async verify2FASetup(userId: string, token: string) {
    const user = await this.userModel.findById(new Types.ObjectId(userId)).exec();
    if (!user || !user.twoFaSecret)
      throw new Error('Người dùng không tồn tại hoặc chưa thiết lập 2FA');

    // Giải mã secret trước khi verify
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'keysecret123';
    const decryptedSecret = decryptString(user.twoFaSecret, encryptionKey);

    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 0,
    });

    if (!isValid) throw new UnauthorizedException('Sai mã OTP');

    user.isTwoFaEnabled = true;
    await user.save();

    return { success: true };
  }

  async verifyLogin2FA(userId: string, token: string) {
    const user = await this.userModel.findById(new Types.ObjectId(userId)).exec();
    if (!user || !user.twoFaSecret)
      throw new UnauthorizedException('Chưa thiết lập xác thực hai yếu tố');

    // Giải mã secret trước khi verify
    const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'keysecret123';
    const decryptedSecret = decryptString(user.twoFaSecret, encryptionKey);

    const isValid = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token,
      window: 0,
    });

    if (!isValid) throw new UnauthorizedException('Sai mã OTP');

    // Lấy role để đảm bảo có đầy đủ thông tin như login
    const role = await this.roleModel.findById(user.roleId).exec();
    if (!role || role.status !== STATUS.ACTIVE) {
      throw new Error('Vai trò của bạn không hợp lệ hoặc đã bị vô hiệu hóa!');
    }

    const rolePermissions = await this.rolePermissionModel.find({ roleId: role._id }).exec();
    if (!rolePermissions) {
      throw new Error('Vai trò của bạn chưa được cấp quyền truy cập!');
    }
    const permissionIds = rolePermissions.map((rp) => rp.permissionIds);
    const permissions = await this.permissionModel
      .find({ _id: { $in: permissionIds }, status: STATUS.ACTIVE })
      .exec();
    if (!permissions) {
      throw new Error('Vai trò của bạn chưa được cấp quyền truy cập!');
    }
    const permissionPaths = permissions.map((p) => p.url);
    // Tạo token với đầy đủ thông tin giống như login
    const jwt = this.jwtService.sign({
      sub: user._id,
      fullname: user.fullName,
      username: user.username,
      role: role.roleCode,
      permissions: permissionPaths,
    });

    return { accessToken: jwt };
  }

  async sendOtp(req: SendOtpDto) {
    try {
      const user = await this.userModel.findOne({ email: req.email }).exec();
      if (!user) {
        throw new Error('Email không tồn tại trong hệ thống!');
      }
      if (user.status !== STATUS.ACTIVE) {
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa!');
      }

      // Tạo mã OTP 6 chữ số
      const otp = this.generateOtp(6);
      const otpKey = `otp:${req.email}`;
      const ttlSeconds = 5 * 60; // OTP có hiệu lực 5 phút

      // Lưu OTP vào Redis với TTL tự động
      await this.redisService.set(otpKey, otp, ttlSeconds);

      // Gửi OTP qua email
      await this.mailService.sendOtpMail(user.email, user.fullName, otp);

      return { message: 'Mã OTP đã được gửi đến email của bạn!' };
    } catch (error) {
      throw error;
    }
  }

  async verifyOtp(req: VerifyOtpDto) {
    try {
      const user = await this.userModel.findOne({ email: req.email }).exec();
      if (!user) {
        throw new Error('Email không tồn tại trong hệ thống!');
      }
      if (user.status !== STATUS.ACTIVE) {
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa!');
      }

      const otpKey = `otp:${req.email}`;
      const storedOtp = await this.redisService.get(otpKey);

      // Kiểm tra OTP có tồn tại không
      if (!storedOtp) {
        throw new Error('Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã OTP mới!');
      }

      // Kiểm tra OTP có đúng không
      if (storedOtp !== req.otp) {
        throw new Error('Mã OTP không đúng!');
      }

      // Đánh dấu OTP đã được verify bằng cách lưu flag vào Redis
      const verifiedKey = `otp:verified:${req.email}`;
      await this.redisService.set(verifiedKey, 'true', 5 * 60); // Giữ flag 5 phút

      // Xóa OTP sau khi verify thành công
      await this.redisService.del(otpKey);

      return { message: 'Xác thực OTP thành công!', verified: true };
    } catch (error) {
      throw error;
    }
  }

  async forwardPassword(req: ForwardPasswordDto) {
    try {
      const user = await this.userModel.findOne({ email: req.email }).exec();
      if (!user) {
        throw new Error('Email không tồn tại trong hệ thống!');
      }
      if (user.status !== STATUS.ACTIVE) {
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa!');
      }

      // Kiểm tra OTP đã được verify chưa
      const verifiedKey = `otp:verified:${req.email}`;
      const isVerified = await this.redisService.get(verifiedKey);

      if (!isVerified) {
        throw new Error('Vui lòng xác thực OTP trước khi đặt lại mật khẩu!');
      }

      // Tạo mật khẩu mới ngẫu nhiên
      const newPassword = this.generateRandomPassword(8);
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Cập nhật mật khẩu và đánh dấu là mật khẩu tạm
      user.password = passwordHash;
      user.isTempPassword = true;
      await user.save();

      // Xóa flag verified sau khi đã sử dụng
      await this.redisService.del(verifiedKey);

      // Gửi email chứa mật khẩu mới
      await this.mailService.sendPasswordResetMail(
        user.email,
        user.fullName,
        user.username,
        newPassword,
      );

      return { message: 'Mật khẩu mới đã được gửi đến email của bạn!' };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(req: ChangePasswordDto) {
    try {
      const user = await this.userModel.findById(new Types.ObjectId(req.userId)).exec();
      if (!user) {
        throw new Error('Người dùng không tồn tại!');
      }
      if (user.status !== STATUS.ACTIVE) {
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa!');
      }

      // Xác thực mật khẩu cũ
      const valid = await bcrypt.compare(req.oldPassword, user.password);
      if (!valid) {
        throw new Error('Mật khẩu cũ không đúng!');
      }

      // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
      const isSamePassword = await bcrypt.compare(req.newPassword, user.password);
      if (isSamePassword) {
        throw new Error('Mật khẩu mới phải khác với mật khẩu cũ!');
      }

      // Mã hóa mật khẩu mới
      const passwordHash = await bcrypt.hash(req.newPassword, 10);

      // Cập nhật mật khẩu và đánh dấu không phải mật khẩu tạm
      user.password = passwordHash;
      user.isTempPassword = false;
      await user.save();

      return { message: 'Đổi mật khẩu thành công!' };
    } catch (error) {
      throw error;
    }
  }

  private generateRandomPassword(length: number = 8): string {
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

  private generateOtp(length: number = 6): string {
    const numberChars = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * numberChars.length);
      otp += numberChars[randomIndex];
    }
    return otp;
  }
}
