import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE_STATUS } from 'src/common/enums/status.enum';
import { LoginDto } from 'src/common/dto/login.dto';
import { TwoFADTO } from 'src/common/dto/twoFa.dto';
import { SendOtpDto } from 'src/common/dto/send-otp.dto';
import { VerifyOtpDto } from 'src/common/dto/verify-otp.dto';
import { ForwardPasswordDto } from 'src/common/dto/forward-password.dto';
import { ChangePasswordDto } from 'src/common/dto/change-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService: jest.Mocked<AuthService> = {
    login: jest.fn(),
    generateTwoFaSecret: jest.fn(),
    verify2FASetup: jest.fn(),
    verifyLogin2FA: jest.fn(),
    sendOtp: jest.fn(),
    verifyOtp: jest.fn(),
    forwardPassword: jest.fn(),
    changePassword: jest.fn()
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ]
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jest.clearAllMocks();
  });

  // ======================================================================
  // LOGIN
  // ======================================================================
  it('should login successfully', async () => {
    const dto: LoginDto = { username: 'test', password: '123456' } as any;
  
    const serviceRes = {
      accessToken: 'jwt-token',
      requireTwoFa: false,
      isSetting: false,
      userId: 'u1',
    };
  
    authService.login.mockResolvedValue(serviceRes as any);
  
    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({
        data: serviceRes,
        status: HttpStatus.OK,
        message: MESSAGE_STATUS.LOGIN_SUCCESS,
      } as any);
  
    const res = await controller.login(dto);
  
    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(spy).toHaveBeenCalledWith(
      serviceRes,
      MESSAGE_STATUS.LOGIN_SUCCESS,
      HttpStatus.OK
    );
    expect(res).toEqual({
      data: serviceRes,
      status: HttpStatus.OK,
      message: MESSAGE_STATUS.LOGIN_SUCCESS,
    });
  
    spy.mockRestore();
  });
  

  it('should throw HttpException on login error', async () => {
    const dto: LoginDto = { username: 'test', password: 'wrong' } as any;
    const error = { message: 'Invalid credentials', status: HttpStatus.UNAUTHORIZED };
    authService.login.mockRejectedValue(error);

    await expect(controller.login(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.login(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // 2FA SETUP
  // ======================================================================
  it('should setup 2FA successfully', async () => {
    const dto: TwoFADTO = { userId: 'u1', token: '' } as any;
    const serviceRes = { otpauthUrl: 'otpauth://...', secret: 'SECRET' };
    authService.generateTwoFaSecret.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.setupTwoFA(dto);

    expect(authService.generateTwoFaSecret).toHaveBeenCalledWith(dto.userId);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on setupTwoFA error', async () => {
    const dto: TwoFADTO = { userId: 'u1', token: '' } as any;
    const error = { message: 'User not found', status: HttpStatus.NOT_FOUND };
    authService.generateTwoFaSecret.mockRejectedValue(error);

    await expect(controller.setupTwoFA(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.setupTwoFA(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // 2FA VERIFY SETUP
  // ======================================================================
  it('should verify 2FA setup successfully', async () => {
    const dto: TwoFADTO = { userId: 'u1', token: '123456' } as any;
    const serviceRes = { verified: true };
    authService.verify2FASetup.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.verifyTwoFA(dto);

    expect(authService.verify2FASetup).toHaveBeenCalledWith(dto.userId, dto.token);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on verifyTwoFA error', async () => {
    const dto: TwoFADTO = { userId: 'u1', token: 'wrong' } as any;
    const error = { message: 'Invalid token', status: HttpStatus.BAD_REQUEST };
    authService.verify2FASetup.mockRejectedValue(error);

    await expect(controller.verifyTwoFA(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.verifyTwoFA(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // 2FA VERIFY LOGIN
  // ======================================================================
  it('should verify 2FA login successfully', async () => {
    const dto: TwoFADTO = { userId: 'u1', token: '123456' } as any;
    const serviceRes = { token: 'jwt-token' };
    authService.verifyLogin2FA.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.verifyTwoFALogin(dto);

    expect(authService.verifyLogin2FA).toHaveBeenCalledWith(dto.userId, dto.token);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on verifyTwoFALogin error', async () => {
    const dto: TwoFADTO = { userId: 'u1', token: 'wrong' } as any;
    const error = { message: 'Invalid token', status: HttpStatus.UNAUTHORIZED };
    authService.verifyLogin2FA.mockRejectedValue(error);

    await expect(controller.verifyTwoFALogin(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.verifyTwoFALogin(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // SEND OTP
  // ======================================================================
  it('should send OTP successfully', async () => {
    const dto: SendOtpDto = { email: 'test@example.com' } as any;
    const serviceRes = { success: true };
    authService.sendOtp.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.sendOtp(dto);

    expect(authService.sendOtp).toHaveBeenCalledWith(dto);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on sendOtp error', async () => {
    const dto: SendOtpDto = { email: 'test@example.com' } as any;
    const error = { message: 'Mail error', status: HttpStatus.INTERNAL_SERVER_ERROR };
    authService.sendOtp.mockRejectedValue(error);

    await expect(controller.sendOtp(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.sendOtp(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // VERIFY OTP
  // ======================================================================
  it('should verify OTP successfully', async () => {
    const dto: VerifyOtpDto = { email: 'test@example.com', otp: '123456' } as any;
    const serviceRes = { verified: true };
    authService.verifyOtp.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.verifyOtp(dto);

    expect(authService.verifyOtp).toHaveBeenCalledWith(dto);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on verifyOtp error', async () => {
    const dto: VerifyOtpDto = { email: 'test@example.com', otp: '000000' } as any;
    const error = { message: 'Invalid OTP', status: HttpStatus.BAD_REQUEST };
    authService.verifyOtp.mockRejectedValue(error);

    await expect(controller.verifyOtp(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.verifyOtp(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // FORWARD PASSWORD
  // ======================================================================
  it('should forward password successfully', async () => {
    const dto: ForwardPasswordDto = { email: 'test@example.com' } as any;
    const serviceRes = { sent: true };
    authService.forwardPassword.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.forwardPassword(dto);

    expect(authService.forwardPassword).toHaveBeenCalledWith(dto);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on forwardPassword error', async () => {
    const dto: ForwardPasswordDto = { email: 'test@example.com' } as any;
    const error = { message: 'OTP not verified', status: HttpStatus.FORBIDDEN };
    authService.forwardPassword.mockRejectedValue(error);

    await expect(controller.forwardPassword(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.forwardPassword(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });

  // ======================================================================
  // CHANGE PASSWORD
  // ======================================================================
  it('should change password successfully', async () => {
    const dto: ChangePasswordDto = {
      userId: 'u1',
      oldPassword: '123456',
      newPassword: '654321'
    } as any;
    const serviceRes = { changed: true };
    authService.changePassword.mockResolvedValue(serviceRes as any);

    const spy = jest
      .spyOn(BaseResponse, 'success')
      .mockReturnValue({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS } as any);

    const res = await controller.changePassword(dto);

    expect(authService.changePassword).toHaveBeenCalledWith(dto);
    expect(spy).toHaveBeenCalledWith(serviceRes, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    expect(res).toEqual({ data: serviceRes, status: HttpStatus.OK, message: MESSAGE_STATUS.SUCCESS });

    spy.mockRestore();
  });

  it('should throw HttpException on changePassword error', async () => {
    const dto: ChangePasswordDto = {
      userId: 'u1',
      oldPassword: 'wrong',
      newPassword: '654321'
    } as any;
    const error = { message: 'Old password is incorrect', status: HttpStatus.BAD_REQUEST };
    authService.changePassword.mockRejectedValue(error);

    await expect(controller.changePassword(dto)).rejects.toBeInstanceOf(HttpException);

    try {
      await controller.changePassword(dto);
    } catch (err: any) {
      expect(err.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(err.getResponse()).toEqual({ message: error.message });
    }
  });
});
