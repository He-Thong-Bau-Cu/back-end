import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateElectionTypeDto {

    @ApiProperty({
        description: "tên kiểu bầu cử",
        example: "bầu tổng giám đốc"
    })
    @IsNotEmpty()
    @IsString()
    typeName: string;

    @ApiProperty({
        description: "Mã kiểu bầu cử",
        example: "PERSON"
    })
    @IsNotEmpty()
    @IsString()
    typeCode: string;


    @ApiPropertyOptional({
        description: "mô tả kiểu bầu cử",
        example: "bầu ra người được chọn làm tổng giám đốc chi nhánh"
    })
    @IsOptional()
    @IsString()
    description: string;

    @ApiPropertyOptional({
        description: "trạng thái của kiểu bầu cử",
        example: "ACTIVE"
    })
    @IsOptional()
    @IsString()
    status: string;
}
