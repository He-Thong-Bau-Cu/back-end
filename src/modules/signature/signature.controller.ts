// src/signing/signing.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException, Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SigningService } from './signature.service';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as multer from 'multer';

@Controller('signing')
export class SigningController {
  constructor(private readonly signingService: SigningService) {}

  @Post('pdf')
  @UseInterceptors(FileInterceptor('file'))
  async signPdf(
      @UploadedFile() file: Express.Multer.File,
      @Body() body: {p12Path: string, password?: string },
      @Res() res: Response
  ) {
    console.log(file)
    const pdfBuffer = file.buffer;
    const p12Buffer = fs.readFileSync(body.p12Path);
    console.log(p12Buffer);
    console.log(pdfBuffer)
    const signedPdf = await this.signingService.signPdfWithP12(
        pdfBuffer,
        p12Buffer,
        body.password,
    );
    const outPath = path.join('uploads', `signed-${file.originalname}`);
    fs.writeFileSync(outPath, signedPdf);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=signed.pdf',
    });
    res.send(signedPdf);
  }

  @Post('verify')
  @UseInterceptors(FileInterceptor('file'))
  async verifySignature(@UploadedFile() file: Express.Multer.File,){
    return await this.signingService.verifyPdfSignature(file.buffer);
  }

  @Post('word')
  @UseInterceptors(FileInterceptor('file'))
  async signWord(@UploadedFile() file: Express.Multer.File, @Body() body: { p12Path?: string; password?: string }, @Res() res: Response) {
    try {
      let p12Buffer: Buffer;
      const password = body.password || '';
      if (body.p12Path) {
        p12Buffer = fs.readFileSync(body.p12Path);
      } else {
        const certsDir = path.join(process.cwd(), 'certs');
        const p12s = fs.readdirSync(certsDir).filter(f => f.endsWith('.p12'));
        if (p12s.length === 0) return res.status(400).json({ error: 'No signer .p12 available. Use /ca/issue first.' });
        p12Buffer = fs.readFileSync(path.join(certsDir, p12s[p12s.length - 1]));
      }

      const signedBuf = await this.signingService.signDocxWithP12(file.buffer, p12Buffer, password);
      const outPath = path.join('uploads', `signed-${file.originalname}`);
      fs.writeFileSync(outPath, signedBuf);
      res.download(outPath);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }


  @Post('word-xml')
  @UseInterceptors(FileInterceptor('file'))
  async signWordXml(
      @UploadedFile() file: Express.Multer.File,
      @Body() body: { p12Path?: string; password?: string },
      @Res() res: Response,
  ) {
    try {
      if (!file) {
        return res.status(400).json({ error: 'No Word (.docx) file uploaded.' });
      }

      let p12Buffer: Buffer;
      const password = body.password || '';
      const certsDir = path.join(process.cwd(), 'certs');

      if (body.p12Path) {
        if (!fs.existsSync(body.p12Path)) {
          return res.status(400).json({ error: 'Provided .p12 path not found.' });
        }
        p12Buffer = fs.readFileSync(body.p12Path);
      } else {
        if (!fs.existsSync(certsDir)) {
          return res.status(400).json({ error: 'Cert directory not found.' });
        }
        const p12s = fs.readdirSync(certsDir).filter(f => f.endsWith('.p12'));
        if (p12s.length === 0) {
          return res.status(400).json({ error: 'No signer .p12 available. Use /ca/issue first.' });
        }
        const latestCert = path.join(certsDir, p12s[p12s.length - 1]);
        p12Buffer = fs.readFileSync(latestCert);
      }

      // Gọi service để ký
      const signedBuf = await this.signingService.signDocxXml(file.buffer, p12Buffer, password);

      // Đảm bảo thư mục uploads tồn tại
      const uploadDir = path.join(process.cwd(), 'uploads');
      const outPath = path.join(uploadDir, `signed-${file.originalname}`);
      fs.writeFileSync(outPath, signedBuf);

      // Gửi file về client
      return res.download(outPath, (err) => {
        if (err) console.error('Download error:', err);
        // Xoá file tạm nếu muốn
        // fs.unlinkSync(outPath);
      });

    } catch (err: any) {
      console.error('SignWordXml error:', err);
      return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  }
}
