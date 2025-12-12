import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Put,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { MESSAGE_STATUS } from '../../common/enums/status.enum';
import { METHOD } from '../../common/enums/method.enum';
import { UserDto } from '../../common/dto/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { FileResponseDto } from '../minio/dto/fileResponse.dto';
import { Response } from 'express';
import Api from 'twilio/lib/rest/Api';

@ApiBearerAuth('access-token')
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly fileService: MinioService,
  ) { }



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
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  @ApiOperation({ summary: 'Tìm kiếm người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.USER_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${METHOD.SEARCH}`)
  async search(@Body() req: UserDto) {
    try {
      const resData = await this.usersService.search(req);
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
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Post(`${METHOD.CREATE}`)
  async createUser(@Body() req: UserDto) {
    try {
      const resData = await this.usersService.create(req);
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
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Put(`${METHOD.UPDATE}/:id`)
  async update(@Param('id') id: string, @Body() req: UserDto) {
    try {
      const resData = await this.usersService.updateUser(id, req);
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
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Delete(`${METHOD.DELETE}/:id`)
  async delete(@Param('id') id: string) {
    try {
      const resData = await this.usersService.delete(id);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_DELETE, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Thống kê user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.USER_STATS,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`/${METHOD.STATISTICS}/${METHOD.GET}`)
  async getPermissionStatistics() {
    try {
      const resData = await this.usersService.getStatsUser();
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_STATS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Chi tiết người dùng' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: MESSAGE_STATUS.USER_VIEW,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: MESSAGE_STATUS.SERVER_ERROR,
  })
  @Get(`${METHOD.DETAIL}/:id`)
  async detail(@Param('id') id: string) {
    try {
      const resData = await this.usersService.detail(id);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_VIEW, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Xuất danh sách người dùng ra Excel' })
  @ApiResponse({ status: 200, description: MESSAGE.USER_EXPORT_SUCCESS })
  async exportUsers(@Res() res: Response) {
    try {
      const file = await this.usersService.exportUsersToExcel();
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
      });
      return res.status(HttpStatus.OK).send(file.buffer);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Nhập người dùng từ file Excel' })
  @ApiResponse({ status: 200, description: MESSAGE.USER_IMPORT_SUCCESS })
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    try {
      const resData = await this.usersService.importUsersFromExcel(file);
      return BaseResponse.success(resData, MESSAGE.USER_IMPORT_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('avatar/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: CustomRequest) {
    try {
      const userId = req.user.sub;
      const result = await this.fileService.uploadFileNoEncrypt(FileType.PROFILE_IMAGE, userId, file) as FileResponseDto;
      const resData = await this.usersService.updateAvatar(userId, result.key as string);
      return BaseResponse.success(resData, MESSAGE_STATUS.USER_VIEW, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('check-exists')
  @ApiOperation({ summary: 'Kiểm tra user đã tồn tại chưa (email, phone, citizenId)' })
  @ApiResponse({ status: 200, description: 'Kiểm tra thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async checkUserExists(
    @Body() body: { email?: string; phone?: string; citizenId?: string }
  ): Promise<BaseResponse> {
    try {
      const resData = await this.usersService.checkUserExists(body.email, body.phone, body.citizenId);
      return BaseResponse.success(resData, 'Kiểm tra thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
