import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiPropertyOptional({
    description: 'Email của người dùng',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiPropertyOptional({
    description: 'Mã OTP (6 chữ số)',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({ message: 'OTP không được để trống' })
  @Length(6, 6, { message: 'OTP phải có đúng 6 chữ số' })
  otp: string;
}

