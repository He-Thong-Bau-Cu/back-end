import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateElectionTypeDto {
    @ApiProperty({ description: 'Tên loại bầu cử' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
