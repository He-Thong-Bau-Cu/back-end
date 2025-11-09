import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Put, Req } from '@nestjs/common';
import { BallotsService } from './ballots.service';
import { CreateBallotDto } from './dto/create-ballot.dto';
import { UpdateBallotDto } from './dto/update-ballot.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('ballots')
export class BallotsController {
  constructor(private readonly ballotsService: BallotsService) { }

  @Get('elections/:electionId')
  @ApiOperation({ summary: "Lấy danh sách phiếu bầu theo ID cuộc bầu cử" })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phiếu bầu theo ID cuộc bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getBallotsByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.BALLOT_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('voters/:voterId')
  @ApiOperation({ summary: "Lấy danh sách phiếu bầu theo ID cử tri" })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phiếu bầu theo ID cử tri thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getBallotsByVoterId(@Param('voterId') voterId: string): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.getByVoterId(voterId);
      return BaseResponse.success(resData, MESSAGE.BALLOT_GET_BY_VOTER_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getStatistics(): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.getStatistics();
      return BaseResponse.success(resData, MESSAGE.BALLOT_STATISTICS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }


  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phiếu bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phiếu bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getAll(): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.findAll();
      return BaseResponse.success(resData, MESSAGE.BALLOT_GET_ALL_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy phiếu bầu theo Id' })
  @ApiResponse({ status: 200, description: 'Lấy phiếu bầu theo Id thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.BALLOT_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Tạo phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createBallotDto: CreateBallotDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.create(createBallotDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.BALLOT_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Cập nhật phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string, 
    @Body() updateBallot: UpdateBallotDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.update(id, updateBallot, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.BALLOT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }



  @Delete(':id')
  @ApiOperation({ summary: 'Xóa phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Xóa phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async delete(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.delete(id);
      return BaseResponse.success(resData, MESSAGE.BALLOT_DELETE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
