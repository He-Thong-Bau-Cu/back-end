import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class CreateUserDto {
    @ApiProperty({
        description:"username của người dùng",
        example:"Lan Nguyen"
    })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({
        description:"mật khẩu của người dùng",
        example:"123456"
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description:"Mật khẩu tạm thời của người dùng",
        example:"false"
    })
    @IsBoolean()
    @IsNotEmpty()
    isTempPassword: boolean;

    @ApiProperty({
        description:"Tên đầy đủ của người dùng",
        example:"Lan Nguyen"
    })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @ApiPropertyOptional({
        description:"Ngày sinh của người dùng",
        example:"2000-01-01"
    })
    @IsOptional()
    dob: Date;

    @ApiProperty({
        description:"CMND của người dùng",
        example:"123456789"
    })
    @IsString()
    @IsNotEmpty()
    citizenId: string;

    @ApiProperty({
        description:"Email của người dùng",
        example:"lannguyen@gmail.com"
    })
    @IsString()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description:"Số điện thoại của người dùng",
        example:"0123456789"
    })
     @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({
        description:"Địa chỉ của người dùng",
        example:"123 Main Street"
    })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        description:"Trạng thái của người dùng",
        example:"ACTIVE"
    })
     @IsString()
    @IsNotEmpty()
    status: string;

    @ApiProperty({
        description:"ID vai trò của người dùng",
        example:"6904d4e1d08ce96faf892e31"
    })
    @IsString()
    @IsNotEmpty()
    roleId: string;

    @ApiProperty({
        description:"Vị trí của người dùng",
        example:"WEB DEVELOPER"
    })
    @IsString()
    @IsNotEmpty()
    position: string;

    @ApiProperty({
        description:"Phòng ban của người dùng",
        example:"IT"
    })
    @IsString()
    @IsNotEmpty()
    department: string;

   @ApiPropertyOptional({
        description:"Ảnh của người dùng",
        example:"https://example.com/image.jpg"
    })
    @IsString()
    @IsOptional()
    image: string;

    @ApiPropertyOptional({
        description:"Mật khẩu 2FA của người dùng",
        example:"123456"
    })
    @IsString()
    @IsOptional()
    twoFASecret: string;

    @ApiPropertyOptional({
        description:"Trạng thái 2FA của người dùng",
        example:"true"
    })
    @IsBoolean()
    @IsOptional()
    isTwoFAEnabled: boolean;
}
