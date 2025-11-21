import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';
import { SearchDTO } from 'src/common/dto/search.dto';

export class SearchBackupDto extends SearchDTO {
  @ApiPropertyOptional({ description: 'Tên bảng cần tìm kiếm', example: 'users' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: 'Hành động đã thực hiện', example: 'IMPORT' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'ID bản ghi tham chiếu', example: '123' })
  @IsOptional()
  @IsNumberString()
  recordId?: string;

  @ApiPropertyOptional({ description: 'Người thực hiện', example: 'Nguyễn Văn A' })
  @IsOptional()
  @IsString()
  actionBy?: string;
}

