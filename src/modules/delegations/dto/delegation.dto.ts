import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { UserDto } from "src/common/dto/user.dto";
import { DELEGATION_TYPE } from "src/common/enums/status.enum";

export class DelegationDto {
    @ApiProperty({
        description:"Id của thư kí",
        example:"651f0a7c1f2b4d1a12345678"
    })
    @IsOptional()
    secretaryId:string

    @ApiProperty({
        description:"Id của cuộc bầu cử",
        example:"651f0a7c1f2b4d1a12345678"
    })
    @IsOptional()
    electionId:string

    @ApiProperty({
        description:"Người duyệt kí",
        example:"Chủ tịch"
    })
    @IsOptional()
    recipient: string
}
