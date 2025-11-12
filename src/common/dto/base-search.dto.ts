// src/modules/elections/dto/search-elections.dto.ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseSearchDTO {
    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm chung',
        example: ''
    })
    @IsOptional()
    @IsString()
    keyword: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
