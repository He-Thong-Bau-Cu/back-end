import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class ElectionDocumentItem {
  @ApiPropertyOptional({ description: "ID của tài liệu (nếu có - để update)" })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ description: "Tiêu đề" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Nội dung" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: "URL của file" })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: "Ghi chú" })
  @IsOptional()
  @IsString()
  remarks?: string;
}

class VoterItem {
  @ApiPropertyOptional({ description: "ID của cử tri (nếu có - để update)" })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ description: "ID của người dùng" })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: "Tỷ lệ cổ phần" })
  @IsOptional()
  percentage?: number;
}

class ParticipantItem {
  @ApiPropertyOptional({ description: "ID của participant (nếu có - để update)" })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ description: "ID của người dùng" })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: "ID của vai trò" })
  @IsNotEmpty()
  @IsString()
  roleId: string;

  @ApiProperty({ description: "Vị trí" })
  @IsNotEmpty()
  @IsString()
  position: string;
}

class CandidateItem {
  @ApiPropertyOptional({ description: "ID của candidate (nếu có - để update)" })
  @IsOptional()
  @IsString()
  _id?: string;

  @ApiProperty({ description: "Tiêu đề" })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: "Mô tả" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Metadata" })
  @IsNotEmpty()
  @IsObject()
  metaData: Record<string, any>;

  @ApiPropertyOptional({ description: "URL của file" })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class BulkSaveDraftDto {
  @ApiProperty({ description: "ID của cuộc bầu cử" })
  @IsNotEmpty()
  @IsString()
  electionId: string;

  @ApiProperty({ description: "Thông tin cuộc họp" })
  @IsNotEmpty()
  @IsObject()
  meetingInfo: {
    type?: string | { typeName: string; typeCode: string; description?: string };
    threshold?: string | { thresholdName: string; thresholCode: string; thresholdType: string; value: number; description?: string };
    method?: string;
    location?: string;
    authorizationStart?: string;
    authorizationEnd?: string;
  };

  @ApiPropertyOptional({ description: "Danh sách bầu chọn (ứng viên/dự án)", type: [CandidateItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateItem)
  electionEntities?: CandidateItem[];

  @ApiPropertyOptional({ description: "Danh sách tài liệu", type: [ElectionDocumentItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElectionDocumentItem)
  electionDocuments?: ElectionDocumentItem[];

  @ApiPropertyOptional({ description: "Danh sách cử tri", type: [VoterItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VoterItem)
  voters?: VoterItem[];

  @ApiPropertyOptional({ description: "Danh sách thành viên tổ chức", type: [ParticipantItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParticipantItem)
  participants?: ParticipantItem[];

  @ApiProperty({ description: "Có phải gửi duyệt không (false = lưu nháp, true = gửi duyệt)" })
  @IsNotEmpty()
  @IsBoolean()
  isSubmitForApproval: boolean;

  @ApiProperty({ description: "Có tài liệu không" })
  @IsNotEmpty()
  @IsBoolean()
  hasDocuments: boolean;
}

