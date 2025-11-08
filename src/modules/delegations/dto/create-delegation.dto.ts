import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { UserDto } from "src/common/dto/user.dto";
import { DELEGATION_TYPE } from "src/common/enums/status.enum";

export class CreateDelegationDto {
    @ApiProperty({
        description:"Kiểu ủy quyền",
        example:"ELECTION"
    })
    @IsNotEmpty()
    @IsString()
    @IsEnum(DELEGATION_TYPE)
    delegationType:string

    @ApiProperty({
        description:"Id của cuộc bầu cử",
        example:"651f0a7c1f2b4d1a12345678"
    })
    @IsNotEmpty()
    @IsString()
    electionId:string

    @ApiProperty({
        description:"Id của người ủy quyền",
        example:"651f0a7c1f2b4d1a12345678"
    })
    @IsNotEmpty()
    @IsString()
    delegatorId:string

    @ApiProperty({
        description:"Id của người được ủy quyền",
        example:"651f0a7c1f2b4d1a12345678"
    })
    @IsNotEmpty()
    @IsString()
    delegateId:string

    @ApiPropertyOptional({
        description:"Ngày bắt đầu ủy quyền",
        example:"2025-10-31T00:00:00.000Z"
    })
    @IsOptional()
    @IsString()
    startDate:Date

    @ApiPropertyOptional({
        description:"Ngày kết thúc ủy quyền",
        example:"2025-10-31T00:00:00.000Z"
    })
    @IsOptional()
    @IsString()
    endDate:Date

    @ApiPropertyOptional({
        description:"Id của tài liệu ủy quyền",
        example:"651f0a7c1f2b4d1a12345678"
    })
    @IsOptional()
    @IsString()
    documentId:string

    @ApiPropertyOptional({
        description:"Lí do ủy quyền",
        example:"Vì có việc không thể tham gia nên tôi ..."
    })
    @IsOptional()
    @IsString()
   delegateReason: string;

   @ApiPropertyOptional({
    description:"chữ kí"
   })
   @IsOptional()
   @IsString()
   signature:string

   @ApiPropertyOptional({
    description:"Trạng thái"
   })
   @IsOptional()
   @IsString()
   status:string

   @ApiPropertyOptional({
    description:"Người xác nhận thông tin ủy quyền",
    example:"6903a0eda315db370563b136"
   })
   @IsOptional()
   @IsString()
   confirmedBy:string

   @ApiPropertyOptional({
    description:"Ngày xác nhận ủy quyền",
    example:"2025-10-30T18:25:26.703+00:00"
   })
   @IsOptional()
   @IsString()
   confirmedAt:Date

   @ApiPropertyOptional({
    description:"Thống tin người ủy quyền",
    example: {
      "fullName": "John Doe",
      "citizenId": "123456789",
      "email": "M9eGx@example.com",
      "phone": "1234567890",
      "address": "123 Main St, Anytown, USA",
    }
   })
   @IsOptional()
   @IsObject()
   delegateInfo: UserDto
}
