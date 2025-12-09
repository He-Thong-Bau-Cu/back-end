import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put, Req, Res, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';


@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo báo cáo mới' })
  @ApiResponse({ status: 201, description: 'Tạo báo cáo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createReport: CreateReportDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.create(createReport, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.REPORT_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách báo cáo' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách báo cáo thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async findAll(@Query('electionId') electionId?: string): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.findAll(electionId);
      return BaseResponse.success(resData, MESSAGE.REPORT_GET_ALL_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy báo cáo theo ID' })
  @ApiResponse({ status: 200, description: 'Lấy báo cáo theo ID thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.REPORT_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy báo cáo theo ID cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy báo cáo theo ID cuộc bầu cử thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.REPORT_GET_BY_ELECTION_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật báo cáo theo ID' })
  @ApiResponse({ status: 200, description: 'Cập nhật báo cáo theo ID thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string,
    @Body() updateReport: UpdateReportDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.update(id, updateReport, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.REPORT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('pdf/:id')
  @ApiProduces('application/pdf')
  @ApiParam({ name: 'id', description: 'ID của báo cáo' })
  @ApiOperation({ summary: 'Tải PDF báo cáo theo ID' })
  @ApiResponse({ status: 200, description: 'Tải PDF báo cáo' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy báo cáo' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getReportPdf(@Param('id') id: string, @Res() res: Response): Promise<void> {
    try {
      const pdfBuffer = await this.reportsService.generateReportPDF(id);
      if (!pdfBuffer) throw new Error('PDF không tồn tại');

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="report_${id}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  @Post('sign/:id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Ký số báo cáo' })
  @ApiResponse({ status: 200, description: 'Ký số báo cáo thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        password: {
          type: 'string',
        }
      },
      required: ['file', 'password'],
    },
  })
  async signReport(
    @Param('id') id: string,
    @Req() req: CustomRequest,
    @UploadedFile() fileP12: Express.Multer.File,
    @Body('password') password: string,
  ) {
    try {
      const signFile = await this.reportsService.signReport(fileP12, password, id, req.user.sub);
      return BaseResponse.success(signFile, MESSAGE.REPORT_SIGN_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )

    }
  }


}
