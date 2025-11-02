import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put } from '@nestjs/common';
import { VotingRightsService } from './voting-rights.service';
import { CreateVotingRightDto } from './dto/create-voting-right.dto';
import { UpdateVotingRightDto } from './dto/update-voting-right.dto';
import Api from 'twilio/lib/rest/Api';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('voting-rights')
export class VotingRightsController {
  constructor(private readonly votingRightsService: VotingRightsService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo mới quyền bầu cử' })
  @ApiResponse({ status: 201, description: 'Quyền bầu cử được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createVotingRight: CreateVotingRightDto): Promise<BaseResponse> {
    try {
      const votingRight = await this.votingRightsService.create(createVotingRight);
      return BaseResponse.success(votingRight, MESSAGE.VOTING_RIGHT_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật quyền bầu cử' })
  @ApiResponse({ status: 200, description: 'Quyền bầu cử được cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(@Param('id') id: string, @Body() updateVotingRight: UpdateVotingRightDto): Promise<BaseResponse> {
    try {
      const votingRight = await this.votingRightsService.update(id, updateVotingRight);
      return BaseResponse.success(votingRight, MESSAGE.VOTING_RIGHT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
