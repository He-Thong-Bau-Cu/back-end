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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { SystemConfigService } from './system-config.service';
import { SearchSystemConfigDto } from './dto/search-system-config.dto';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@ApiBearerAuth('access-token')
@ApiTags('System Config')
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm danh sách cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_CONFIG_GET_ALL_SUCCESS })
  async search(@Body() payload: SearchSystemConfigDto) {
    try {
      const resData = await this.systemConfigService.search(payload);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_CONFIG_GET_ALL_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới cấu hình hệ thống' })
  @ApiResponse({ status: 201, description: MESSAGE.SYSTEM_CONFIG_CREATE_SUCCESS })
  async create(@Body() payload: CreateSystemConfigDto, @Req() req: CustomRequest) {
    try {
      const resData = await this.systemConfigService.create(payload, req.user?.sub);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_CONFIG_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('key/:key')
  @ApiOperation({ summary: 'Lấy cấu hình hệ thống theo key' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_CONFIG_GET_BY_ID_SUCCESS })
  async findByKey(@Param('key') key: string) {
    try {
      const resData = await this.systemConfigService.findByKey(key);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_CONFIG_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_CONFIG_GET_BY_ID_SUCCESS })
  async findOne(@Param('id') id: string) {
    try {
      const resData = await this.systemConfigService.findById(id);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_CONFIG_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_CONFIG_UPDATE_SUCCESS })
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateSystemConfigDto,
    @Req() req: CustomRequest,
  ) {
    try {
      const resData = await this.systemConfigService.update(id, payload, req.user?.sub);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_CONFIG_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cấu hình hệ thống' })
  @ApiResponse({ status: 200, description: MESSAGE.SYSTEM_CONFIG_DELETE_SUCCESS })
  async remove(@Param('id') id: string) {
    try {
      const resData = await this.systemConfigService.remove(id);
      return BaseResponse.success(resData, MESSAGE.SYSTEM_CONFIG_DELETE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

