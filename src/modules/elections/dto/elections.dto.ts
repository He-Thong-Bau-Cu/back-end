import { IsOptional } from "class-validator";
import { BaseRequest } from "src/common/dto/base-request.dto";

export class ElectionsDto extends BaseRequest {
  @IsOptional()
  title: string;

  @IsOptional()
  type: string;

  @IsOptional()
  votingMethod: string;

  @IsOptional()
  startDate: Date;

  @IsOptional()
  endDate: Date;

  @IsOptional()
  status: string;

  @IsOptional()
  companyType: string;
}
