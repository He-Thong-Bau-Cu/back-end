import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRolesDto } from './dto/create-roles.dto';
import { METHOD } from 'src/common/enums/method.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from 'src/database/schemas/roles.schema';
import { BaseResponse } from 'src/common/dto/base-response.dto';


@Controller('role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get(METHOD.GET)
  @ApiOperation({ summary: 'Lấy danh sách vai trò' })
  @ApiResponse({
    status:200,
    description:'Danh sách vai trò trả về thành công.'
  })
  @ApiResponse({status:500,description:'Lỗi server'})
  async getRoles(@Body() req:CreateRolesDto):Promise<BaseResponse>{
    try {
      const resData = await this.rolesService.getRoles(req);
      return BaseResponse.success(resData, "Success", HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

}
