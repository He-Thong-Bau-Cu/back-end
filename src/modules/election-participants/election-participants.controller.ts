import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ElectionParticipantsService } from './election-participants.service';
import { CreateElectionParticipantDto } from './dto/create-election-participant.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('election-participants')
export class ElectionParticipantsController {
  constructor(private readonly electionParticipantsService: ElectionParticipantsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo người tham gia cuộc bầu cử mới' })
  @ApiResponse({ status: 201, description: 'Người tham gia cuộc bầu cử đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() electionParticipants: CreateElectionParticipantDto):Promise<BaseResponse> {
    try {

      const resData = await this.electionParticipantsService.create(electionParticipants);
      return BaseResponse.success(resData, 'Tạo người tham gia cuộc bầu cử thành công', 201);
    } catch (error) {
      throw new HttpException(
        {message: error.message},
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
  
}
