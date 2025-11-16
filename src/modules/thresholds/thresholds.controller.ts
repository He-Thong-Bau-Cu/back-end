import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req, Put } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { CreateThresholdDto } from './dto/create-threshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('thresholds')
export class ThresholdsController {
  constructor(private readonly thresholdsService: ThresholdsService) { }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin ngưỡng theo ID' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin ngưỡng theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.thresholdsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.THRESHOLD_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get('thresholdCode/:thresholdCode')
  @ApiOperation({ summary: 'Lấy thông tin ngưỡng thông qua mã' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin ngưỡng thông qua mã thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getThresholdByCode(@Param('thresholdCode') thresholdCode: string): Promise<BaseResponse> {
    try {
      const resData = await this.thresholdsService.findOne(thresholdCode);
      return BaseResponse.success(resData, MESSAGE.THRESHOLD_GET_BY_CODE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm ngưỡng thông qua' })
  @ApiResponse({ status: 200, description: 'Tìm kiếm ngưỡng thông qua thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async search(@Body() searchDto: BaseSearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.thresholdsService.search(searchDto);
      return BaseResponse.success(resData, MESSAGE.THRESHOLD_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo ngưỡng thông qua' })
  @ApiResponse({ status: 200, description: 'Tạo ngưỡng thông qua thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createThresholdDto: CreateThresholdDto,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    try {
      const threshold = await this.thresholdsService.create(createThresholdDto, req.user.sub);
      return BaseResponse.success(threshold, MESSAGE.THRESHOLD_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật ngưỡng thông qua' })
  @ApiResponse({ status: 200, description: 'Cập nhật ngưỡng thông qua thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string,
    @Body() updateThresholdDto: UpdateThresholdDto,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    try {
      const threshold = await this.thresholdsService.update(id, updateThresholdDto, req.user.sub);
      return BaseResponse.success(threshold, MESSAGE.THRESHOLD_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
