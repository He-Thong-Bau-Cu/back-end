import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateVoterDto {
        @ApiProperty({ 
        description: 'ID của cuộc bầu cử', 
        example: '60d21b4667d0d8992e610c85' })
    @IsNotEmpty()
    @IsString()
    electionId: string;

    @ApiProperty({ 
        description: 'ID của người dùng được mời', 
        example: '60d21b4667d0d8992e610c85' })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({ 
        description: 'Người dùng có đủ điều kiện tham gia bầu cử hay không', 
        example: true })
    @IsNotEmpty()
    eligible: boolean;

    @ApiPropertyOptional({ 
        description: 'Trạng thái của lời mời', 
        example: 'pending' })   
    @IsOptional()
    @IsString()
    status: string;
}
