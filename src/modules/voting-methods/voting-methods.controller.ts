import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req, Put } from '@nestjs/common';
import { VotingMethodsService } from './voting-methods.service';
import { CreateVotingMethodDto } from './dto/create-voting-method.dto';
import { UpdateVotingMethodDto } from './dto/update-voting-method.dto';

import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { VotingMethodSearchDTO } from './dto/search.dto';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('voting-methods')
export class VotingMethodsController {
  constructor(private readonly votingMethodsService: VotingMethodsService) { }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin phương thức bầu cử theo ID' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin phương thức bầu cử theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.votingMethodsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.VOTING_METHOD_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get('methodCode/:methodCode')
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

  @Post('search')
  @ApiOperation({ summary: 'Tim kiếm phương thức bầu cử' })
  @ApiResponse({ status: 200, description: 'Tim kiếm phương thức bầu cử thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async search(@Body() searchDto: VotingMethodSearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.votingMethodsService.search(searchDto);
      return BaseResponse.success(resData, MESSAGE.VOTING_METHOD_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo phương thức bầu cử' })
  @ApiResponse({ status: 201, description: 'Tạo phương thức bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createVotingMethodDto: CreateVotingMethodDto,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.votingMethodsService.create(createVotingMethodDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.VOTING_METHOD_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật phương thức bầu cử' })
  @ApiResponse({ status: 200, description: 'Cập nhật phương thức bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string,
    @Body() updateVotingMethodDto: UpdateVotingMethodDto,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.votingMethodsService.update(id, updateVotingMethodDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.VOTING_METHOD_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}
