import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BaseSearchDTO } from "src/common/dto/base-search.dto";

export class CreateVotingMethodDto extends BaseSearchDTO {
    @ApiProperty({
        description: "Tên của phương thức bầu cử",
        example: "Phương thức bầu cử đơn lẻ"
    })
    @IsNotEmpty()
    @IsString()
    methodName: string;

    @ApiProperty({
        description: "Mã của phương thức bầu cử",
        example: "DON_LE"
    })
    @IsNotEmpty()
    @IsString()
    methodCode: string;

    @ApiPropertyOptional({
        description: "Mô tả của phương thức bầu cử",
        example: "Mỗi cử tri chọn 1 lựa chọn duy nhất"
    })
    @IsOptional()
    @IsString()
    description: string;

    @ApiPropertyOptional({
        description: "Trạng thái của phương thức bầu cử",
        example: "ACTIVE"
    })
    @IsOptional()
    @IsString()
    status: string;
}
