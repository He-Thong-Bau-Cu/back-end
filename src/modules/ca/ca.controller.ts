import { Body, Controller, HttpException, HttpStatus, Post, Req } from '@nestjs/common';
import { CaService } from './ca.service';
import { SignerInfo } from 'src/common/dto/singerInfo.dot';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('ca')
export class CaController {
  constructor(private readonly caService: CaService) {}

  @Post('init')
  initRootCA() {
    return this.caService.ensureRootCA();
  }

  @Post('issue')
  async issue(@Body() body: { signerInfo: SignerInfo; password: string }, @Req() req: CustomRequest) {
    try {
      const signerInfo = body.signerInfo;
      const password = body.password;
      if (!signerInfo || !password) {
        throw new Error(MESSAGE.MISSING_SIGNER_OR_PASSWORD);
      }
      const resData = await this.caService.issueSigner(signerInfo, password, req.user.sub);
      return BaseResponse.success(
        resData,
        'Đăng kí chứng thư số thành công, vui lòng kiểm tra email của bạn!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
