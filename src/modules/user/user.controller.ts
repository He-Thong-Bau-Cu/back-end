import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
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
}
