import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";


export class CreateVotingRightDto {
    @ApiProperty({
        description: 'ID của cuộc bầu cử',
        example: '60d21b4667d0d8992e610c85',
    })
    @IsNotEmpty()
    @IsString()
    electionId: string;

    @ApiProperty({
        description: 'ID của cử tri',
        example: '60d21b4967d0d8992e610c86',
    })
    @IsNotEmpty()
    @IsString()
    voterId: string;

    @ApiProperty({
        description: 'Số cổ phần',
        example: 100,
    })
    @IsNotEmpty()
    shares: number;

    @ApiProperty({
        description: 'Số phiếu bầu',
        example: 10,
    })
    @IsNotEmpty()
    votes: number;

    @ApiPropertyOptional({
        description: 'Trạng thái quyền bầu cử',
        example: 'active',
    })
    @IsString()
    @IsOptional()
    status: string;
    
}
