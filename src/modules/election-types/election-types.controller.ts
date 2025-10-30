import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException } from '@nestjs/common';
import { ElectionTypesService } from './election-types.service';
import { CreateElectionTypeDto } from './dto/create-election-type.dto';
import { UpdateElectionTypeDto } from './dto/update-election-type.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('election-types')
export class ElectionTypesController {
  constructor(private readonly electionTypesService: ElectionTypesService) {}

  @Get(':typeCode')
  @ApiOperation({ summary: 'Lấy thông tin electionType by code' })
  @ApiResponse({ status: 200, description: 'Thông tin electionType trả về thành công.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getElectionTypeByCode(@Param('typeCode') typeCode:string):Promise<BaseResponse>{
    try {
      const resData  = await this.electionTypesService.findOne(typeCode);
      return BaseResponse.success(resData, "Success", 200);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        500,
      );
    }
  }

}
