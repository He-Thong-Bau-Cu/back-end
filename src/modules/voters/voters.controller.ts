import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put } from '@nestjs/common';
import { VotersService } from './voters.service';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('voters')
export class VotersController {
  constructor(private readonly votersService: VotersService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo mới cử tri' })
  @ApiResponse({ status: 201, description: 'Cử tri được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createVoter: CreateVoterDto): Promise<BaseResponse> {
    try {
      const resData = await this.votersService.create(createVoter);
      return BaseResponse.success(resData, MESSAGE.VOTER_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật cử tri' })
  @ApiResponse({ status: 200, description: 'Cử tri được cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(@Param('id') id: string, @Body() updateVoter: UpdateVoterDto): Promise<BaseResponse> {
    try {
      const resData = await this.votersService.update(id, updateVoter);
      return BaseResponse.success(resData, MESSAGE.VOTER_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  //Danh sách cử tri đủ điều kiện phát hành phiếu
  @Get('eligible/:electionId')
  @ApiOperation({ summary: 'Danh sách cử tri đủ điều kiện phát hành phiếu' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cử tri đủ điều kiện phát hành phiếu thành công.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getEligibleVoters(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.votersService.getEligibleVoters(electionId);
      return BaseResponse.success(resData, MESSAGE.VOTER_GET_ELIGIBLE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cử tri' })
  @ApiResponse({ status: 200, description: 'Cử tri được xóa thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async delete(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.votersService.delete(id);
      return BaseResponse.success(resData, MESSAGE.ROLE_DELETE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách cử tri theo cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cử tri theo cuộc bầu cử thành công.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.votersService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.VOTER_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
