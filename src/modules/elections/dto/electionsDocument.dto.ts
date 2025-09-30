import { IsOptional } from 'class-validator';
import { BaseRequest } from 'src/common/dto/base-request.dto';

export class ElectionsDocumentDto extends BaseRequest {
  @IsOptional()
  electionId: string;

  @IsOptional()
  title: string;

  @IsOptional()
  content: string;

  @IsOptional()
  fileUrl: string;

  @IsOptional()
  status: string;

  @IsOptional()
  createdAt: Date;

  @IsOptional()
  updatedAt: Date;
}
