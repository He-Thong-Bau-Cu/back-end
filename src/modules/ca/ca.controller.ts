import { Body, Controller, Post } from '@nestjs/common';
import { CaService } from './ca.service';
import { SignerInfo } from 'src/common/dto/singerInfo.dot';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Controller('ca')
export class CaController {
  constructor(private readonly caService: CaService) { }

  @Post('init')
  initRootCA() {
    return this.caService.ensureRootCA();
  }

  @Post('issue')
  issue(@Body() body: { signerInfo: SignerInfo; password: string }) {
    const signerInfo = body.signerInfo;
    const password = body.password;
    if (!signerInfo || !password) {
      throw new Error(MESSAGE.MISSING_SIGNER_OR_PASSWORD);
    }
    const resData = this.caService.issueSigner(signerInfo, password);
    return {
      message: 'Signer certificate issued',
      p12Path: resData.p12Path,
      pemCertPath: resData.pemCertPath,
      pemKeyPath: resData.pemKeyPath,
    };
  }
}