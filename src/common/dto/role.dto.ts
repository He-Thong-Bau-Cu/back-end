import {IsNotEmpty, IsOptional, IsString} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";
import {BaseRequest} from "./base-request.dto";

export class RoleDto extends BaseRequest{
    @ApiPropertyOptional({
        description: 'ID vai trò',
        example: '64b8f0c2e1d3f2a5b6c7d8e9',
    })
    @IsOptional()
    roleId: string;
    @ApiPropertyOptional({
        description: 'Tên vai trò',
        example: 'Quản trị viên',
    })
    @IsNotEmpty()
    @IsString()
    roleName: string;
    @ApiPropertyOptional({
        description: 'Mã vai trò',
        example: 'ADMIN',
    })
    @IsNotEmpty()
    @IsString()
    roleCode: string;
    @ApiPropertyOptional({
        description: 'Mô tả vai trò',
        example: 'Vai trò có quyền quản trị hệ thống',
    })
    description: string;
    @ApiPropertyOptional({
        description: 'Trạng thái vai trò',
        example: 'ACTIVE',
    })
    status: string;
}