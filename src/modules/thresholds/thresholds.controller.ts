import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ThresholdsService } from './thresholds.service';
import { CreateThresholdDto } from './dto/create-threshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('thresholds')
export class ThresholdsController {
  constructor(private readonly thresholdsService: ThresholdsService) { }

  @Get(':thresholdCode')
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
}
