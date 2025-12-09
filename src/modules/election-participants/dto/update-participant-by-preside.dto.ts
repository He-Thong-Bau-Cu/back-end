import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateParticipantByPresideDto {
  @ApiProperty({
    description: 'ID của user mới để thay thế',
    example: '60f7c0c2b4d1c826d8f0e6b2',
  })
  @IsNotEmpty()
  @IsString()
  newUserId: string;
}

