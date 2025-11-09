import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put, Req } from '@nestjs/common';
import { VotingRightsService } from './voting-rights.service';
import { CreateVotingRightDto } from './dto/create-voting-right.dto';
import { UpdateVotingRightDto } from './dto/update-voting-right.dto';
import Api from 'twilio/lib/rest/Api';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('voting-rights')
export class VotingRightsController {
  constructor(private readonly votingRightsService: VotingRightsService) { }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin quyền bầu cử theo ID' })
  @ApiResponse({ status: 200, description: 'Quyền bầu cử được lấy thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const votingRight = await this.votingRightsService.getById(id);
      return BaseResponse.success(votingRight, MESSAGE.VOTING_RIGHT_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách quyền bầu cử theo ID cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách quyền bầu cử theo ID cuộc bầu cử thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const votingRights = await this.votingRightsService.getByElectionId(electionId);
      return BaseResponse.success(votingRights, MESSAGE.VOTING_RIGHT_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('voters/:voterId')
  @ApiOperation({ summary: 'Lấy danh sách quyền bầu cử theo ID cử tri' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách quyền bầu cử theo ID cử tri thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByVoterId(@Param('voterId') voterId: string): Promise<BaseResponse> {
    try {
      const votingRights = await this.votingRightsService.getByVoterId(voterId);
      return BaseResponse.success(votingRights, MESSAGE.VOTING_RIGHT_GET_BY_VOTER_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới quyền bầu cử' })
  @ApiResponse({ status: 201, description: 'Quyền bầu cử được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create( 
    @Body() createVotingRight: CreateVotingRightDto,
    @Req() req:CustomRequest): Promise<BaseResponse> {
    try {
      const votingRight = await this.votingRightsService.create(createVotingRight, req.user.sub);
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
  async update(
    @Param('id') id: string, 
    @Body() updateVotingRight: UpdateVotingRightDto,
    @Req() req:CustomRequest): Promise<BaseResponse> {
    try {
      const votingRight = await this.votingRightsService.update(id, updateVotingRight, req.user.sub);
      return BaseResponse.success(votingRight, MESSAGE.VOTING_RIGHT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
