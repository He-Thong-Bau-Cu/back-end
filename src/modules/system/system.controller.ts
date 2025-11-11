import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SystemService } from './system.service';
import { SearchDTO } from 'src/common/dto/search.dto';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGES } from '@nestjs/core/constants';
import { MESSAGE_STATUS } from 'src/common/enums/status.enum';
import { ENDPOINT, METHOD } from 'src/common/enums/method.enum';
import { RoleService } from './role/role.service';
import { RoleDto } from '../../common/dto/role.dto';
import { RolePermissionDto } from '../../common/dto/rolePermission.dto';
import { PermissionDto } from '../../common/dto/permission.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly roleService: RoleService,
  ) {}

  @ApiOperation({ summary: 'Lấy dữ liệu cho các thẻ thống kê' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy dữ liệu cho các thẻ thống kê thành công',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get('statistic-cards')
  async getStatisticsCards() {
    try {
      const resData = await this.systemService.getStatisticsCards();
      return BaseResponse.success(
        resData,
        'Lấy dữ liệu cho các thẻ thống kê thành công',
        HttpStatus.OK,
      );
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Lấy dữ liệu cho biểu đồ đường tỷ lệ tham gia' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy dữ liệu cho biểu đồ đường tỷ lệ tham gia thành công',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get('participation-rate-chart')
  async getParticipationRateChart() {
    try {
      const resData = await this.systemService.getParticipationRateChart();
      return BaseResponse.success(
        resData,
        'Lấy dữ liệu cho biểu đồ đường tỷ lệ tham gia thành công',
        HttpStatus.OK,
      );
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Lấy dữ liệu cho biểu đồ tròn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy dữ liệu cho biểu đồ tròn thành công',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get('result-distribution-chart')
  async getResultDistributionChart() {
    try {
      const resData = await this.systemService.getResultDistributionChart();
      return BaseResponse.success(
        resData,
        'Lấy dữ liệu cho biểu đồ tròn thành công',
        HttpStatus.OK,
      );
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Lấy dữ liệu cho danh sách bầu cử' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy dữ liệu cho danh sách bầu cử thành công',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get('ongoing-polls')
  async getOngoingPolls() {
    try {
      const resData = await this.systemService.getOngoingPolls();
      return BaseResponse.success(
        resData,
        'Lấy dữ liệu cho danh sách bầu cử thành công',
        HttpStatus.OK,
      );
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Lấy dữ liệu cho hoạt động gần đây' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy dữ liệu cho hoạt động gần đây thành công',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get('recent-activities')
  async getRecentActivities() {
    try {
      const resData = await this.systemService.getRecentActivities();
      return BaseResponse.success(
        resData,
        'Lấy dữ liệu cho hoạt động gần đây thành công',
        HttpStatus.OK,
      );
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tìm kiếm danh sách system log' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SYSTEM_LOGS_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.SYSTEM_LOG}/${METHOD.SEARCH}`)
  async searchSystemLogs(@Body() req: SearchDTO) {
    try {
      const resData = await this.systemService.searchSystemLogs(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.SYSTEM_LOGS_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tìm kiếm danh sách audit log' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.AUDIT_LOGS_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.AUDIT_LOG}/${METHOD.SEARCH}`)
  async searchAuditLogs(@Body() req: SearchDTO) {
    try {
      const resData = await this.systemService.searchAuditLogs(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.AUDIT_LOGS_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tìm kiếm vai trò' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.ROLE}/${METHOD.SEARCH}`)
  async searchRole(@Body() req: RoleDto) {
    try {
      const resData = await this.roleService.searchRole(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tạo mới vai trò' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: MESSAGE_STATUS.ROLE_SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.ROLE}/${METHOD.CREATE}`)
  async createRole(@Body() req: RoleDto) {
    try {
      const resData = await this.roleService.createRole(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_SUCCESS, HttpStatus.CREATED);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Cập nhật vai trò' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_UPDATE,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Put(`${ENDPOINT.ROLE}/${METHOD.UPDATE}`)
  async updateRole(@Body() req: RoleDto) {
    try {
      const resData = await this.roleService.updateRole(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_UPDATE, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Chi tiết vai trò' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${ENDPOINT.ROLE}/${METHOD.DETAIL}/:id`)
  async getRoleById(@Param('id') id: string) {
    try {
      const resData = await this.roleService.detailRole(id);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Xoá vai trò' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_DELETE,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Delete(`${ENDPOINT.ROLE}/${METHOD.DELETE}`)
  async deleteRole(@Body() req: RoleDto) {
    try {
      const resData = await this.roleService.deleteRole(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_DELETE, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Phân quyền cho vai trò' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_PERMISSIONS_UPDATE,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.ROLE_PERMISSION}/${METHOD.UPDATE}`)
  async updateRolePermission(@Body() req: RolePermissionDto) {
    try {
      const resData = await this.roleService.updateRolePermission(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_PERMISSIONS_UPDATE, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tìm kiếm quyền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.ROLE}/${METHOD.SEARCH}`)
  async searchPermission(@Body() req: PermissionDto) {
    try {
      const resData = await this.roleService.searchPermission(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tạo mới quyền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_SUCCESS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.PERMISSION}/${METHOD.CREATE}`)
  async createPermission(@Body() req: PermissionDto) {
    try {
      const resData = await this.roleService.createPermission(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_SUCCESS, HttpStatus.CREATED);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Cập nhật quyền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_UPDATE,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Put(`${ENDPOINT.PERMISSION}/${METHOD.UPDATE}`)
  async updatePermission(@Body() req: PermissionDto) {
    try {
      const resData = await this.roleService.updatePermission(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_UPDATE, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Chi tiết quyền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${ENDPOINT.PERMISSION}/${METHOD.DETAIL}/:id`)
  async getPermissionById(@Param('id') id: string) {
    try {
      const resData = await this.roleService.detailPermission(id);
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Xóa quyền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_DELETE,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Delete(`${ENDPOINT.PERMISSION}/${METHOD.DELETE}`)
  async deletePermission(@Body() req: PermissionDto) {
    try {
      const resData = await this.roleService.deletePermission(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_DELETE, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tìm kiếm vai trò quyền hạn' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_PERMISSIONS_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${ENDPOINT.ROLE_PERMISSION}/${METHOD.SEARCH}`)
  async searchRolePermission(@Body() req: RolePermissionDto) {
    try {
      const resData = await this.roleService.searchRolePermission(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_PERMISSIONS_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Lấy tất cả quyền' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${ENDPOINT.PERMISSION}/${METHOD.ALL}`)
  async getAllPermission() {
    try {
      const resData = await this.roleService.getAllPermission();
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_VIEW, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Thống kê system log theo tuần / tháng / năm' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.SYSTEM_LOGS_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${ENDPOINT.SYSTEM_LOG}/${METHOD.STATISTICS}`)
  async getSystemLogStatistics(@Query('type') type: 'week' | 'month' | 'year') {
    try {
      const { data, metadata } = await this.systemService.getSystemLogStatistics(type);
      return BaseResponse.success(data, MESSAGE_STATUS.SYSTEM_LOGS_VIEW, HttpStatus.OK, metadata);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Thống kê role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.ROLE_STATS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${ENDPOINT.ROLE}/${METHOD.STATISTICS}`)
  async getRoleStatistics() {
    try {
      const resData = await this.roleService.getStatsRole();
      return BaseResponse.success(resData, MESSAGE_STATUS.ROLE_STATS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Thống kê permission' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.PERMISSION_STATS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${ENDPOINT.PERMISSION}/${METHOD.STATISTICS}`)
  async getPermissionStatistics() {
    try {
      const resData = await this.roleService.getStatsPermission();
      return BaseResponse.success(resData, MESSAGE_STATUS.PERMISSION_STATS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
