import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { DelegateCardsService } from './delegate-cards.service';
import { CreateDelegateCardDto } from './dto/create-delegate-card.dto';
import { UpdateDelegateCardDto } from './dto/update-delegate-card.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

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

}
