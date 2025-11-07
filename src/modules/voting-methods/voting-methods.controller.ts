import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { VotingMethodsService } from './voting-methods.service';
import { CreateVotingMethodDto } from './dto/create-voting-method.dto';
import { UpdateVotingMethodDto } from './dto/update-voting-method.dto';

import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('voting-methods')
export class VotingMethodsController {
  constructor(private readonly votingMethodsService: VotingMethodsService) { }

  @Get(':methodCode')
  @ApiOperation({ summary: 'Lấy thông tin phương thức bầu cử thông qua mã' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin phương thức bầu cử thông qua mã thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getVotingMethodByCode(@Param('methodCode') methodCode: string): Promise<BaseResponse> {
    try {
      const resData = await this.votingMethodsService.findOne(methodCode);
      return BaseResponse.success(resData, MESSAGE.VOTING_METHOD_GET_BY_CODE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
