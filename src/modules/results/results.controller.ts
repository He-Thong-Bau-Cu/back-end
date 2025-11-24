import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Put, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ResultsService } from './results.service';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';


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

  @Get('election-cumulative/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách kết quả bầu cử hình thức Cumulative theo ID cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách kết quả bầu cử hình thức Cumulative theo ID cuộc bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getCumulativeResultsByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.getWinnersCumulative(electionId);
      return BaseResponse.success(resData, MESSAGE.RESULT_GET_CUMULATIVE_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('election-yes-no/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách kết quả bầu cử hình thức Yes/No/Abstain theo ID cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách kết quả bầu cử hình thức Yes/No/Abstain theo ID cuộc bầu cử thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getYesNoResultsByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.resultsService.getWinnersYesNo(electionId);
      return BaseResponse.success(resData, MESSAGE.RESULT_GET_YES_NO_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('sign')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Ký kết quả bầu cử' })
  @ApiResponse({ status: 200, description: "Ký kết quả bầu cử thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        password: { type: 'string' },
        electionId: { type: 'string' }

      },
      required: ['file', 'password', 'electionId'],
    },
  })
  async signResult(
    @UploadedFile() fileP12: Express.Multer.File,
    @Body('password') password: string,
    @Body('electionId') electionId: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const signFilePath = await this.resultsService.createAndSign(fileP12, password, electionId, req.user.sub);
      return BaseResponse.success({ signedFilePath: signFilePath }, MESSAGE.RESULT_SIGN_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}