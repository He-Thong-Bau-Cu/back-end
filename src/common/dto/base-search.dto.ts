// src/modules/elections/dto/search-elections.dto.ts
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class BaseSearchDTO {
    @IsOptional()
    @IsString()
    keyword?: string;

    // @IsOptional()
    // @IsString()
    // status?: string;

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
