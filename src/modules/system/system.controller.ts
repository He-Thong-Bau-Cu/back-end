import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { SystemService } from './system.service';
import { SearchDTO } from 'src/common/dto/search.dto';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGES } from '@nestjs/core/constants';
import { MESSAGE_STATUS } from 'src/common/enums/status.enum';
import { ENDPOINT, METHOD } from 'src/common/enums/method.enum';

@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService
  ){}

  @Post(`${ENDPOINT.SYSTEM_LOG}/${METHOD.SEARCH}`)
  async searchSystemLogs(@Body() req: SearchDTO){
    try{
      const resData = await this.systemService.searchSystemLogs(req);
      return BaseResponse.success(resData, 'Tìm kiếm log hệ thống thành công', HttpStatus.OK);
    }catch(e){
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
