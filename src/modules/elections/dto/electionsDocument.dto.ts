import { IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseRequest } from 'src/common/dto/base-request.dto';

export class ElectionsDocumentDto extends BaseRequest {
  @ApiPropertyOptional({
    description: 'ID của kỳ bầu cử',
    example: '651f88e5c92b1f8c1a23b456',
  })
  @IsOptional()
  electionId: string;

  @ApiPropertyOptional({
    description: 'Tiêu đề tài liệu',
    example: 'Điều lệ công ty 2025',
  })
  @IsOptional()
  title: string;

  @ApiPropertyOptional({
    description: 'Nội dung tài liệu',
    example: 'Nội dung chi tiết tài liệu bầu cử...',
  })
  @IsOptional()
  content: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn file tài liệu',
    example: 'https://storage.company.com/docs/rules.pdf',
  })
  @IsOptional()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Trạng thái tài liệu',
    example: 'active',
  })
  @IsOptional()
  status: string;

  @ApiPropertyOptional({
    description: 'Ngày tạo tài liệu',
    example: '2025-09-30T08:00:00Z',
  })
  @IsOptional()
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Ngày cập nhật tài liệu',
    example: '2025-09-30T09:30:00Z',
  })
  @IsOptional()
  updatedAt: Date;
}
