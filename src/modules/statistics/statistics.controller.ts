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
  async getDashboardPreside(): Promise<BaseResponse> {
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

  @Get('delegations')
  @ApiOperation({ summary: 'Lấy thông tin thống kê cho ủy quyền' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thống kê cho ủy quyền thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getStatisticsDelegations(): Promise<BaseResponse> {
    try {
      const resData = await this.statisticsService.statisticsDelegations();
      return BaseResponse.success(resData, MESSAGE.STATISTICS_GET_DELEGATIONS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('secretary/elections/:electionId/users/:userId')
  @ApiOperation({ summary: 'Lấy thông tin thống kê cho thư ký' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thống kê cho thư ký thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getStatisticsSecretary(
    @Param('electionId') electionId: string,
    @Param('userId') userId: string,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.statisticsService.getSecretaryDashboard(electionId, userId);
      return BaseResponse.success(resData, MESSAGE.STATISTICS_GET_SECRETARY_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('entity/cumulative-elections/:electionId')
  @ApiOperation({ summary: 'Lấy thông tin thống kê cho từng đối tượng được chọn trong bầu cử hình thức Cumulative' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thống kê cho từng đối tượng được chọn trong bầu cử hình thức Cumulative thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getStatisticsEntity(
    @Param('electionId') electionId: string,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.statisticsService.getCumulativeEntityResults(electionId);
      return BaseResponse.success(resData, MESSAGE.STATISTICS_GET_ENTITY_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('entity/yes-no-elections/:electionId')
  @ApiOperation({ summary: 'Lấy thông tin thống kê cho từng đối tượng được chọn trong bầu cử hình thức Yes/No/Abstain' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thống kê cho từng đối tượng được chọn trong bầu cử hình thức Yes/No/Abstain thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getYesNoStatisticsEntity(
    @Param('electionId') electionId: string,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.statisticsService.getYesNoEntityResults(electionId);
      return BaseResponse.success(resData, MESSAGE.STATISTICS_GET_ENTITY_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizer/dashboard')
  @ApiOperation({ summary: 'Lấy thông tin dashboard cho trưởng ban tổ chức' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin dashboard thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getOrganizerDashboard(): Promise<BaseResponse> {
    try {
      const resData = await this.statisticsService.getOrganizerDashboard();
      return BaseResponse.success(resData, 'Lấy thông tin dashboard thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
