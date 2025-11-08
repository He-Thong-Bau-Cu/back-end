import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ElectionTypesService } from './election-types.service';
import { CreateElectionTypeDto } from './dto/create-election-type.dto';
import { UpdateElectionTypeDto } from './dto/update-election-type.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@ApiBearerAuth('access-token')
@Controller('election-types')
export class ElectionTypesController {
  constructor(private readonly electionTypesService: ElectionTypesService) { }

  @Get(':typeCode')
  @ApiOperation({ summary: 'Lấy thông tin loại bầu cử theo mã' })
  @ApiResponse({ status: 200, description: 'Thông tin loại bầu cử trả về thành công.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getElectionTypeByCode(@Param('typeCode') typeCode: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionTypesService.findOne(typeCode);
      return BaseResponse.success(resData, MESSAGE.ELECTION_TYPE_GET_BY_CODE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        500,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo loại bầu cử' })
  @ApiResponse({ status: 200, description: 'Loại bầu cử đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createElectionTypeDto: CreateElectionTypeDto): Promise<BaseResponse> {
    try {
      const resData = await this.electionTypesService.create(createElectionTypeDto);
      return BaseResponse.success(resData, MESSAGE.ELECTION_TYPE_CREATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        500,
      );
    }
  }

}
