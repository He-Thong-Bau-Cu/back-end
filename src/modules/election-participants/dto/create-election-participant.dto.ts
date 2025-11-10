import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateElectionParticipantDto {
    @ApiProperty({
        description: 'ID của cuộc bầu cử', example: '60f7c0c2b4d1c826d8f0e6b1'
    })
    @IsNotEmpty()
    @IsString()
    electionId: string;

    @ApiProperty({
        description: 'ID của người tham gia', example: '60f7c0c2b4d1c826d8f0e6b2'
    })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({
        description: 'ID của vai trò', example: '60f7c0c2b4d1c826d8f0e6b3'
    })
    @IsNotEmpty()
    @IsString()
    roleId: string;

    @ApiProperty({
        description: 'Vị trí của người tham gia trong cuộc bầu cử', example: 'Ứng viên'
    })
    @IsNotEmpty()
    @IsString()
    position: string;

    @ApiPropertyOptional({
        description: 'trạng thái của người tham gia cuộc bầu cử',
        example: 'PENDING'
    })
    @IsOptional()
    @IsString()
    status: string;

}
