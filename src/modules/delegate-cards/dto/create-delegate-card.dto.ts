import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDelegateCardDto {



  @ApiProperty(
    {
      example: '651f0a7c1f2b4d1a12345678',
      description: 'ID cuộc bầu cử'
    })
  @IsString()
  @IsNotEmpty()
  electionId: string;

  @ApiProperty({
    example: '6903a0eda315db370563b13a',
    description: 'ID cử tri'
  })
  @IsString()
  @IsNotEmpty()
  voterId: string;


  @IsString()
  @IsOptional()
  delegationId: string;





  // @ApiPropertyOptional({
  //   example: 'Active',
  //   description: 'Trạng thái thẻ (Active / Expired / Revoked)',
  // })
  @IsOptional()
  @IsString()
  status: string;
}
