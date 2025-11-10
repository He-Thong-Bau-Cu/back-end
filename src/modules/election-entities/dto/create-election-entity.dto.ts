import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";


export class CreateElectionEntityDto {
    @ApiProperty({
        description: 'ID của kỳ bầu cử',
        example: '60f7c0c8b4d1c826d8f0e6b1'
    })
    @IsNotEmpty()
    @IsString()
    electionId: string;

    @ApiProperty({
        description: 'Loại kỳ bầu cử',
        example: '60f7c0c8b4d1c826d8f0e6b2'
    })
    @IsNotEmpty()
    @IsString()
    electionTypeId: string;

    @ApiProperty({
        description: 'Tiêu đề của kỳ bầu cử',
        example: 'Presidential Election 2024'
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiPropertyOptional({
        description: 'Mô tả về kỳ bầu cử',
        example: 'This election is to choose the next president.'
    })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Dữ liệu meta bổ sung dưới dạng đối tượng JSON',
        example: { name: "Nguyễn Văn A", age: 38 }
    })
    @IsNotEmpty()
    @IsObject()
    metaData: Record<string, any>;

    @ApiPropertyOptional({
        description: 'URL của tệp liên quan đến kỳ bầu cử',
        example: 'https://example.com/election-documents/presidential-election-2024.pdf'
    })
    @IsString()
    @IsOptional()
    fileUrl: string;

    @ApiPropertyOptional({
        description: 'ID của người đề xuất kỳ bầu cử',
        example: '60f7c0c8b4d1c826d8f0e6b3'
    })
    @IsOptional()
    @IsString()
    proposerId: string;

    @ApiPropertyOptional({
        description: 'Trạng thái của kỳ bầu cử',
        example: 'pending'
    })
    @IsOptional()
    @IsString()
    status: string;
}
