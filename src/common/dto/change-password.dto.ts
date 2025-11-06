import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'User ID',
    example: '60f7c0b5b4d1c826d8f0e6b1',
  })
  @IsString()
  @IsNotEmpty({ message: 'User ID không được để trống' })
  userId: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu cũ',
    example: 'oldPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu mới',
    example: 'newPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

