import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ImportBackupDto {
  @ApiProperty({ description: 'Tên bảng được quản lý dữ liệu', example: 'users' })
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @ApiPropertyOptional({ description: 'Tên hành động', example: 'IMPORT' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'ID bản ghi tham chiếu', example: 123 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recordId?: number;

  @ApiPropertyOptional({
    description: 'Dữ liệu trước khi thao tác (JSON)',
    type: Object,
    example: { before: 'data' },
  })
  @IsOptional()
  dataBefore?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Dữ liệu sau khi thao tác (JSON)',
    type: Object,
    example: { after: 'data' },
  })
  @IsOptional()
  dataAfter?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Ghi chú bổ sung', example: 'Nhập dữ liệu cử tri quý 4' })
  @IsOptional()
  @IsString()
  note?: string;
}

