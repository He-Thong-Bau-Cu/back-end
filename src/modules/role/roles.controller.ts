import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Query, Put } from '@nestjs/common';
import { RolesService } from './roles.service';

import { METHOD } from 'src/common/enums/method.enum';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

import { BaseResponse } from 'src/common/dto/base-response.dto';
import { BaseRequest } from 'src/common/dto/base-request.dto';
import Api from 'twilio/lib/rest/Api';
import { RolesDto } from './dto/roles.dto';
import { CreateRoleDTO } from './dto/create-role-dto';


@Controller('role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách role' })
  @ApiResponse({
    status:200,
    description:'Danh sách role trả về thành công.'
  })
  @ApiResponse({status:500,description:'Lỗi server'})
  async getRoles(@Query() query:BaseRequest ):Promise<BaseResponse>{
    try {
      const resData = await this.rolesService.findAll(query);
      return BaseResponse.success(resData, "Success", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin role theo ID' })
  @ApiParam({ name: 'id', description: 'ID của vai trò', type: String })
  @ApiResponse({ status: 200, description: 'Thông tin role theo ID' })
  @ApiResponse({ status: 500, description: 'Lỗi server' }) 
  async getRoleById(@Param('id') id:string):Promise<BaseResponse>{
    try {
      const resData = await this.rolesService.getRoleById(id);
      return BaseResponse.success(resData, "Success", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo 1 role mới' })
  @ApiResponse({status:201, description:'Tạo role thành công'})
  @ApiResponse({status:500, description:'Lỗi server'})
  async createRole(@Body() req:CreateRoleDTO):Promise<BaseResponse>{
    try {
       console.log('👉 DTO controller nhận được:', req);
      const resData = await this.rolesService.createRole(req);
      return BaseResponse.success(resData,'Success', HttpStatus.OK );
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa role theo ID' })
  @ApiParam({ name: 'id', description: 'ID của vai trò', type: String })
  @ApiResponse({ status: 200, description: 'Xóa role thành công' }) 
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async deleteRole(@Param('id') id:string):Promise<BaseResponse>{
    try { 
      const resData = await this.rolesService.deleteRole(id);
      return BaseResponse.success(resData, "Success", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin role theo ID' })
  @ApiParam({ name: 'id', description: 'ID của vai trò', type: String })
  @ApiResponse({ status: 200, description: 'Cập nhật thông tin role thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async updateRole(@Param('id') id:string, @Body() req:RolesDto):Promise<BaseResponse>{
    try {
      const resData = await this.rolesService.updateRole(id, req);
      return BaseResponse.success(resData, "Success", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
