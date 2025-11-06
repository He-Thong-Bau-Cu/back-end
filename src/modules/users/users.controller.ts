import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

 @Get(':id')
   @ApiOperation({ summary: 'Lấy thông tin người dùng' })
   @ApiResponse({ status: 200, description: 'Lấy thông tin người dùng thành công.' })
   @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
   @ApiResponse({ status: 500, description: 'Lỗi server' })
   async getById(@Param('id') id: string): Promise<BaseResponse> {
     try {
       const resData = await this.usersService.getById(id);
       return BaseResponse.success(resData, MESSAGE.USER_GET_BY_ID_SUCCESS, HttpStatus.OK);
     } catch (error) {
       throw new HttpException(
         { message: error.message },
         HttpStatus.INTERNAL_SERVER_ERROR
       )
     }
   }

   @Get()
   @ApiOperation({ summary: 'Lấy danh sách thông tin người dùng' })
   @ApiResponse({ status: 200, description: 'Lấy danh sách thông tin người dùng thành công.' })
   @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
   @ApiResponse({ status: 500, description: 'Lỗi server' })
   async getAll(): Promise<BaseResponse> {
     try {
       const resData = await this.usersService.getAll();
       return BaseResponse.success(resData, MESSAGE.USER_GET_ALL_SUCCESS, HttpStatus.OK);
     } catch (error) {
       throw new HttpException(
         { message: error.message },
         HttpStatus.INTERNAL_SERVER_ERROR
       )
     }
   }

}
