import { Injectable } from '@nestjs/common';
import * as forge from 'node-forge';
import * as fs from 'fs';
import * as path from 'path';
import { SignerInfo } from 'src/common/dto/singerInfo.dot';

const CERTS_DIR = path.join(process.cwd(), 'certs');

@Injectable()
export class CaService {
  rootKeyPath = path.join(CERTS_DIR, 'rootCA-key.pem');
  rootCertPath = path.join(CERTS_DIR, 'rootCA-crt.pem');

  constructor() {
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
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
      cert.validity.notBefore.getFullYear() + 10,
    );

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
    fs.writeFileSync(
      this.rootKeyPath,
      forge.pki.privateKeyToPem(keys.privateKey),
      { mode: 0o600 },
    );
    fs.writeFileSync(this.rootCertPath, forge.pki.certificateToPem(cert));

    return { created: true, message: 'Root CA created' };
  }

  issueSigner(signerInfo: SignerInfo, password: string) {
    // load root
    const rootKeyPem = fs.readFileSync(this.rootKeyPath, 'utf8');
    const rootCertPem = fs.readFileSync(this.rootCertPath, 'utf8');
    const rootKey = forge.pki.privateKeyFromPem(rootKeyPem);
    const rootCert = forge.pki.certificateFromPem(rootCertPem);

    const keys = forge.pki.rsa.generateKeyPair(2048);
    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keys.publicKey;
    csr.setSubject([
      { name: 'commonName', value: signerInfo.commonName },
      { name: 'organizationName', value: signerInfo.organizationName },
      { name: 'countryName', value: signerInfo.countryName },
      { name: 'stateOrProvinceName', value: signerInfo.stateOrProvinceName },
      { name: 'localityName', value: signerInfo.localityName },
      { name: 'emailAddress', value: signerInfo.emailAddress },
    ]);
    csr.sign(keys.privateKey, forge.md.sha256.create());

    const cert = forge.pki.createCertificate();
    cert.serialNumber = Date.now().toString();
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(
      cert.validity.notBefore.getFullYear() + 2,
    );
    cert.publicKey = csr.publicKey;
    cert.setSubject(csr.subject.attributes);
    cert.setIssuer(rootCert.subject.attributes);
    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      {
        name: 'keyUsage',
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
      },
      { name: 'subjectKeyIdentifier' },
    ]);
    cert.sign(rootKey, forge.md.sha256.create());

    const signerKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const signerCertPem = forge.pki.certificateToPem(cert);
    const chain = [signerCertPem, rootCertPem].join('\n');

    const newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
      keys.privateKey,
      [cert],
      password,
      { friendlyName: signerInfo.commonName, algorithm: '3des' },
    );
    const p12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
    const p12Buffer = Buffer.from(p12Der, 'binary');

    const baseName = `${signerInfo.commonName.replace(/\s+/g, '_')}_${Date.now()}`;
    const p12Path = path.join(CERTS_DIR, `${baseName}.p12`);
    fs.writeFileSync(p12Path, p12Buffer);

    fs.writeFileSync(
      path.join(CERTS_DIR, `${baseName}.key.pem`),
      signerKeyPem,
      { mode: 0o600 },
    );
    fs.writeFileSync(
      path.join(CERTS_DIR, `${baseName}.crt.pem`),
      signerCertPem,
    );
    fs.writeFileSync(path.join(CERTS_DIR, `${baseName}.chain.pem`), chain);

    return {
      signerInfo,
      p12Path,
      p12Buffer,
      pemKeyPath: path.join(CERTS_DIR, `${baseName}.key.pem`),
      pemCertPath: path.join(CERTS_DIR, `${baseName}.crt.pem`),
    };
  }

  listSigners() {
    const files = fs.readdirSync(CERTS_DIR).filter((f) => f.endsWith('.p12'));
    return files;
  }

  getRootCertPem() {
    if (!fs.existsSync(this.rootCertPath)) return null;
    return fs.readFileSync(this.rootCertPath, 'utf8');
  }
}
