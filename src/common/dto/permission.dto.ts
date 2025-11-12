import {IsNotEmpty, IsOptional, IsString} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {BaseRequest} from "./base-request.dto";

export class PermissionDto extends BaseRequest {
    @ApiPropertyOptional({
        description: 'Id quyền',
        example: '60f7c0c2b4d1c826d8f0e6b7',
    })
    @IsOptional()
    permissionId: string;
    @ApiPropertyOptional({
        description: 'Tên quyền',
        example: 'Quản lý người dùng',
    })
    @IsOptional()
    permissionName: string;
    @ApiPropertyOptional({
        description: 'Mã quyền',
        example: 'USER_MANAGEMENT',
    })
    @IsOptional()
    permissionCode: string;
    @ApiPropertyOptional({
        description: 'URL quyền',
        example: '/api/users',
    })
    @IsOptional()
    url: string;
    @ApiPropertyOptional({
        description: 'Mô tả quyền',
        example: 'Quyền quản lý người dùng trong hệ thống',
    })
    @IsOptional()
    description: string;
    @ApiPropertyOptional({
        description: 'Trạng thái quyền',
        example: 'ACTIVE',
    })
    @IsOptional()
    status: string;
}
