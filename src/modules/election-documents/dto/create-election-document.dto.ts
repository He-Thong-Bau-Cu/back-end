import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateElectionDocumentDto {
    @ApiProperty({
        description: "ID của cuộc bầu cử",
        example: "60d21b4667d0d8992e610c85"
    })
    @IsNotEmpty()
    @IsString()
    electionId: string

    // @ApiProperty({
    //     description: "ID của người chuẩn bị",
    //     example: "60d21b4667d0d8992e610c85"
    // })
    @IsOptional()
    @IsString()
    preparedBy: string

    @ApiPropertyOptional({
        description: "Tiêu đề",
        example: "Bầu tổng giám đốc"
    })
    @IsOptional()
    @IsString()
    title: string

    @ApiPropertyOptional({
        description: "Nội dung",
        example: "Đề xuất về kế hoạch triển khai hệ thống bầu cử"
    })
    @IsOptional()
    @IsString()
    content: string

    @ApiPropertyOptional({
        description: "URL của file",
        example: "https://example.com/file.pdf"
    })
    @IsOptional()
    @IsString()
    fileUrl: string

    @ApiPropertyOptional({
        description: "Trạng thái",
        example: "ACTIVE"
    })
    @IsOptional()
    @IsString()
    status: string

    @IsOptional()
    @IsString()
    type: string

    @ApiPropertyOptional({
        description: "Ghi chú",
        example: "Đề xuất về kế hoạch triển khai hệ thống bầu cử"
    })
    @IsOptional()
    @IsString()
    remarks: string
}
