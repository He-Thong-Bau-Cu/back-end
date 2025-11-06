import {Injectable} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {

    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async sendMail(to: string, fullName: string, username: string, password: string) {
        const htmlTemplate = this.getHtmlTemplate(fullName, username, password);
        const info = await this.transporter.sendMail({
            from: `"Hệ thống bầu cử" <${process.env.EMAIL_USERNAME}>`,
            to,
            subject: '🎉 Chào mừng bạn đến với hệ thống!',
            html: htmlTemplate,
        });

        console.log('Email sent: %s', info.messageId);
    }

    private getHtmlTemplate(fullName: string, username: string, password: string): string {
        const createdDate = new Date().toLocaleDateString('vi-VN');
        return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9fafb;border-radius:12px;">
        <h2>Xin chào ${fullName} 👋</h2>
        <p>Tài khoản của bạn đã được tạo thành công vào ngày <b>${createdDate}</b>.</p>
        <div style="background:#fff;padding:15px;border-radius:10px;border:1px solid #e5e7eb;">
          <p><b>Tên đăng nhập:</b> ${username}</p>
          <p><b>Mật khẩu:</b> ${password}</p>
        </div>
        <p style="color:#f59e0b;font-size:14px;">⚠️ Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu để đảm bảo an toàn.</p>
        <hr/>
        <p style="font-size:13px;color:#6b7280;">Nếu có thắc mắc, vui lòng liên hệ <b>employee.system.work@gmail.com</b></p>
      </div>
    `;
    }
}