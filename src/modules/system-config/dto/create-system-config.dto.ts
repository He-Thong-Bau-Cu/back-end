import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSystemConfigDto {
  @ApiProperty({ description: 'Khóa cấu hình', example: 'SYSTEM_THEME' })
  @IsString()
  @IsNotEmpty()
  configKey: string;

  @ApiProperty({ description: 'Nhóm cấu hình', example: 'SYSTEM' })
  @IsString()
  @IsNotEmpty()
  groupType: string;

  @ApiPropertyOptional({
    description: 'Giá trị cấu hình (JSON hoặc chuỗi)',
    type: Object,
    example: { theme: 'dark' },
  })
  @IsOptional()
  configValue?: Record<string, any> | string;
}

