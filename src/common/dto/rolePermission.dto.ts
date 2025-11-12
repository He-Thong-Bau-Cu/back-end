import {IsNotEmpty, IsOptional, IsString} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {BaseRequest} from "./base-request.dto";

export class RolePermissionDto extends BaseRequest {
    @ApiPropertyOptional({
        description: 'Id quyền của vai trò',
        example: '60f7c0c2b4d1c826d8f0e6b1',
    })
    @IsOptional()
    rolePermissionId: string;
    @ApiPropertyOptional({
        description: 'Id vai trò',
        example: '60f7c0c2b4d1c826d8f0e6b0',
    })
    @IsOptional()
    roleId: string;
    @ApiPropertyOptional({
        description: 'Danh sách Id quyền',
        example: ['60f7c0c2b4d1c826d8f0e6b2', '60f7c0c2b4d1c826d8f0e6b3'],
    })
    @IsOptional()
    permissionIds: string[];
}
