import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { STATUS } from "src/common/enums/status.enum";

export class CreateMeetingDto {
    @ApiProperty({
        description: 'ID của cuộc bầu cử liên quan',
        example: '60c72b2f9b1e8d001c8e4f3a'
    })
    @IsNotEmpty()
    @IsString()
    electionId: string;

    @ApiProperty({
        description: 'Tiêu đề của cuộc họp',
        example: 'Cuộc họp chuẩn bị bầu cử'
    })
    @IsOptional()
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Ngày và giờ của cuộc họp',
        example: '2023-10-01T10:00:00Z'
    })
    @IsNotEmpty()
    meetingDate: Date;

    @ApiProperty({
        description: 'Địa điểm của cuộc họp',
        example: 'Phòng họp lớn, Tầng 2, Tòa nhà A'
    })
    @IsOptional()
    @IsString()
    location: string;

    @ApiProperty({
        description: 'Mô tả chi tiết về cuộc họp',
        example: 'Cuộc họp này sẽ thảo luận về các vấn đề liên quan đến cuộc bầu cử sắp tới.'
    })
    @IsOptional()
    @IsString()
    description: string;

    @ApiProperty({
        description: 'Trạng thái của cuộc họp',
        example: 'scheduled',
        enum: ['scheduled', 'ongoing', 'postponed'],
        default: 'scheduled'
    })
    @IsOptional()
    @IsEnum(STATUS)
    status: string; // Default value

}
