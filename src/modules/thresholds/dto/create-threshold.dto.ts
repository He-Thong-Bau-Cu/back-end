import { ApiParam, ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateThresholdDto {
    @ApiProperty({
        description: "Tên của ngưỡng thông qua",
        example: "Phần trăm"
    })
    @IsString()
    @IsNotEmpty()
    thresholdName: string;

    @ApiProperty({
        description: "Mã của ngưỡng thông qua",
        example: "PERCENT"
    })
    @IsString()
    @IsNotEmpty()
    thresholdCode: string;

    @ApiProperty({
        description: "Loại ngưỡng thông qua",
        example: "PERCENT"
    })
    @IsString()
    @IsNotEmpty()
    thresholdType: string;

    @ApiProperty({
        description: "Giá trị ngưỡng thông qua",
        example: "50"
    })
    @IsNumber()
    @IsNotEmpty()
    value: number;

    @ApiPropertyOptional({
        description: "Mô tả ngưỡng thông qua",
        example: "Ngưỡng thông qua là phần trăm"
    })
    @IsString()
    @IsOptional()
    description: string;

    @ApiPropertyOptional({
        description: "Trạng thái ngưỡng thông qua",
        example: "ACTIVE"
    })
    @IsString()
    @IsOptional()
    status: string;
}
