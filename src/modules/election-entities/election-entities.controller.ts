import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Put } from '@nestjs/common';
import { ElectionEntitiesService } from './election-entities.service';
import { CreateElectionEntityDto } from './dto/create-election-entity.dto';
import { UpdateElectionEntityDto } from './dto/update-election-entity.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('election-entities')
export class ElectionEntitiesController {
  constructor(private readonly electionEntitiesService: ElectionEntitiesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới một kỳ bầu cử' })
  @ApiResponse({ status: 201, description: 'Kỳ bầu cử đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createElectionEntity: CreateElectionEntityDto):Promise<BaseResponse> {
    try {
      const resData = await this.electionEntitiesService.create(createElectionEntity);
      return BaseResponse.success(resData, "Success", 201);
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
  async update(@Param('id') id: string, @Body() updateElectionEntity: UpdateElectionEntityDto):Promise<BaseResponse> {
    try {
      const resData = await this.electionEntitiesService.update(id, updateElectionEntity);
      return BaseResponse.success(resData, "Success", 200);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

}
