import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ElectionParticipantsService } from './election-participants.service';
import { CreateElectionParticipantDto } from './dto/create-election-participant.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('election-participants')
export class ElectionParticipantsController {
  constructor(private readonly electionParticipantsService: ElectionParticipantsService) { }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin của người tham gia cuộc bầu cử theo ID' })
  @ApiResponse({ status: 201, description: 'Lấy thông tin của người tham gia cuộc bầu cử theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param(':id') id: string): Promise<BaseResponse> {
    try {

      const resData = await this.electionParticipantsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_GET_BY_ID, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy thông tin của người tham gia cuộc bầu cử theo ID' })
  @ApiResponse({ status: 201, description: 'Lấy thông tin của người tham gia cuộc bầu cử theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElection(@Param(':electionId') electionId: string): Promise<BaseResponse> {
    try {

      const resData = await this.electionParticipantsService.getByElection(electionId);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_GET_BY_ELECTION, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }


  @Post()
  @ApiOperation({ summary: 'Tạo người tham gia cuộc bầu cử mới' })
  @ApiResponse({ status: 201, description: 'Người tham gia cuộc bầu cử đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() electionParticipants: CreateElectionParticipantDto): Promise<BaseResponse> {
    try {

      const resData = await this.electionParticipantsService.create(electionParticipants);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

}
