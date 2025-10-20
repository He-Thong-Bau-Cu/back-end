import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}


  @Post('send')
  async sendSms(@Body() body:{ to: string; message: string }) {
    const { to, message } = body;
    return this.smsService.sendSms(to, message);
  }




}
