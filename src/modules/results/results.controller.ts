import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Put, Req } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';

@ApiBearerAuth('access-token')
@Controller('results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) { }


  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách phiếu bầu theo ID cử tri' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phiếu bầu theo ID cử tri thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.RESULT_GET_BY_VOTER_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }


  @Get(':id')
  @ApiOperation({ summary: 'Lấy kết quả theo ID' })
  @ApiResponse({ status: 200, description: "Lấy kết quả theo ID thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.RESULT_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm kết quả' })
  @ApiResponse({ status: 200, description: "Tìm kiếm kết quả thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async search(@Body() searchParams: BaseSearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.search(searchParams);
      return BaseResponse.success(resData, MESSAGE.RESULT_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo kết quả' })
  @ApiResponse({ status: 200, description: "Tạo kết quả thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async create(
    @Body() createResult: CreateResultDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.create(createResult, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.RESULT_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật kết quả' })
  @ApiResponse({ status: 200, description: "Cập nhật kết quả thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async update(
    @Param('id') id: string,
    @Body() updateResult: UpdateResultDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.update(id, updateResult, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.RESULT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
