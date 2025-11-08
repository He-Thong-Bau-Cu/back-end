import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Put } from '@nestjs/common';
import { ElectionEntitiesService } from './election-entities.service';
import { CreateElectionEntityDto } from './dto/create-election-entity.dto';
import { UpdateElectionEntityDto } from './dto/update-election-entity.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@ApiBearerAuth('access-token')
@Controller('election-entities')
export class ElectionEntitiesController {
  constructor(private readonly electionEntitiesService: ElectionEntitiesService) { }


  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin đối tượng ứng cử theo Id' })
  @ApiResponse({ status: 200, description: 'Đối tượng ứng cử đã được lấy thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionEntitiesService.getById(id);
      return BaseResponse.success(resData, MESSAGE.ELECTION_ENTITY_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách đối tượng ứng cử theo Id kỳ bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách đối tượng ứng cử theo Id kỳ bầu cử thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionEntitiesService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.ELECTION_ENTITY_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới một kỳ bầu cử' })
  @ApiResponse({ status: 201, description: 'Kỳ bầu cử đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createElectionEntity: CreateElectionEntityDto): Promise<BaseResponse> {
    try {
      const resData = await this.electionEntitiesService.create(createElectionEntity);
      return BaseResponse.success(resData, MESSAGE.ELECTION_ENTITY_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )

    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật một entity của cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Entity của cuộc bầu cử đã được cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(@Param('id') id: string, @Body() updateElectionEntity: UpdateElectionEntityDto): Promise<BaseResponse> {
    try {
      const resData = await this.electionEntitiesService.update(id, updateElectionEntity);
      return BaseResponse.success(resData, MESSAGE.ELECTION_ENTITY_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

}
