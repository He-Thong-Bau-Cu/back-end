import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus, Req, Put } from '@nestjs/common';
import { ElectionParticipantsService } from './election-participants.service';
import { CreateElectionParticipantDto } from './dto/create-election-participant.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { UpdateElectionParticipantDto } from './dto/update-election-participant.dto';

@ApiBearerAuth('access-token')
@Controller('election-participants')
export class ElectionParticipantsController {
  constructor(private readonly electionParticipantsService: ElectionParticipantsService) { }

  @Get('voters/elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách người tham gia có role là VOTER' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách người tham gia có role là VOTER thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getVotersByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionParticipantsService.getParticipantsAsVoter(electionId);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_GET_VOTERS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin của người tham gia cuộc bầu cử theo ID' })
  @ApiResponse({ status: 201, description: 'Lấy thông tin của người tham gia cuộc bầu cử theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
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
  @ApiOperation({ summary: 'Lấy danh sách thông tin của người tham gia theo cuộc bầu cử' })
  @ApiResponse({ status: 201, description: 'Lấy danh sách thông tin của người tham gia theo cuộc bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElection(@Param('electionId') electionId: string): Promise<BaseResponse> {
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

  @Get('users/:userId')
  @ApiOperation({ summary: 'Lấy danh sách các cuộc bầu cử của người dùng' })
  @ApiResponse({ status: 201, description: 'Lấy danh sách các cuộc bầu cử của người dùng thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByUser(@Param('userId') userId: string): Promise<BaseResponse> {
    try {

      const resData = await this.electionParticipantsService.getByUserId(userId);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_GET_BY_USER_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('active/elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách người tham gia đang hoạt động theo cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách người tham gia đang hoạt động theo cuộc bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getActiveByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionParticipantsService.getParticipantsActive(electionId);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_GET_ACTIVE_BY_ELECTION, HttpStatus.OK);
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
  async create(
    @Body() electionParticipants: CreateElectionParticipantDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {

      const resData = await this.electionParticipantsService.create(electionParticipants, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá người tham gia cuộc bầu cử theo ID' })
  @ApiResponse({ status: 200, description: 'Xoá người tham gia cuộc bầu cử theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async delete(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionParticipantsService.delete(id);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_DELETE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật người tham gia cuộc bầu cử theo ID' })
  @ApiResponse({ status: 200, description: 'Cập nhật người tham gia cuộc bầu cử theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string,
    @Body() updateElectionParticipantDto: UpdateElectionParticipantDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.electionParticipantsService.update(id, updateElectionParticipantDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.ELECTION_PARTICIPANT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }


}
