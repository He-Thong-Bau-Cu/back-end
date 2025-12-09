import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { SignerInfo } from 'src/common/dto/singerInfo.dot';
import { PassThrough } from 'stream';
import archiver from 'archiver';
import { MailService } from '../mail/mail.service';
import { getCurrentDateVN } from 'src/common/utils/format';
import { execSync } from 'child_process';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from 'src/database/schemas/users.schema';
import { Model, Types } from 'mongoose';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';

const CERTS_DIR = path.join(process.cwd(), 'certs');

@Injectable()
export class CaService {
  rootKeyPath = path.join(CERTS_DIR, 'rootCA-key.pem');
  rootCertPath = path.join(CERTS_DIR, 'rootCA-crt.pem');

  constructor(
    private readonly mailService: MailService,
    @InjectModel(Users.name)
    private readonly usersModel: Model<UserDocument>,
    private readonly uploadService: MinioService
  ) {
    if (!fs.existsSync(CERTS_DIR)) fs.mkdirSync(CERTS_DIR, { recursive: true });
  }

  ensureRootCA(): { created: boolean; message: string } {
    if (fs.existsSync(this.rootKeyPath) && fs.existsSync(this.rootCertPath)) {
      return { created: false, message: 'Root CA already exists' };
    }

    const keys = forge.pki.rsa.generateKeyPair(4096);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = Date.now().toString();
    cert.validity.notBefore = getCurrentDateVN();
    cert.validity.notAfter = getCurrentDateVN();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

    const attrs = [
      { name: 'commonName', value: 'SEP490_G52' },
      { name: 'organizationName', value: 'HE_THONG_BAU_CU' },
      { name: 'countryName', value: 'VN' },
      { name: 'stateOrProvinceName', value: 'HOA_LAC-HA_NOI' },
      { name: 'localityName', value: 'HOA_LAC' },
      { name: 'emailAddress', value: 'hethongbaucu.work@gmail.com' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      { name: 'basicConstraints', cA: true },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        cRLSign: true,
      },
      { name: 'subjectKeyIdentifier' },
    ]);

    // self-sign
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // write to files (PEM)
    fs.writeFileSync(this.rootKeyPath, forge.pki.privateKeyToPem(keys.privateKey), { mode: 0o600 });
    fs.writeFileSync(this.rootCertPath, forge.pki.certificateToPem(cert));

    return { created: true, message: 'Root CA created' };
  }

  async issueSigner(signerInfo: SignerInfo, password: string, userId?: string) {
    console.log(userId)
    const user = await this.usersModel.findById(new Types.ObjectId(userId));
    if(!user){
      throw new Error('Không tìm thấy người dùng!!!');
    }
    const id = `${signerInfo.commonName.replace(/\s+/g, '_')}_${Date.now()}`;
    const userDir = path.join(CERTS_DIR, id);
    fs.mkdirSync(userDir, { recursive: true });

    // Các file tạm
    const keyPath = path.join(userDir, 'signer.key');
    const csrPath = path.join(userDir, 'signer.csr');
    const certPath = path.join(userDir, 'signer.crt');
    const p12Path = path.join(userDir, 'signer.p12');
    const chainPath = path.join(userDir, 'chain.pem');

    // 1. Copy RootCA vào thư mục
    const rootKeyPath = path.join(userDir, 'rootCA.key');
    const rootCertPath = path.join(userDir, 'rootCA.crt');
    fs.copyFileSync(this.rootKeyPath, rootKeyPath);
    fs.copyFileSync(this.rootCertPath, rootCertPath);

    // 2. Generate private key
    execSync(`openssl genrsa -out ${keyPath} 2048`);

    // 3. CSR config
    const csrConf = `
      [req]
      prompt = no
      distinguished_name = dn

      [dn]
      C=${signerInfo.countryName || 'VN'}
      ST=${signerInfo.stateOrProvinceName || 'HN'}
      L=${signerInfo.localityName || 'Hanoi'}
      O=${signerInfo.organizationName}
      OU=Digital Signer
      CN=${signerInfo.commonName}
      emailAddress=${signerInfo.emailAddress}
      `;

    const csrConfPath = path.join(userDir, 'csr.conf');
    fs.writeFileSync(csrConfPath, csrConf);

    // 4. Generate CSR
    execSync(`openssl req -new -key ${keyPath} -out ${csrPath} -config ${csrConfPath}`);

    // 5. Sign cert using RootCA
    execSync(
      `openssl x509 -req -in ${csrPath} -CA ${rootCertPath} -CAkey ${rootKeyPath} -CAcreateserial -out ${certPath} -days 730 -sha256`,
    );

    // 6. Create chain.pem
    const chainPem = `
${fs.readFileSync(certPath)}
${fs.readFileSync(rootCertPath)}
`;
    fs.writeFileSync(chainPath, chainPem);

    // 7. Create PKCS#12 (ổn định tuyệt đối)
    execSync(
      `openssl pkcs12 -export -inkey ${keyPath} -in ${certPath} -certfile ${rootCertPath} -out ${p12Path} -passout pass:${password}`,
    );

    // 8. Gói ZIP
    const zipBuffer = await this.createZipBuffer({
      [`${id}.p12`]: fs.readFileSync(p12Path),
      [`${id}.key.pem`]: fs.readFileSync(keyPath, 'utf8'),
      [`${id}.crt.pem`]: fs.readFileSync(certPath, 'utf8'),
      [`${id}.chain.pem`]: chainPem,
    });

    // 9. Gửi mail
    await this.mailService.sendCaTemplate(
      signerInfo.emailAddress,
      zipBuffer,
      `${id}.zip`,
      signerInfo.commonName,
    );

    // Upload p12 lên MinIO và lưu key vào user.signCa, bật cờ issueCa
    const upload = await this.uploadService.uploadSignedPdf(
      FileType.CA,
      (user as any)._id.toString(),
      fs.readFileSync(p12Path),
    );
    if (upload?.key) {
      user.signCa = upload.key;
      user.issueCa = true;
      await user.save();
    }

    return { signerInfo, signCa: user.signCa };
  }

  listSigners() {
    const files = fs.readdirSync(CERTS_DIR).filter((f) => f.endsWith('.p12'));
    return files;
  }

  getRootCertPem() {
    if (!fs.existsSync(this.rootCertPath)) return null;
    return fs.readFileSync(this.rootCertPath, 'utf8');
  }

  private async createZipBuffer(files: Record<string, Buffer | string>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } });
      const zipStream = new PassThrough();
      const chunks: Buffer[] = [];

      zipStream.on('data', (chunk) => chunks.push(chunk));
      zipStream.on('end', () => resolve(Buffer.concat(chunks)));
      zipStream.on('error', (err) => reject(err));

      archive.pipe(zipStream);

      for (const [filename, data] of Object.entries(files)) {
        archive.append(data, { name: filename });
      }

      archive.finalize();
    });
  }
}
