import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req } from '@nestjs/common';
import { ElectionTypesService } from './election-types.service';
import { CreateElectionTypeDto } from './dto/create-election-type.dto';
import { UpdateElectionTypeDto } from './dto/update-election-type.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';

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
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm loại bầu cử' })
  @ApiResponse({ status: 200, description: 'Tìm kiếm loại bầu cử thành công.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async searchElectionTypes(
    @Body() req: BaseSearchDTO
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionTypesService.search(req);
      return BaseResponse.success(resData, MESSAGE.ELECTION_TYPE_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }


  @Post()
  @ApiOperation({ summary: 'Tạo loại bầu cử' })
  @ApiResponse({ status: 200, description: 'Loại bầu cử đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createElectionTypeDto: CreateElectionTypeDto,
    @Req() req: CustomRequest
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionTypesService.create(createElectionTypeDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.ELECTION_TYPE_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
