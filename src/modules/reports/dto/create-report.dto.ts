import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsDateString,
} from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Loại báo cáo (Normal, Abnormal, Final)',
    example: 'Normal',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'ID của cuộc bầu cử liên quan',
    example: '651f0a7c1f2b4d1a12345678',
  })
  @IsString()
  @IsNotEmpty()
  electionId: string;

  @ApiPropertyOptional({
    description: 'Người phê duyệt báo cáo',
    example: '6903a0eda315db370563b13a',
  })
  @IsOptional()
  @IsString()
  reviewedBy: string;

  // @ApiProperty({
  //   description: 'Người ký số báo cáo ',
  //   example: '6903a0eda315db370563b13b',
  // })
  // @IsString()
  // @IsNotEmpty()
  // signedBy: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết nội dung báo cáo',
    example: 'Báo cáo kiểm tra kết quả bầu cử sau khi hoàn thành.',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn file báo cáo (PDF, DOCX...)',
    example: 'https://example.com/reports/final-report.pdf',
  })
  @IsString()
  @IsOptional()
  documentId: string;

  @ApiPropertyOptional({
    description: 'Trạng thái báo cáo',
    example: 'Pending / Reviewed / Resolved / Rejected',
  })
  @IsString()
  @IsOptional()
  status: string;

  @ApiPropertyOptional({
    description: 'Mức độ nghiêm trọng',
    example: 'low / medium / high',
  })
  @IsString()
  @IsOptional()
  severity: string;

  @ApiPropertyOptional({
    description: 'Tóm tắt ngắn gọn về báo cáo',
    example: 'Tổng hợp kết quả bầu cử lần 1, chưa có khiếu nại.',
  })
  @IsString()
  @IsOptional()
  summary: string;

  @ApiPropertyOptional({
    description: 'Ngày báo cáo được xem xét',
    example: '2025-10-31T08:30:00.000Z',
  })
  @IsOptional()
  reviewedAt: Date;
}
