import {BaseRequest} from "./base-request.dto";
import {Prop} from "@nestjs/mongoose";
import {USER_ROLE} from "../enums/config.enum";
import {Types} from "mongoose";
import {Roles} from "../../database/schemas/roles.schema";
import {IsOptional, IsString} from "class-validator";
import {ApiPropertyOptional} from "@nestjs/swagger";

export class UserDto extends BaseRequest {
    @ApiPropertyOptional({
        description: 'Username',
        example: 'john_doe',
    })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiPropertyOptional({
        description: 'Họ và tên',
        example: 'John Doe',
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({
        description: 'Ngày sinh',
        example: '1990-01-01',
    })
    @IsOptional()
    dateOfBirth?: Date;

    @ApiPropertyOptional({
      description: 'Số căn cước công dân',
        example: '2184781927498',
    })
    @IsOptional()
    citizenId?: string;

    @ApiPropertyOptional({
        description: 'Email',
        example: 'anlp@gmail.com'
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại',
        example: '0123456789'
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        description: 'Địa chỉ',
        example: '123 Đường ABC, Quận 1, TP.HCM'
    })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({
        description: 'Trạng thái người dùng',
        example: 'ACTIVE'
    })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({
        description: 'Id vai trò người dùng',
        example: '64b8f0c2e1d3f2a5b6c7d8e9',
    })
    @IsOptional()
    @IsString()
    roleId?: string;

    @ApiPropertyOptional({
        description: 'Mã vai trò người dùng',
        example: 'ADMIN_USER',
    })
    @IsOptional()
    @IsString()
    roleCode?: string;

    @ApiPropertyOptional({
        description: 'Chức vụ',
        example: 'Nhân viên kinh doanh',
    })
    @IsOptional()
    @IsString()
    position?: string;

    @ApiPropertyOptional({
        description: 'Phòng ban',
        example: 'Phòng Kinh doanh',
    })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({
        description: 'Ảnh đại diện',
        example: 'https://example.com/images/avatar.jpg',
    })
    @IsOptional()
    @IsString()
    image?: string;
}
