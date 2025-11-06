import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({
    description: 'Username',
    example: 'namlp',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu',
    example: 'khongnoi123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
