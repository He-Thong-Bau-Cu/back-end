import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseRequest } from 'src/common/dto/base-request.dto';

export class ElectionsDto extends BaseRequest {
  @ApiPropertyOptional({
    description: 'Tên kỳ bầu cử',
    example: 'Đại hội đồng cổ đông 2025',
  })
  @IsOptional()
  title: string;

  @ApiPropertyOptional({
    description: 'Loại kỳ bầu cử',
    example: 'Annual Meeting',
  })
  @IsOptional()
  type: string;

  @ApiPropertyOptional({
    description: 'Hình thức bỏ phiếu',
    example: 'Electronic',
  })
  @IsOptional()
  votingMethod: string;

  @ApiPropertyOptional({
    description: 'Ngày bắt đầu',
    example: '2025-10-15T08:00:00Z',
  })
  @IsOptional()
  startDate: Date;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc',
    example: '2025-10-15T12:00:00Z',
  })
  @IsOptional()
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Trạng thái kỳ bầu cử',
    example: 'active',
  })
  @IsOptional()
  status: string;

  @ApiPropertyOptional({
    description: 'Loại hình công ty',
    example: 'Joint-stock',
  })
  @IsOptional()
  companyType: string;
}
