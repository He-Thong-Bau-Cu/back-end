import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDelegateCardDto {
    @ApiProperty({ 
        example: 'ABC123XYZ', 
        description: 'Token đại biểu' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty(
    { example: '651f0a7c1f2b4d1a12345678', 
    description: 'ID cuộc bầu cử' })
  @IsString()
  @IsNotEmpty()
  electionId: string;

  @ApiProperty({ 
    example: '6903a0eda315db370563b13a', 
    description: 'ID cử tri' })
  @IsString()
  @IsNotEmpty()
  voterId: string;

  @ApiProperty({ 
    example: '6904749f6637a829ea9c93d9', 
    description: 'ID ủy quyền' })
  @IsString()
  @IsNotEmpty()
  delegationId: string;

  @ApiProperty({ 
    example: '2025-11-01T00:00:00.000Z', 
    description: 'Ngày phát hành' })
  @IsString()
  @IsNotEmpty()
  issuedAt: string;

  @ApiProperty({ 
    example: '2025-11-05T00:00:00.000Z', 
    description: 'Ngày hết hạn' })
  @IsString()
  @IsNotEmpty()
  expiresAt: string;

  @ApiPropertyOptional({
    example: 'Active',
    description: 'Trạng thái thẻ (Active / Expired / Revoked)',
  })
  @IsOptional()
  @IsNotEmpty()
  status: string;
}
