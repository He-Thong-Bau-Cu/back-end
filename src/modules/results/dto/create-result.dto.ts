import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";
import Api from "twilio/lib/rest/Api";

export class CreateResultDto {
    @ApiProperty({
        description: "ID của cuộc bầu cử",
        example: "60d21b4667d0d8992e610c85"
    })
    @IsNotEmpty()
    @IsString()
    electionId: string

    @ApiProperty({
        description: "ID của ứng viên ứng cử",
        example: "60d21b4667d0d8992e610c86"
    })
    @IsNotEmpty()
    @IsString()
    entityId: string

    @ApiProperty({
        description: "số vote ứng viên nhận được",
        example: "50000"
    })
    @IsNotEmpty()
    @IsNumber()
    votesCount: number

    @ApiProperty({
        description: "Đây có phải là bản kết quả final chưa?",
        example: "true"
    })
    @IsNotEmpty()
    @IsBoolean()
    isFinal: boolean


}
