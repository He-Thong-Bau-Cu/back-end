import { Controller, Get, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { SystemReportService } from './system-report.service';
import { SystemReportQueryDto } from './dto/system-report-query.dto';

@ApiBearerAuth('access-token')
@ApiTags('System Reports')
@Controller('system-reports')
export class SystemReportController {
  constructor(private readonly systemReportService: SystemReportService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Lấy báo cáo tổng quan hệ thống' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_REPORT_VIEW_SUCCESS })
  async getOverview(@Query() query: SystemReportQueryDto): Promise<BaseResponse> {
    try {
      const resData = await this.systemReportService.getOverview(query);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_REPORT_VIEW_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất báo cáo hệ thống' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_REPORT_EXPORT_SUCCESS })
  async exportReport(@Query() query: SystemReportQueryDto, @Res() res: Response) {
    try {
      const file = await this.systemReportService.exportReport(query);
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
      });
      res.status(HttpStatus.OK).send(file.buffer);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

