import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { VotingMethodsService } from './voting-methods.service';
import { CreateVotingMethodDto } from './dto/create-voting-method.dto';
import { UpdateVotingMethodDto } from './dto/update-voting-method.dto';

import { BaseResponse } from 'src/common/dto/base-response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('voting-methods')
export class VotingMethodsController {
  constructor(private readonly votingMethodsService: VotingMethodsService) {}

  @Get(':methodCode')
  @ApiOperation({ summary: 'Lấy thông tin phương thức bầu cử thông qua bởi code' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin phương thức bầu cử thông qua thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getVotingMethodByCode(@Param('methodCode') methodCode: string):Promise<BaseResponse>{
    try {
      const resData = await this.votingMethodsService.findOne(methodCode);
      return BaseResponse.success(resData, 'Lấy thông tin phương thức bầu cử theo code thành công', 200);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
 
}
