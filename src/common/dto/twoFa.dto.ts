import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class TwoFADTO {
  @ApiPropertyOptional({ description: 'User ID', example: '60f7c0b5b4d1c826d8f0e6b1' })
  @IsString()
  @IsOptional()
  userId: string;
  @ApiPropertyOptional({ description: 'Token', example: 'secret' })
  @IsString()
  @IsOptional()
  token: string;
}
