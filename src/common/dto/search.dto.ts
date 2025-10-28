import { IsOptional } from "class-validator";
import { BaseRequest } from "./base-request.dto";

export class SearchDTO extends BaseRequest {
  @IsOptional()
  textSearch: string;
  @IsOptional()
  fromDate: Date;
  @IsOptional()
  toDate: Date;
  @IsOptional()
  type: string;
  @IsOptional()
  status: string;
}
