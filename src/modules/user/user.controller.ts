import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ENDPOINT, METHOD } from 'src/common/enums/method.enum';
import { UserDto } from 'src/common/dto/user.dto';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE_STATUS } from 'src/common/enums/status.enum';

@ApiTags('Người dùng')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Tìm kiếm người dùng' })
      @ApiResponse({
          status: HttpStatus.OK,
          description: MESSAGE_STATUS.USER_VIEW,
      })
      @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
  @Post(`${METHOD.SEARCH}`)
  async search(@Body() req: UserDto){
    try {
      const resData = await this.userService.search(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_VIEW, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Tạo mới người dùng' })
      @ApiResponse({
          status: HttpStatus.CREATED,
          description: MESSAGE_STATUS.USER_CREATE,
      })
      @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
  @Post(`${METHOD.CREATE}`)
  async createUser(@Body() req: UserDto) {
    try {
      const resData = await this.userService.create(req);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_CREATE, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Cập nhật người dùng' })
      @ApiResponse({
          status: HttpStatus.OK,
          description: MESSAGE_STATUS.USER_UPDATE,
      })
      @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
  @Put(`${METHOD.UPDATE}/:id`)
  async update(@Param('id') id: string, @Body() req: UserDto){
    try {
      const resData = await this.userService.updateUser(id, req);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_UPDATE, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Xóa người dùng' })
      @ApiResponse({
          status: HttpStatus.OK,
          description: MESSAGE_STATUS.USER_DELETE,
      })
      @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
  @Delete(`${METHOD.DELETE}/:id`)
  async delete(@Param('id') id: string){
    try {
      const resData = await this.userService.delete(id);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_DELETE, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Chi tiết người dùng' })
      @ApiResponse({
          status: HttpStatus.OK,
          description: MESSAGE_STATUS.USER_VIEW,
      })
      @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: MESSAGE_STATUS.SERVER_ERROR })
  @Get(`${METHOD.DETAIL}/:id`)
  async detail(@Param('id') id: string){
    try {
      const resData = await this.userService.detail(id);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_VIEW, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
