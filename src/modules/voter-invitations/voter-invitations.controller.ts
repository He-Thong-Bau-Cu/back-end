import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException } from '@nestjs/common';
import { VoterInvitationsService } from './voter-invitations.service';
import { CreateVoterInvitationDto } from './dto/create-voter-invitation.dto';
import { UpdateVoterInvitationDto } from './dto/update-voter-invitation.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('voter-invitations')
export class VoterInvitationsController {
  constructor(private readonly voterInvitationsService: VoterInvitationsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin lời mời cử tri theo ID' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin lời mời cử tri thành công.' })
  @ApiResponse({ status: 404, description: 'Lời mời cử tri không tồn tại.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi máy chủ nội bộ.' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.voterInvitationsService.getById(id);
      return BaseResponse.success(
        resData,
        MESSAGE.VOTER_INVITATION_GET_BY_ID_SUCCESS,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        {message:error.message},
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }


@Get('elections/:electionId')
@ApiOperation({ summary: 'Lấy thông tin lời mời cử tri theo ID cuộc bầu cử' })
@ApiResponse({ status: 200, description: 'Lấy thông tin lời mời cử tri thành công.' })
@ApiResponse({ status: 404, description: 'Lời mời cử tri không tồn tại.' })
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
@ApiResponse({ status: 500, description: 'Lỗi máy chủ nội bộ.' })
async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
  try {
    const resData = await this.voterInvitationsService.getByElectionId(electionId);
    return BaseResponse.success(
      resData,
      MESSAGE.VOTER_INVITATION_GET_BY_ELECTION_SUCCESS,
      HttpStatus.OK,
    );
  } catch (error) {
    throw new HttpException(
      {message:error.message},
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

@Get('voters/:voterId')
@ApiOperation({ summary: 'Lấy thông tin lời mời cử tri theo ID cử tri' })
@ApiResponse({ status: 200, description: 'Lấy thông tin lời mời cử tri thành công.' })
@ApiResponse({ status: 404, description: 'Lời mời cử tri không tồn tại.' })
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
@ApiResponse({ status: 500, description: 'Lỗi máy chủ nội bộ.' })
async getByVoterId(@Param('voterId') voterId: string): Promise<BaseResponse> {
  try {
    const resData = await this.voterInvitationsService.getByVoterId(voterId);
    return BaseResponse.success(
      resData,
      MESSAGE.VOTER_INVITATION_GET_BY_VOTER_SUCCESS,
      HttpStatus.OK,
    );
  } catch (error) {
    throw new HttpException(
      {message:error.message},
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

@Post()
@ApiOperation({ summary: 'Tạo lời mời cử tri' })
@ApiResponse({ status: 201, description: 'Tạo lời mời cử tri thành công.' })
@ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
@ApiResponse({ status: 500, description: 'Lỗi máy chủ nội bộ.' })
async create(@Body() createVoterInvitationDto: CreateVoterInvitationDto): Promise<BaseResponse> {
  try {
    const resData = await this.voterInvitationsService.create(createVoterInvitationDto);
    return BaseResponse.success(
      resData,
      MESSAGE.VOTER_INVITATION_CREATE_SUCCESS,
      HttpStatus.CREATED,
    );
  } catch (error) {
    throw new HttpException(
      {message:error.message},
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}

}
