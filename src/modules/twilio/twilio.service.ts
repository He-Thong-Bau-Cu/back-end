import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private client: twilio.Twilio;
  private serviceSid: string;
  private phoneNumber: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID') || '';
    this.phoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';

    if (!accountSid || !authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured');
    }

    this.client = twilio(accountSid, authToken);
  }

  // 📨 Gửi mã OTP qua SMS
  async sendVerificationCode(phoneNumber: string) {
    if (!this.serviceSid) {
      throw new Error('TWILIO_SERVICE_SID is required for OTP verification. Please create a Verify Service in Twilio Console: https://console.twilio.com/us1/develop/verify/services');
    }

    try {
      const result = await this.client.verify.v2
        .services(this.serviceSid)
        .verifications.create({
          to: phoneNumber,
          channel: 'sms',
        });

      this.logger.log(`✅ OTP sent to ${phoneNumber}`);
      return { success: true, sid: result.sid, status: result.status };
    } catch (error: any) {
      // Xử lý lỗi đặc biệt cho trial account
      if (error?.code === 21608) {
        const errorMessage = `Số điện thoại ${phoneNumber} chưa được xác minh. Tài khoản Twilio trial chỉ có thể gửi tin nhắn đến số đã verify. Vui lòng verify số điện thoại tại: https://www.twilio.com/user/account/phone-numbers/verified hoặc nâng cấp tài khoản Twilio.`;
        this.logger.error(`❌ ${errorMessage}`);
        throw new Error(errorMessage);
      }

      this.logger.error(`❌ Error sending OTP: ${error?.message || error}`);
      throw error;
    }
  }

  // ✅ Xác minh mã OTP
  async verifyCode(phoneNumber: string, code: string) {
    if (!this.serviceSid) {
      throw new Error('TWILIO_SERVICE_SID is required for OTP verification. Please create a Verify Service in Twilio Console: https://console.twilio.com/us1/develop/verify/services');
    }

    try {
      const result = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code,
        });

      const isValid = result.status === 'approved';
      this.logger.log(`Verification for ${phoneNumber}: ${isValid}`);
      return { success: isValid, status: result.status };
    } catch (error) {
      this.logger.error(`❌ Error verifying code: ${error.message}`);
      throw error;
    }
  }

  // 💬 Gửi tin nhắn SMS thông thường
  async sendSMS(to: string, body: string) {
    if (!this.phoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER is required for sending SMS. Please configure it in your .env file.');
    }

    try {
      const message = await this.client.messages.create({
        from: this.phoneNumber,
        to,
        body,
      });

      this.logger.log(`✅ SMS sent to ${to}`);
      return { sid: message.sid, status: message.status };
    } catch (error: any) {
      // Xử lý lỗi đặc biệt cho trial account
      if (error?.code === 21608) {
        const errorMessage = `Số điện thoại ${to} chưa được xác minh. Tài khoản Twilio trial chỉ có thể gửi tin nhắn đến số đã verify. Vui lòng verify số điện thoại tại: https://www.twilio.com/user/account/phone-numbers/verified hoặc nâng cấp tài khoản Twilio.`;
        this.logger.error(`❌ ${errorMessage}`);
        throw new Error(errorMessage);
      }

      this.logger.error(`❌ Error sending SMS: ${error?.message || error}`);
      throw error;
    }
  }
}
