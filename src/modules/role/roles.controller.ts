import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Query, Put } from '@nestjs/common';
import { RolesService } from './roles.service';

import { METHOD } from 'src/common/enums/method.enum';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { BaseResponse } from 'src/common/dto/base-response.dto';
import { BaseRequest } from 'src/common/dto/base-request.dto';
import Api from 'twilio/lib/rest/Api';
import { RolesDto } from './dto/roles.dto';
import { CreateRoleDTO } from './dto/create-role-dto';


@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách vai trò trả về thành công.'
  })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getRoles(@Query() query: BaseRequest): Promise<BaseResponse> {
    try {
      const resData = await this.rolesService.findAll(query);
      return BaseResponse.success(resData, "Lấy danh sách vai trò thành công", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin vai trò theo ID' })
  @ApiParam({ name: 'id', description: 'ID của vai trò', type: String })
  @ApiResponse({ status: 200, description: 'Thông tin vai trò theo ID' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getRoleById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.rolesService.getRoleById(id);
      return BaseResponse.success(resData, "Lấy thông tin vai trò theo ID thành công", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo 1 vai trò mới' })
  @ApiResponse({ status: 201, description: 'Tạo vai trò thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async createRole(@Body() req: CreateRoleDTO): Promise<BaseResponse> {
    try {
      const resData = await this.rolesService.createRole(req);
      return BaseResponse.success(resData, 'Tạo vai trò thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa vai trò theo ID' })
  @ApiParam({ name: 'id', description: 'ID của vai trò', type: String })
  @ApiResponse({ status: 200, description: 'Xóa vai trò thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async deleteRole(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.rolesService.deleteRole(id);
      return BaseResponse.success(resData, "Xóa vai trò thành công", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin vai trò theo ID' })
  @ApiParam({ name: 'id', description: 'ID của vai trò', type: String })
  @ApiResponse({ status: 200, description: 'Cập nhật thông tin vai trò thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async updateRole(@Param('id') id: string, @Body() req: RolesDto): Promise<BaseResponse> {
    try {
      const resData = await this.rolesService.updateRole(id, req);
      return BaseResponse.success(resData, "Cập nhật vai trò thành công", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
