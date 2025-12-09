import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ParticipantDto {
    @ApiProperty({
        description: 'ID của người dùng',
        example: '60f7c0c2b4d1c826d8f0e6b2',
    })
    @IsNotEmpty()
    @IsString()
    userId: string;

    @ApiProperty({
        description: 'ID của vai trò',
        example: '60f7c0c2b4d1c826d8f0e6b3',
    })
    @IsNotEmpty()
    @IsString()
    roleId: string;

    @ApiProperty({
        description: 'Vị trí của người tham gia',
        example: 'Thư ký chủ tọa',
    })
    @IsNotEmpty()
    @IsString()
    position: string;
}

export class CreateElectionRequestDto {
    @ApiProperty({
        description: 'Tiêu đề cuộc bầu cử',
        example: 'Bầu chọn dự án xuất sắc năm 2025',
    })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Số quyết định ban hành cuộc bầu cử',
        example: 'QĐ-123/2025',
    })
    @IsNotEmpty()
    @IsString()
    decisionNumber: string;

    @ApiProperty({
        description: 'Tên quyết định ban hành cuộc bầu cử',
        example: 'Quyết định tổ chức bầu chọn dự án tiêu biểu',
    })
    @IsNotEmpty()
    @IsString()
    decisionName: string;

    @ApiPropertyOptional({
        description: 'Ngày bắt đầu cuộc bầu cử',
        example: '2025-12-01',
    })
    @IsOptional()
    startDate?: Date;

    @ApiPropertyOptional({
        description: 'Ngày kết thúc cuộc bầu cử',
        example: '2025-12-10',
    })
    @IsOptional()
    endDate?: Date;

    @ApiProperty({
        description: 'Danh sách thành viên tổ chức (thư ký, chủ tọa)',
        type: [ParticipantDto],
    })
    @IsNotEmpty()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ParticipantDto)
    participants: ParticipantDto[];
}

