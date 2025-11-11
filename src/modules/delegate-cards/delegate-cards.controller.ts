import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Req } from '@nestjs/common';
import { DelegateCardsService } from './delegate-cards.service';
import { CreateDelegateCardDto } from './dto/create-delegate-card.dto';
import { UpdateDelegateCardDto } from './dto/update-delegate-card.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

  @Get('token')
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
}
