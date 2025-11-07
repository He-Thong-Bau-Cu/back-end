import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { LoginDto } from 'src/common/dto/login.dto';
import { MESSAGE_STATUS } from 'src/common/enums/status.enum';
import { ENDPOINT, METHOD } from 'src/common/enums/method.enum';
import { TwoFADTO } from 'src/common/dto/twoFa.dto';
import { ForwardPasswordDto } from 'src/common/dto/forward-password.dto';
import { ChangePasswordDto } from 'src/common/dto/change-password.dto';
import { SendOtpDto } from 'src/common/dto/send-otp.dto';
import { VerifyOtpDto } from 'src/common/dto/verify-otp.dto';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.LOGIN_SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.LOGIN}`)
  async login(@Body() req: LoginDto) {
    try {
      const resData = await this.authService.login(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.LOGIN_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Cài đặt 2FA tạo qr code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.TWOFA}/${METHOD.SETUP}`)
  async setupTwoFA(@Body() req: TwoFADTO) {
    try {
      const resData = await this.authService.generateTwoFaSecret(req.userId);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Xác thực 2FA tạo qr code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.TWOFA}/${METHOD.VERIFIED}`)
  async verifyTwoFA(@Body() req: TwoFADTO) {
    try {
      const resData = await this.authService.verify2FASetup(req.userId, req.token);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Xác thực 2FA login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.TWOFA}/${ENDPOINT.LOGIN}`)
  async verifyTwoFALogin(@Body() req: TwoFADTO) {
    try {
      const resData = await this.authService.verifyLogin2FA(req.userId, req.token);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Gửi mã OTP qua email' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post('send-otp')
  async sendOtp(@Body() req: SendOtpDto) {
    try {
      const resData = await this.authService.sendOtp(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Xác thực mã OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post('verify-otp')
  async verifyOtp(@Body() req: VerifyOtpDto) {
    try {
      const resData = await this.authService.verifyOtp(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Gửi mật khẩu mới qua email (yêu cầu OTP đã được verify)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post('forward-password')
  async forwardPassword(@Body() req: ForwardPasswordDto) {
    try {
      const resData = await this.authService.forwardPassword(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Đổi mật khẩu' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post('change-password')
  async changePassword(@Body() req: ChangePasswordDto) {
    try {
      const resData = await this.authService.changePassword(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
