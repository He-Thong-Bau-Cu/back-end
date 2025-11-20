import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { SearchDTO } from 'src/common/dto/search.dto';

export class SearchSystemConfigDto extends SearchDTO {
  @ApiPropertyOptional({ description: 'Từ khóa tìm kiếm theo configKey' })
  @IsOptional()
  @IsString()
  configKey?: string;

  @ApiPropertyOptional({ description: 'Nhóm cấu hình cần lọc', example: 'SYSTEM' })
  @IsOptional()
  @IsString()
  groupType?: string;
}

