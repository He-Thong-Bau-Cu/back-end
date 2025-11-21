import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

export class SystemReportQueryDto {
  @ApiPropertyOptional({ description: 'Ngày bắt đầu', example: '2024-01-01' })
  @IsOptional()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ description: 'Ngày kết thúc', example: '2024-12-31' })
  @IsOptional()
  @Type(() => Date)
  toDate?: Date;

  @ApiPropertyOptional({
    description: 'Khoảng thống kê',
    enum: ['day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  interval?: 'day' | 'week' | 'month' = 'day';

  @ApiPropertyOptional({
    description: 'Định dạng export (chỉ dùng cho export API)',
    enum: ['json', 'csv'],
    default: 'json',
  })
  @IsOptional()
  @IsIn(['json', 'csv'])
  format?: 'json' | 'csv' = 'json';
}

