import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: '12345' });

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    process.env.EMAIL_USERNAME = 'test@gmail.com';
    process.env.EMAIL_PASSWORD = 'password123';
    process.env.FRONTEND_URL = 'http://localhost:3000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get(MailService);
  });

  // =====================================================
  // 1. sendMail
  // =====================================================
  it('should send normal mail', async () => {
    await service.sendMail('a@gmail.com', 'John', 'john123', 'pass123');

    expect(sendMailMock).toHaveBeenCalled();
    expect(sendMailMock.mock.calls[0][0]).toMatchObject({
      to: 'a@gmail.com',
      subject: expect.any(String),
      html: expect.any(String),
    });
  });

  // =====================================================
  // 2. sendMailInvitation
  // =====================================================
  it('should send invitation mail', async () => {
    await service.sendMailInvitation(
      'a@gmail.com',
      'John',
      'john123',
      'pass123',
      'TOKEN_ABC',
    );

    expect(sendMailMock).toHaveBeenCalled();
  });

  // =====================================================
  // 3. sendMailDelegateCard (with PDF attachment)
  // =====================================================
  it('should send delegate card mail with PDF', async () => {
    await service.sendMailDelegateCard(
      'test@gmail.com',
      'John',
      'Election 2024',
      '/tmp/card.pdf',
    );

    expect(sendMailMock).toHaveBeenCalled();
    expect(sendMailMock.mock.calls[0][0].attachments[0]).toMatchObject({
      filename: 'the-dai-bieu.pdf',
      path: '/tmp/card.pdf',
    });
  });

  // =====================================================
  // 4. sendPasswordResetMail
  // =====================================================
  it('should send password reset email', async () => {
    await service.sendPasswordResetMail(
      'test@gmail.com',
      'John',
      'john123',
      'pass123',
    );
    expect(sendMailMock).toHaveBeenCalled();
  });

  // =====================================================
  // 5. sendMailDelegatge
  // =====================================================
  it('should send delegate account email', async () => {
    await service.sendMailDelegatge('a@gmail.com', 'John', 'john', '123456');
    expect(sendMailMock).toHaveBeenCalled();
  });

  // =====================================================
  // 6. sendOtpMail
  // =====================================================
  it('should send OTP mail', async () => {
    await service.sendOtpMail('a@gmail.com', 'John', '999999');
    expect(sendMailMock).toHaveBeenCalled();
  });

  // =====================================================
  // 7. sendCaTemplate (zip buffer)
  // =====================================================
  it('should send CA template with zip file', async () => {
    await service.sendCaTemplate(
      'test@gmail.com',
      Buffer.from('zipcontent'),
      'cert.zip',
      'John',
    );

    expect(sendMailMock).toHaveBeenCalled();
    expect(sendMailMock.mock.calls[0][0].attachments[0]).toMatchObject({
      filename: 'cert.zip',
      contentType: 'application/zip',
    });
  });
});
