import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
export interface SmsResponse {
  messages: {
    to: string;
    status: {
      groupName: string;
      name: string;
      description?: string;
    };
  }[];
}


@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('INFOBIP_BASE_URL', '');
    this.apiKey = this.configService.get<string>(`INFOBIP_API_KEY`, '');
  }

  async sendSms(phone: string, message: string): Promise<SmsResponse> {
    const payload = {
      messages: [
        {
          destinations: [{ to: phone }],
          text: message,
        },
      ],
    };

      console.log('URL gửi:', `${this.baseUrl}/sms/2/text/advanced`);

    try {
      const { data } = await axios.post<SmsResponse>(
        `${this.baseUrl}/sms/2/text/advanced`,
        payload,
        {
          headers: {
            Authorization: `App ${this.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
    


      this.logger.log(`✅ SMS sent successfully: ${JSON.stringify(data)}`);
      return data;
    } catch (error: unknown) {
      if(!(error instanceof axios.AxiosError)) {
        this.logger.error(` Unexpected error type: ${String(error)}`);
       
        throw new Error('Unexpected error occurred while sending SMS');
      }else {
        this.logger.error(` Axios error: ${error.message}, Response data: ${JSON.stringify(error.response?.data)}`);
      }
      
      throw new Error(error.message);
    }
  }



  // private readonly logger = new Logger(SmsService.name);
  // private readonly apiKey: string;
  // private readonly baseUrl = 'https://api.speedsms.vn/index.php/sms/send';

  // constructor(private readonly configService: ConfigService) {
  //   this.apiKey = this.configService.get<string>('SPEEDSMS_API_KEY') || '';
  // }

 // Gửi OTP hoặc SMS
  // async sendSMS(to: string, content: string) {
  //   try {
  //     const response = await axios.post(
  //       `https://api.speedsms.vn/index.php/sms/send/send`,
  //       {
  //         to, // số điện thoại nhận
  //         content, // nội dung tin nhắn
  //         type: 1, // 1 = tin nhắn thường, 2 = tin nhắn brandname, 3 = OTP
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer 7TpvYga0T0bNLrD3lw86LEMRs8BgfC0H`,
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     this.logger.log('SMS gửi thành công: ' + JSON.stringify(response.data));
     
  //   } catch (error:unknown) {
  //    if (error instanceof Error) {
  //         this.logger.error(`Failed to send SMS: ${error.message}`);
  //       } else {
  //         this.logger.error(`Unknown error when sending SMS to ${to}: ${String(error)}`);
  //       }
  //     throw error;
  //   }
  // }

 
}
