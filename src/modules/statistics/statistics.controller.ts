import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { CreateStatisticDto } from './dto/create-statistic.dto';
import { UpdateStatisticDto } from './dto/update-statistic.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@ApiBearerAuth('access-token')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) { }

  @Get('preside')
  @ApiOperation({ summary: 'Lấy thông tin thống kê cho chủ tịch' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thống kê cho chủ tịch thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDashboardPreside():Promise<BaseResponse> {
    try {
      const resData = await this.statisticsService.getDashboardPreside();
      return BaseResponse.success(resData, MESSAGE.STATISTICS_GET_DASHBOARD_PRESIDENT_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('preside/recent-participation')
  @ApiOperation({ summary: 'Lấy tỷ lệ tham gia của các cuộc bầu cử gần nhất' })
  @ApiResponse({ status: 200, description: 'Lấy tỷ lệ tham gia thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getRecentParticipation(): Promise<BaseResponse> {
    try {
      const data = await this.statisticsService.getRecentParticipation();
      return BaseResponse.success(data, MESSAGE.STATISTICS_GET_DASHBOARD_PRESIDENT_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
