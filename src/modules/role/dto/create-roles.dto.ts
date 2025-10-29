import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { BaseRequest } from "src/common/dto/base-request.dto";

export class CreateRolesDto extends BaseRequest {

    @ApiPropertyOptional({
        description: 'Tên vai trò',
        example: 'Admin',
    })
    @IsOptional()
    roleName: string;

    @ApiProperty({
        description: 'Mã vai trò',
        example: 'ADMIN',
    })
    @IsOptional()
    roleCode: string;
    
    @ApiPropertyOptional({
        description: 'Mô tả vai trò',
        example: 'Vai trò quản trị hệ thống với quyền cao nhất',
    })
    @IsOptional()
    description: string;

    @ApiPropertyOptional({
        description: 'Trạng thái vai trò',
        example: 'active',  
    })
    @IsOptional()
    status: string;
}
