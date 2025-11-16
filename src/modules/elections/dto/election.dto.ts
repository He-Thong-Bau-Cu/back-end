import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class ElectionDto {
  @ApiPropertyOptional({
    name: "startDate",
    description: "Start date of election",
  })
  @IsOptional()
  startDate: Date;

  @ApiPropertyOptional({
    name: "endDate",
    description: "End date of election",
  })
  @IsOptional()
  endDate: Date;
}
