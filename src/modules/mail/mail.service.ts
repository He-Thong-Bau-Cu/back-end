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

    async sendPasswordResetMail(to: string, fullName: string, username: string, password: string) {
        const htmlTemplate = this.getPasswordResetHtmlTemplate(fullName, username, password);
        const info = await this.transporter.sendMail({
            from: `"Hệ thống bầu cử" <${process.env.EMAIL_USERNAME}>`,
            to,
            subject: '🔐 Mật khẩu mới của bạn',
            html: htmlTemplate,
        });

        console.log('Password reset email sent: %s', info.messageId);
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

    async sendOtpMail(to: string, fullName: string, otp: string) {
        const htmlTemplate = this.getOtpHtmlTemplate(fullName, otp);
        const info = await this.transporter.sendMail({
            from: `"Hệ thống bầu cử" <${process.env.EMAIL_USERNAME}>`,
            to,
            subject: '🔐 Mã xác thực OTP của bạn',
            html: htmlTemplate,
        });

        console.log('OTP email sent: %s', info.messageId);
    }

    private getPasswordResetHtmlTemplate(fullName: string, username: string, password: string): string {
        const resetDate = new Date().toLocaleDateString('vi-VN');
        return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9fafb;border-radius:12px;">
        <h2>Xin chào ${fullName} 👋</h2>
        <p>Bạn đã yêu cầu đặt lại mật khẩu vào ngày <b>${resetDate}</b>.</p>
        <div style="background:#fff;padding:15px;border-radius:10px;border:1px solid #e5e7eb;">
          <p><b>Tên đăng nhập:</b> ${username}</p>
          <p><b>Mật khẩu mới:</b> ${password}</p>
        </div>
        <p style="color:#f59e0b;font-size:14px;">⚠️ Vui lòng đổi mật khẩu sau khi đăng nhập để đảm bảo an toàn.</p>
        <p style="color:#ef4444;font-size:14px;">🔒 Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ ngay với chúng tôi.</p>
        <hr/>
        <p style="font-size:13px;color:#6b7280;">Nếu có thắc mắc, vui lòng liên hệ <b>employee.system.work@gmail.com</b></p>
      </div>
    `;
    }

    private getOtpHtmlTemplate(fullName: string, otp: string): string {
        const sentDate = new Date().toLocaleDateString('vi-VN');
        const sentTime = new Date().toLocaleTimeString('vi-VN');
        return `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#f9fafb;border-radius:12px;">
        <h2>Xin chào ${fullName} 👋</h2>
        <p>Bạn đã yêu cầu mã xác thực OTP vào ngày <b>${sentDate}</b> lúc <b>${sentTime}</b>.</p>
        <div style="background:#fff;padding:20px;border-radius:10px;border:2px solid #7cb342;text-align:center;margin:20px 0;">
          <p style="font-size:14px;color:#666;margin-bottom:10px;">Mã xác thực OTP của bạn:</p>
          <p style="font-size:32px;font-weight:bold;color:#7cb342;letter-spacing:8px;margin:0;">${otp}</p>
        </div>
        <p style="color:#f59e0b;font-size:14px;">⚠️ Mã OTP có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p style="color:#ef4444;font-size:14px;">🔒 Nếu bạn không yêu cầu mã xác thực, vui lòng liên hệ ngay với chúng tôi.</p>
        <hr/>
        <p style="font-size:13px;color:#6b7280;">Nếu có thắc mắc, vui lòng liên hệ <b>employee.system.work@gmail.com</b></p>
      </div>
    `;
    }
}
