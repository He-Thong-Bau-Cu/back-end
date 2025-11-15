import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsDateString,
    IsOptional,
    IsEnum,
} from 'class-validator';
import { STATUS } from 'src/common/enums/status.enum';

export class CreateElectionDto {
    @ApiProperty({
        description: 'Tiêu đề cuộc bầu cử',
        example: 'Bầu chọn dự án xuất sắc năm 2025',
    })
    // @IsNotEmpty()
    @IsString()
    title: string;

    // @ApiPropertyOptional({
    //     description: 'ID của loại cuộc bầu cử (Election Type)',
    //     example: '64c5b4a8a95f1e2b40b85e91',
    // })
    // @IsNotEmpty()
    @IsString()
    @IsOptional()
    typeId: string;

    // @ApiPropertyOptional({
    //     description: 'ID của phương thức bỏ phiếu (Voting Method)',
    //     example: '64c5b4a8a95f1e2b40b85e92',
    // })
    // @IsNotEmpty()
    @IsString()
    @IsOptional()
    votingMethodId?: string;

    // @ApiPropertyOptional({
    //     description: 'ID của ngưỡng hợp lệ (Threshold)',
    //     example: '64c5b4a8a95f1e2b40b85e93',
    // })
    // @IsNotEmpty()
    @IsString()
    @IsOptional()
    thresholdId?: string;

    // @ApiPropertyOptional({
    //     description: 'Ngày bắt đầu cuộc bầu cử',
    //     example: '2025-12-01',
    // })
    // @IsNotEmpty()
    @IsOptional()
    startDate?: Date;

    // @ApiPropertyOptional({
    //     description: 'Ngày kết thúc cuộc bầu cử',
    //     example: '2025-12-10',
    // })
    // @IsNotEmpty()
    @IsOptional()
    endDate?: Date;

    @IsOptional()
    timeline?: {
        checkinAt?: Date;
        reportAt?: Date;
        votingAt?: Date;
        resultAnnouncedAt?: Date;
        closingAt?: Date;
    };

    // @ApiPropertyOptional({
    //     description: 'Thời gian bắt đầu ủy quyền bỏ phiếu',
    //     example: '2025-11-25T00:00:00.000Z',
    // })
    // @IsNotEmpty()
    @IsOptional()
    delegationStart?: Date;

    // @ApiPropertyOptional({
    //     description: 'Thời gian kết thúc ủy quyền bỏ phiếu',
    //     example: '2025-11-30T23:59:59.000Z',
    // })
    // @IsNotEmpty()
    @IsOptional()
    delegationEnd?: Date;

    @ApiProperty({
        description: 'Trạng thái của cuộc bầu cử',
        example: STATUS.ACTIVE,
        enum: STATUS,
        default: STATUS.ACTIVE,
    })
    @IsOptional()
    @IsEnum(STATUS)
    status?: STATUS;

    // @ApiPropertyOptional({
    //     description: 'Dữ liệu phụ trợ cho trạng thái (nếu có)',
    //     example: 'Cuộc bầu cử đang được khởi tạo',
    // })
    @IsOptional()
    @IsString()
    statusData?: string;

    @ApiProperty({
        description: 'Số quyết định ban hành cuộc bầu cử',
        example: 'QĐ-123/2025',
    })
    // @IsNotEmpty()
    @IsString()
    decisionNumber: string;

    @ApiProperty({
        description: 'Tên quyết định ban hành cuộc bầu cử',
        example: 'Quyết định tổ chức bầu chọn dự án tiêu biểu',
    })
    // @IsNotEmpty()
    @IsString()
    decisionName: string;
}
