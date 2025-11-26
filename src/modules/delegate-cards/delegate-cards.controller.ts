import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req, Query } from '@nestjs/common';
import { DelegateCardsService } from './delegate-cards.service';
import { CreateDelegateCardDto } from './dto/create-delegate-card.dto';
import { UpdateDelegateCardDto } from './dto/update-delegate-card.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('delegate-cards')
export class DelegateCardsController {
  constructor(private readonly delegateCardsService: DelegateCardsService) { }

  @Get('active')
  @ApiOperation({ summary: "Lấy danh sách thẻ đại biểu hoặc ủy quyền" })
  @ApiResponse({ status: 200, description: "Lấy danh sách thẻ đại biểu hoặc ủy quyền thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getDelegateCardsActive(): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.getDelegateCardsActive();
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_GET_ACTIVE_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('token/:token')
  @ApiOperation({ summary: "Lấy thẻ đại biểu hoặc thẻ ủy quyền bằng token" })
  @ApiResponse({ status: 200, description: "Lấy thẻ đại biểu hoặc thẻ ủy quyền bằng token thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getByToken(@Param('token') token: string): Promise<BaseResponse> {
    try {

      const resData = await this.delegateCardsService.getByToken(token);
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: "Lấy thẻ đại biểu hoặc ủy quyền bằng id" })
  @ApiResponse({ status: 200, description: "Lấy thẻ đại biểu hoặc ủy quyền bằng id thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: "Lấy thẻ đại biểu hoặc thẻ ủy quyền bằng id cuộc bầu cử" })
  @ApiResponse({ status: 200, description: "Lấy thẻ đại biểu hoặc thẻ ủy quyền bằng id cuộc bầu cử thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('voters/:voterId')
  @ApiOperation({ summary: "Lấy thẻ đại biểu hoặc thẻ ủy quyền bằng id cử tri" })
  @ApiResponse({ status: 200, description: "Lấy thẻ đại biểu hoặc thẻ ủy quyền bằng id cử tri thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getByVoterId(@Param('voterId') voterId: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.getByVoterId(voterId);
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_GET_BY_VOTER_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get('qrcode/:id')
  @ApiOperation({ summary: "Tạo mã QR cho thẻ đại biểu hoặc ủy quyền" })
  @ApiResponse({ status: 200, description: "Tạo mã QR cho thẻ đại biểu hoặc ủy quyền thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async generateDelegateCardQRCode(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.generateDelegateCardQRCode(id);
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_GENERATE_QR_CODE_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: "Tạo thẻ đại biểu hoặc ủy quyền" })
  @ApiResponse({ status: 201, description: "Tạo thẻ đại biểu hoặc ủy quyền thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async create(
    @Body() createDelegateCardDto: CreateDelegateCardDto,
    @Req() req: CustomRequest
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.create(createDelegateCardDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.DELEGATE_CARD_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('auto-create/:electionId')
  @ApiOperation({ summary: "Tự động tạo thẻ đại biểu cho user nếu đủ điều kiện" })
  @ApiResponse({ status: 200, description: "Kiểm tra và tạo thẻ đại biểu thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async autoCreate(
    @Param('electionId') electionId: string,
    @Req() req: CustomRequest
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegateCardsService.autoCreateDelegateCardForUser(
        req.user.sub,
        electionId
      );

      if (resData.created) {
        return BaseResponse.success(
          resData.delegateCard,
          resData.message || 'Thẻ đại biểu đã được tạo thành công.',
          HttpStatus.CREATED
        );
      } else {
        return BaseResponse.success(
          resData,
          resData.reason || 'Không thể tạo thẻ đại biểu.',
          HttpStatus.OK
        );
      }
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('check/exists')
  @ApiOperation({ summary: "Kiểm tra thẻ đại biểu đã được tạo chưa" })
  @ApiQuery({ name: 'electionId', required: true, description: 'ID cuộc bầu cử' })
  @ApiQuery({ name: 'voterId', required: true, description: 'ID cử tri' })
  @ApiQuery({ name: 'delegationId', required: false, description: 'ID ủy quyền (tùy chọn)' })
  @ApiResponse({ status: 200, description: "Kiểm tra thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async checkExists(
    @Query('electionId') electionId: string,
    @Query('voterId') voterId: string,
    @Query('delegationId') delegationId?: string
  ): Promise<{ exists: boolean }> {
    try {
      const exists = await this.delegateCardsService.checkDelegateCardExists(
        electionId,
        voterId,
        delegationId
      );
      return { exists };
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


}
