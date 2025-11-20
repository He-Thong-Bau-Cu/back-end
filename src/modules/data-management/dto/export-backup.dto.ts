import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ExportBackupQueryDto {
  @ApiPropertyOptional({ description: 'Tên bảng cần xuất', example: 'users' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: 'Hành động cần xuất', example: 'IMPORT' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({
    description: 'Ngày bắt đầu',
    example: '2024-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc',
    example: '2024-12-31',
  })
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;

  @ApiPropertyOptional({
    description: 'Định dạng file xuất',
    enum: ['csv', 'json'],
    default: 'csv',
  })
  @IsOptional()
  @IsIn(['csv', 'json'])
  format?: 'csv' | 'json' = 'csv';
}

