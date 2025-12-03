import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notification/notification.service';
import { STATUS } from 'src/common/enums/status.enum';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

/* =====================================================
   FIX 1: MOCK encryption utils để tránh IV error
===================================================== */
jest.mock('../../common/utils/encryption', () => ({
  decryptString: jest.fn().mockReturnValue('BASE32SECRET'),
  encryptString: jest.fn().mockReturnValue('ENCRYPTED'),
}));

jest.mock('bcrypt');
jest.mock('speakeasy');
jest.mock('qrcode');

/* =====================================================
   MOCK MODELS
===================================================== */
const mockUserModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
};

const mockRoleModel = {
  findById: jest.fn(),
  findOne: jest.fn(),
};

const mockRolePermissionModel = {
  find: jest.fn(),
};

const mockPermissionModel = {
  find: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockMailService = {
  sendOtpMail: jest.fn(),
  sendPasswordResetMail: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('keysecret123'),
};

const mockNotification = {
  notifyUser: jest.fn(),
};

const oid = () => '65ab12cd34ef56ab78cd90ef';

/* =====================================================
                     TEST SUITE
===================================================== */
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken('Users'), useValue: mockUserModel },
        { provide: getModelToken('Roles'), useValue: mockRoleModel },
        { provide: getModelToken('RolePermissions'), useValue: mockRolePermissionModel },
        { provide: getModelToken('Permissions'), useValue: mockPermissionModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  /* =====================================================
                       LOGIN
  ====================================================== */
  describe('login', () => {
    it('should login successfully (no 2FA)', async () => {
      jest.spyOn(service as any, 'sendNotificationToAdmin').mockResolvedValue(null);

      const dto = { username: 'test', password: '123456' };

      const user = {
        _id: oid(),
        username: 'test',
        fullName: 'Test User',
        password: 'hashed',
        roleId: oid(),
        status: STATUS.ACTIVE,
        isTwoFaEnabled: false,
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: oid(), status: STATUS.ACTIVE, roleCode: 'ADMIN' }),
      });

      mockRolePermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ permissionIds: [oid()] }]),
      });

      mockPermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ url: '/dashboard', status: STATUS.ACTIVE }]),
      });

      mockJwtService.sign.mockReturnValue('jwt-token');

      const res = await service.login(dto);

      expect(res).toEqual({ accessToken: 'jwt-token' });
    });

    it('should return requireTwoFa = true', async () => {
      const user = {
        _id: oid(),
        username: 'test',
        password: 'hashed',
        status: STATUS.ACTIVE,
        isTwoFaEnabled: true,
        twoFaSecret: 'ENCRYPTED_DATA',
        roleId: oid(),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: oid(), status: STATUS.ACTIVE }),
      });

      const res = await service.login({ username: 'test', password: '123456' });

      expect(res.requireTwoFa).toBe(true);
      expect(res.userId).toBe(user._id);
    });

    it('should throw error when user not found', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.login({ username: 'x', password: '1' })).rejects.toThrow(
        'Tài khoản không tồn tại!',
      );
    });
  });

  /* =====================================================
             generateTwoFaSecret
  ====================================================== */
  describe('generateTwoFaSecret', () => {
    it('should generate new 2FA secret', async () => {
      const user = {
        _id: oid(),
        email: 'a@a.com',
        twoFaSecret: null,
        save: jest.fn(),
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      (speakeasy.generateSecret as jest.Mock).mockReturnValue({
        base32: 'BASE32SECRET',
        otpauth_url: 'otpauth://test',
      });

      (qrcode.toDataURL as jest.Mock).mockResolvedValue('qrcode-data');

      const res = await service.generateTwoFaSecret(oid());

      expect(res.qrCode).toBe('qrcode-data');
    });
  });

  /* =====================================================
                verify2FASetup
  ====================================================== */
  describe('verify2FASetup', () => {
    it('should verify 2FA setup', async () => {
      const user = { _id: oid(), twoFaSecret: 'ENCRYPTED', save: jest.fn() };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);

      const res = await service.verify2FASetup(user._id, '123456');

      expect(res.success).toBe(true);
      expect(user.save).toHaveBeenCalled();
    });
  });

  /* =====================================================
                verifyLogin2FA
  ====================================================== */
  describe('verifyLogin2FA', () => {
    it('should verify login 2FA and return token', async () => {
      jest.spyOn(service as any, 'sendNotificationToAdmin').mockResolvedValue(null);

      const user = {
        _id: oid(),
        username: 'test',
        fullName: 'A',
        roleId: oid(),
        twoFaSecret: 'ENCRYPTED',
      };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockRoleModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: oid(),
          roleCode: 'ADMIN',
          status: STATUS.ACTIVE,
        }),
      });

      mockRolePermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ permissionIds: [oid()] }]),
      });

      mockPermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ url: '/x', status: STATUS.ACTIVE }]),
      });

      (speakeasy.totp.verify as jest.Mock).mockReturnValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const res = await service.verifyLogin2FA(user._id, '123456');

      expect(res.accessToken).toBe('jwt-token');
    });
  });

  /* =====================================================
                    sendOtp
  ====================================================== */
  describe('sendOtp', () => {
    it('should send OTP successfully', async () => {
      const user = { email: 'a@a.com', fullName: 'A', status: STATUS.ACTIVE };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockRedis.set.mockResolvedValue(true);
      mockMailService.sendOtpMail.mockResolvedValue(true);

      const res = await service.sendOtp({ email: 'a@a.com' });

      expect(res.message).toBe('Mã OTP đã được gửi đến email của bạn!');
      expect(mockMailService.sendOtpMail).toHaveBeenCalled();
    });
  });

  /* =====================================================
                    verifyOtp
  ====================================================== */
  describe('verifyOtp', () => {
    it('should verify OTP successfully', async () => {
      const user = { email: 'a@a.com', fullName: 'A', status: STATUS.ACTIVE };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockRedis.get.mockResolvedValue('123456');
      mockRedis.set.mockResolvedValue(true);
      mockRedis.del.mockResolvedValue(true);

      const res = await service.verifyOtp({ email: 'a@a.com', otp: '123456' });

      expect(res.verified).toBe(true);
    });
  });

  /* =====================================================
                forwardPassword
  ====================================================== */
  describe('forwardPassword', () => {
    it('should generate new password and send mail', async () => {
      const user = {
        email: 'a@a.com',
        username: 'test',
        fullName: 'A',
        status: STATUS.ACTIVE,
        save: jest.fn(),
      };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(user),
      });

      mockRedis.get.mockResolvedValue('true');
      mockRedis.del.mockResolvedValue(true);

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const res = await service.forwardPassword({ email: 'a@a.com' });

      expect(res.message).toBe('Mật khẩu mới đã được gửi đến email của bạn!');
      expect(mockMailService.sendPasswordResetMail).toHaveBeenCalled();
    });
  });

  /* =====================================================
                changePassword
  ====================================================== */
  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = {
        _id: oid(),
        email: 'a@a.com',
        status: STATUS.ACTIVE,
        password: 'oldhash',
        save: jest.fn(),
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(user),
        }),
      });

      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true) // old pass ok
        .mockResolvedValueOnce(false); // new pass not same

      (bcrypt.hash as jest.Mock).mockResolvedValue('newhash');

      const res = await service.changePassword({
        userId: user._id,
        oldPassword: '123',
        newPassword: '456',
      });

      expect(res.message).toBe('Đổi mật khẩu thành công!');
      expect(user.save).toHaveBeenCalled();
    });
  });

  /* =====================================================
            sendNotificationToAdmin
  ====================================================== */
  describe('sendNotificationToAdmin', () => {
    it('should notify all admins', async () => {
      const adminRole = { _id: oid() };
      const users = [{ _id: oid() }, { _id: oid() }];

      mockRoleModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(adminRole),
      });

      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(users),
      });

      await service.sendNotificationToAdmin('Hello');

      expect(mockNotification.notifyUser).toHaveBeenCalledTimes(2);
    });
  });
});
