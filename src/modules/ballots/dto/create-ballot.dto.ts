import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import Api from "twilio/lib/rest/Api";

export class CreateBallotDto {
    @ApiProperty({
        description: "ID của cuộc bầu cử",
        example: "60d21b4667d0d8992e610c85"
    })
    @IsNotEmpty()
    @IsString()
    electionId: string

    @ApiProperty({
        description: "ID của cử tri",
        example: "60d21b4667d0d8992e610c86"
    })
    @IsNotEmpty()
    @IsString()
    voterId: string

    // @ApiProperty({
    //     description: "ID của ứng viên",
    //     example: "60d21b4667d0d8992e610c87"
    // })
    // @IsNotEmpty()
    // @IsString()
    // entityId: string

    // @ApiPropertyOptional({
    //     description: "Giá trị bầu cử của cử tri",
    //     example: "1000"
    // })
    @IsNumber()
    voteValue: number

    // @ApiProperty({
    //     description: "OTP xác thực của cử tri",
    //     example: "123456"
    // })
    @IsOptional()
    @IsString()
    otpCode: string

    // @ApiProperty({
    //     description: "Chữ kí của cử tri",
    //     example: "Nguyễn Văn A"
    // })
    @IsOptional()
    @IsString()
    signature: string

    // @ApiProperty({
    //     description: "Số lần cử tri nhập OTP",
    //     example: "123456"
    // })
    // @IsOptional()
    // @IsNumber()
    // attempts: number

    // @ApiProperty({
    //     description: "Giá trị bầu cử mã hóa",
    //     example: "123456"
    // })
    // @IsOptional()
    // @IsString()
    // encryptedVote: string

    // @ApiProperty({
    //     description: "Trạng thái của phiếu bầu",
    //     example: "Draft"
    // })
    @IsOptional()
    @IsString()
    status: string

    // @ApiProperty({
    //     description: "Ngày phát hành phiếu bầu",
    //     example: "2025-10-30T18:25:26.703+00:00"
    // })
    @IsOptional()
    issuedAt: Date

    // @ApiProperty({
    //     description: "Thời gian cử tri hoàn thành bỏ phiếu thành công",
    //     example: "2025-10-30T18:25:26.703+00:00"
    // })
    @IsOptional()
    castAt: Date

}
