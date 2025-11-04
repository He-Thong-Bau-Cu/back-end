import { ApiProperty } from '@nestjs/swagger';
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
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({
        description: 'ID của loại cuộc bầu cử (Election Type)',
        example: '64c5b4a8a95f1e2b40b85e91',
    })
    @IsNotEmpty()
    @IsString()
    typeId: string;

    @ApiProperty({
        description: 'ID của phương thức bỏ phiếu (Voting Method)',
        example: '64c5b4a8a95f1e2b40b85e92',
    })
    @IsNotEmpty()
    @IsString()
    votingMethodId: string;

    @ApiProperty({
        description: 'ID của ngưỡng hợp lệ (Threshold)',
        example: '64c5b4a8a95f1e2b40b85e93',
    })
    @IsNotEmpty()
    @IsString()
    thresholdId: string;

    @ApiProperty({
        description: 'Ngày bắt đầu cuộc bầu cử',
        example: '2025-12-01',
    })
    @IsNotEmpty()
    startDate: Date;

    @ApiProperty({
        description: 'Ngày kết thúc cuộc bầu cử',
        example: '2025-12-10',
    })
    @IsNotEmpty()
    endDate: Date;

    @ApiProperty({
        description: 'Thời gian bắt đầu ủy quyền bỏ phiếu',
        example: '2025-11-25T00:00:00.000Z',
    })
    @IsNotEmpty()
    delegationStart: Date;

    @ApiProperty({
        description: 'Thời gian kết thúc ủy quyền bỏ phiếu',
        example: '2025-11-30T23:59:59.000Z',
    })
    @IsNotEmpty()
    delegationEnd: Date;

    @ApiProperty({
        description: 'Trạng thái của cuộc bầu cử',
        example: STATUS.ACTIVE,
        enum: STATUS,
        default: STATUS.ACTIVE,
    })
    @IsOptional()
    @IsEnum(STATUS)
    status?: STATUS;

    @ApiProperty({
        description: 'Dữ liệu phụ trợ cho trạng thái (nếu có)',
        example: 'Cuộc bầu cử đang được khởi tạo',
    })
    @IsOptional()
    @IsString()
    statusData?: string;

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
}
