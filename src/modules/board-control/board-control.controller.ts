import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Req, Res, Query } from '@nestjs/common';
import { BoardControlService } from './board-control.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { Response } from 'express';

@ApiBearerAuth('access-token')
@ApiTags('Board Control')
@Controller('board-control')
export class BoardControlController {
  constructor(private readonly boardControlService: BoardControlService) {}

  @Get(':electionId/voting-overview')
  @ApiOperation({ summary: 'Lấy thông tin tổng quan giám sát bỏ phiếu' })
  async getVotingOverview(@Param('electionId') electionId: string) {
    try {
      const data = await this.boardControlService.getVotingOverview(electionId);
      return BaseResponse.success(data, MESSAGE.BOARD_VOTING_OVERVIEW_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':electionId/verification')
  @ApiOperation({ summary: 'Lấy dữ liệu xác minh kết quả bầu cử' })
  async getVerification(@Param('electionId') electionId: string) {
    try {
      const data = await this.boardControlService.getVerificationReport(electionId);
      return BaseResponse.success(data, MESSAGE.BOARD_VERIFICATION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/verification/approve')
  @ApiOperation({ summary: 'Xác nhận kết quả bầu cử' })
  async approveVerification(@Param('electionId') electionId: string, @Req() req: CustomRequest) {
    try {
      const data = await this.boardControlService.approveVerification(electionId, req.user?.sub);
      return BaseResponse.success(data, MESSAGE.BOARD_VERIFICATION_APPROVED, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':electionId/audit-report/download')
  @ApiOperation({ summary: 'Tải xuống báo cáo kiểm soát dạng PDF' })
  async downloadAuditReport(@Param('electionId') electionId: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.boardControlService.generateAuditReportPdf(electionId);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bao-cao-kiem-soat-${electionId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':electionId/archive-report/download')
  @ApiOperation({ summary: 'Tải xuống báo cáo lưu trữ dạng PDF' })
  async downloadArchiveReport(
    @Param('electionId') electionId: string,
    @Query('reportId') reportId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.boardControlService.generateArchiveReportPdf(electionId, reportId);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bao-cao-luu-tru-${electionId}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':electionId/audit-report')
  @ApiOperation({ summary: 'Lấy báo cáo kiểm soát hệ thống (tạo mới nếu chưa có, chỉ update nếu status PENDING)' })
  async getAuditReport(@Param('electionId') electionId: string) {
    try {
      const data = await this.boardControlService.getAuditReport(electionId);
      return BaseResponse.success(data, MESSAGE.BOARD_AUDIT_REPORT_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/audit-report')
  @ApiOperation({ summary: 'Cập nhật báo cáo kiểm soát (chỉ update nếu status là PENDING)' })
  async updateAuditReport(
    @Param('electionId') electionId: string,
    @Body() reportData: { description?: string; summary?: string; fileUrl?: string; severity?: string },
  ) {
    try {
      const data = await this.boardControlService.getAuditReport(electionId, reportData);
      return BaseResponse.success(data, 'Cập nhật báo cáo kiểm soát thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/audit-report/sign')
  @ApiOperation({ summary: 'Ký số báo cáo kiểm soát' })
  async signAuditReport(@Param('electionId') electionId: string, @Req() req: CustomRequest) {
    try {
      const data = await this.boardControlService.confirmAuditReport(electionId, req.user?.sub);
      return BaseResponse.success(data, MESSAGE.BOARD_AUDIT_SIGN_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':electionId/archive-report')
  @ApiOperation({ summary: 'Lấy hoặc tạo báo cáo lưu trữ' })
  async getArchiveReport(@Param('electionId') electionId: string) {
    try {
      const data = await this.boardControlService.getOrUpdateArchiveReport(electionId);
      return BaseResponse.success(data, 'Lấy báo cáo lưu trữ thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/archive-report')
  @ApiOperation({ summary: 'Cập nhật báo cáo lưu trữ (chỉ update nếu status là PENDING)' })
  async updateArchiveReport(
    @Param('electionId') electionId: string,
    @Body() reportData: { description?: string; summary?: string; fileUrl?: string; severity?: string },
  ) {
    try {
      const data = await this.boardControlService.getOrUpdateArchiveReport(electionId, reportData);
      return BaseResponse.success(data, 'Cập nhật báo cáo lưu trữ thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

