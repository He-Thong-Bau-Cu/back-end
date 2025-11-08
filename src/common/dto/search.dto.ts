import { IsOptional } from "class-validator";
import { BaseRequest } from "./base-request.dto";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class SearchDTO extends BaseRequest {
  @ApiPropertyOptional({ description: "Text search", example: "abc" })
  @IsOptional()
  textSearch: string;
  // @ApiPropertyOptional({ description: "From date", example: "2022-01-01" })
  @IsOptional()
  fromDate: Date;
  @IsOptional()
  toDate: Date;
  @IsOptional()
  type: string;
  @ApiPropertyOptional({ description: "Status", example: "PENDING" })
  @IsOptional()
  status: string;
  @ApiPropertyOptional({ description: "Decision name", example: "abc" })
  @IsOptional()
  decisionName: string;
  @ApiPropertyOptional({ description: "Decision number", example: "abc" })
  @IsOptional()
  decisionNumber: string;
}
