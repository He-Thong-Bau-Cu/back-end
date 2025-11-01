import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo báo cáo mới' })
  @ApiResponse({ status: 201, description: 'Tạo báo cáo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createReport: CreateReportDto): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.create(createReport);
      return BaseResponse.success(resData, 'Tạo báo cáo thành công', HttpStatus.CREATED);
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
  async findAll(): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.findAll();
      return BaseResponse.success(resData, 'Lấy danh sách báo cáo thành công', HttpStatus.OK);
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
      return BaseResponse.success(resData, 'Lấy báo cáo theo ID thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật báo cáo theo ID' })
  @ApiResponse({ status: 200, description: 'Cập nhật báo cáo theo ID thanh cong' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(@Param('id') id: string, @Body() updateReport: UpdateReportDto): Promise<BaseResponse> {
    try {
      const resData = await this.reportsService.update(id, updateReport);
      return BaseResponse.success(resData, 'Cập nhật báo cáo theo ID thanh cong', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
