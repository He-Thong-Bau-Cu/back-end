import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { UserDto } from "src/common/dto/user.dto";
import { STATUS } from "src/common/enums/status.enum";


export class CreateVoterInvitationDto {

    @ApiProperty({
        description: 'ID của người bỏ phiếu',
        example: '60d21b4667d0d8992e610c85'
    })
    @IsNotEmpty()
    @IsString()
    voterId: string;

    @ApiProperty({
        description: 'ID của cuộc bầu cử',
        example: '60d21b4667d0d8992e610c85'
    })
    @IsNotEmpty()
    @IsString()
    electionId: string;

    @ApiPropertyOptional({
        description: 'Trạng thái của lời mời',
        example: 'pending'
    })
    @IsEnum(STATUS)
    @IsOptional()
    @IsString()
    status: string;




}
