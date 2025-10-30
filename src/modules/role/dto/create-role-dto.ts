import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { STATUS } from "src/common/enums/status.enum";


export class CreateRoleDTO  {

    @ApiProperty({
        description: 'Tên vai trò',
        example: 'Admin',
    })
    @IsString()
    @IsNotEmpty()
    roleName: string;

    @ApiProperty({
        description: 'Mã vai trò',
        example: 'ADMIN',
    })
    @IsString()
    @IsNotEmpty()
    roleCode: string;
    
    @ApiPropertyOptional({
        description: 'Mô tả vai trò',
        example: 'Vai trò quản trị hệ thống với quyền cao nhất',
    })
    @IsOptional()
    description: string;

    @ApiProperty({
        description: 'Trạng thái vai trò',
        example: 'active',  
    })
    @IsString()
    @IsEnum(STATUS)
    status: string;
}
