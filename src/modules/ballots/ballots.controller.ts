import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpException, Put, Req, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BallotsService } from './ballots.service';
import { CreateBallotDto } from './dto/create-ballot.dto';
import { UpdateBallotDto } from './dto/update-ballot.dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProduces, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import * as fs from "fs";
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerifyOtpDto } from 'src/common/dto/verify-otp.dto';


@ApiBearerAuth('access-token')
@Controller('ballots')
export class BallotsController {
  constructor(private readonly ballotsService: BallotsService) { }

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

  @Get('cast/voters/:voterId')
  @ApiOperation({ summary: "Lấy danh sách phiếu bầu đã bỏ theo ID cử tri" })
  @ApiResponse({ status: 200, description: 'Lấy danh sách phiếu bầu cử tri đã bỏ phiếu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getCastBallotsByVoterId(@Param('voterId') voterId: string): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.getByVoterAndCast(voterId);
      return BaseResponse.success(resData, MESSAGE.BALLOT_GET_BY_VOTER_CAST_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('statistics/elections/:electionId')
  @ApiOperation({ summary: 'Lấy thống kê phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getStatistics(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.getStatistics(electionId);
      return BaseResponse.success(resData, MESSAGE.BALLOT_STATISTICS_SUCCESS, HttpStatus.OK);
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

  @Patch('status/:id')
  @ApiOperation({ summary: 'Cập nhật trạng thái phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async updateStatus(
    @Param('id') id: string,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.updateStatus(id, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.BALLOT_UPDATE_STATUS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Tìm kiếm phiếu bầu thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async searchBallots(@Body() req: BaseSearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.ballotsService.searchBallots(req);
      return BaseResponse.success(resData, MESSAGE.BALLOT_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('pdf/:id')
  @ApiOperation({ summary: 'Tải phiếu bầu dưới dạng PDF' })
  @ApiResponse({ status: 200, description: 'Tải phiếu bầu dưới dạng PDF thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getBallotPDF(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const pdfBuffer = await this.ballotsService.generateBallotPDF(id);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=ballot_${id}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }




  @Post('sign')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Ký phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Ký phiếu bầu thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
        password: {
          type: 'string',
        },
      },
      required: ['id', 'file', 'password'],
    },
  })
  async signBallot(
    @UploadedFile() fileP12: Express.Multer.File,
    @Body('id') id: string,
    @Body('password') password: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const signedFilePath = await this.ballotsService.signBallot(fileP12, id, password, req.user.sub);

      return BaseResponse.success(signedFilePath, MESSAGE.BALLOT_SIGN_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('verify-otp/:id')
  @ApiOperation({ summary: 'Xác thực OTP để ký phiếu bầu' })
  @ApiResponse({ status: 200, description: 'Xác thực OTP thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async verifyOtp(
    @Param('id') id: string,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    try {
      const resData = await this.ballotsService.verifyOtp(id, verifyOtpDto);
      return BaseResponse.success(resData, MESSAGE.BALLOT_OTP_VERIFY_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }




}