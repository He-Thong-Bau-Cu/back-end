import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';
import { SignPdf, plainAddPlaceholder } from 'node-signpdf';
import PizZip from 'pizzip';
import { createHash } from 'crypto';

const UPLOADS = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

@Injectable()
export class SigningService {
  constructor() {}

  /**
   * Ký file PDF bằng file chứng thư .p12
   */
  async signPdfWithP12(
      pdfBuffer: Buffer,
      p12Buffer: Buffer,
      passphrase?: string,
  ): Promise<Buffer> {
    const signer = new SignPdf();

    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Signed by internal CA',
      signatureLength: 8192,
    });

    const signedPdfBuffer = signer.sign(pdfWithPlaceholder, p12Buffer, {
      passphrase,
    });

    return Buffer.from(signedPdfBuffer);
  }


  /**
   * Ký file Word\
   */
  async signDocxWithP12(
      docBuffer: Buffer,
      p12Buffer: Buffer,
      passphrase?: string,
  ): Promise<Buffer> {
    // Đọc và giải mã file .p12 (PKCS#12)
    const p12Der = forge.util.createBuffer(p12Buffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

    // Trích xuất private key & certificate
    let keyObj;
    let certObj;
    const keyBags =
        p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] ||
        [];
    if (keyBags.length > 0) keyObj = keyBags[0];
    const certBags =
        p12.getBags({ bagType: forge.pki.oids.certBag })[
            forge.pki.oids.certBag
            ] || [];
    if (certBags.length > 0) certObj = certBags[0];

    // fallback: pkcs8ShroudedKeyBag
    if (!keyObj) {
      const sk =
          p12.getBags({
            bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
          })[forge.pki.oids.pkcs8ShroudedKeyBag];
      if (sk && sk.length > 0) keyObj = sk[0];
    }

    if (!keyObj || !certObj)
      throw new Error('Cannot extract key/cert from p12');

    const privateKey = keyObj.key;
    const cert = certObj.cert;

    // Hash toàn bộ file DOCX
    const md = forge.md.sha256.create();
    md.update(docBuffer.toString('binary'));
    const signatureBytes = privateKey.sign(md);
    const signatureBase64 = forge.util.encode64(signatureBytes);
    const certPem = forge.pki.certificateToPem(cert);

    // Mở file DOCX (zip)
    const zip = new PizZip(docBuffer);

    // Tạo JSON metadata chữ ký
    const signatureJson = JSON.stringify(
        {
          signedAt: new Date().toISOString(),
          signature: signatureBase64,
          certificate: certPem,
          algorithm: 'RSA-SHA256',
        },
        null,
        2,
    );

    // Thêm file vào customXml/signature.json
    zip.file('customXml/signature.json', signatureJson);

    // Cập nhật Content_Types (để tránh lỗi mở Word)
    try {
      const contentTypes = zip.file('[Content_Types].xml');
      if (contentTypes) {
        let ct = contentTypes.asText();
        if (!ct.includes('customXml/signature.json')) {
          const insertAt = ct.lastIndexOf('</Types>');
          const override = `\n  <Override PartName="/customXml/signature.json" ContentType="application/json"/>`;
          ct = ct.slice(0, insertAt) + override + '\n' + ct.slice(insertAt);
          zip.file('[Content_Types].xml', ct);
        }
      }
    } catch (err) {
      console.warn('Could not update [Content_Types].xml:', err);
    }

    return zip.generate({ type: 'nodebuffer' });
  }

  async signDocxXml(
  docBuffer: Buffer,
  p12Buffer: Buffer,
  passphrase?: string,
): Promise<Buffer> {
  const zip = new PizZip(docBuffer);

  // 1️⃣ Parse certificate & private key
  const p12Der = forge.util.createBuffer(p12Buffer.toString('binary'));
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);
  const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag][0];
  const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag][0];
  const privateKey = keyBag.key;
  const cert = certBag.cert;
  const certBase64 = Buffer.from(
    forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes(),
    'binary'
  ).toString('base64');

  // 2️⃣ Lấy các file chính
  const contentTypesEntry = zip.file('[Content_Types].xml');
  const relsEntry = zip.file('_rels/.rels');
  const documentEntry = zip.file('word/document.xml');
  if (!contentTypesEntry || !relsEntry || !documentEntry) {
    throw new Error('DOCX missing required parts');
  }

  // 3️⃣ Hash nội dung chính (word/document.xml)
  const documentXml = documentEntry.asText();
  const docDigest = createHash('sha256')
    .update(Buffer.from(documentXml, 'utf8'))
    .digest('base64');

  // 4️⃣ Tạo SignedInfo — bổ sung RelationshipTransform & canonicalization
  const signedInfo = `
  <SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
    <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
    <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    <Reference URI="/word/document.xml">
      <Transforms>
        <Transform Algorithm="http://schemas.openxmlformats.org/package/2006/RelationshipTransform"/>
        <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
      </Transforms>
      <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <DigestValue>${docDigest}</DigestValue>
    </Reference>
    <Reference URI="/_xmlsignatures/origin.sigs">
      <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
      <DigestValue>${createHash('sha256')
        .update(Buffer.from('<Origin/>', 'utf8'))
        .digest('base64')}</DigestValue>
    </Reference>
  </SignedInfo>
  `;

  // 5️⃣ Ký SignedInfo (RSA-SHA256)
  const md = forge.md.sha256.create();
  md.update(signedInfo, 'utf8');
  const signatureBytes = privateKey.sign(md);
  const signatureValue = forge.util.encode64(signatureBytes);

  // 6️⃣ Tạo file sig1.xml
  const signatureXml = `<?xml version="1.0" encoding="UTF-8"?>
<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  ${signedInfo}
  <SignatureValue>${signatureValue}</SignatureValue>
  <KeyInfo>
    <X509Data>
      <X509Certificate>${certBase64}</X509Certificate>
    </X509Data>
  </KeyInfo>
</Signature>`;
  zip.file('_xmlsignatures/sig1.xml', signatureXml);

  // 7️⃣ origin.sigs
  const originXml = `<?xml version="1.0" encoding="UTF-8"?>
<Origin xmlns="http://schemas.openxmlformats.org/package/2006/digital-signature-origin">
  <SignatureInfoV1/>
</Origin>`;
  zip.file('_xmlsignatures/origin.sigs', originXml);

  // 8️⃣ Update [Content_Types].xml
  let contentTypes = contentTypesEntry.asText();
  if (!contentTypes.includes('digital-signature')) {
    const insertAt = contentTypes.lastIndexOf('</Types>');
    const add = `
  <Override PartName="/_xmlsignatures/sig1.xml" ContentType="application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml"/>
  <Override PartName="/_xmlsignatures/origin.sigs" ContentType="application/vnd.openxmlformats-package.digital-signature-origin"/>
`;
    contentTypes = contentTypes.slice(0, insertAt) + add + contentTypes.slice(insertAt);
    zip.file('[Content_Types].xml', contentTypes);
  }

  // 9️⃣ Update _rels/.rels
  let relsXml = relsEntry.asText();
  if (!relsXml.includes('digital-signature/origin')) {
    const insertAt = relsXml.lastIndexOf('</Relationships>');
    const rel = `
  <Relationship Id="rIdSign1" Type="http://schemas.openxmlformats.org/package/2006/relationships/digital-signature/origin" Target="/_xmlsignatures/origin.sigs"/>`;
    relsXml = relsXml.slice(0, insertAt) + rel + relsXml.slice(insertAt);
    zip.file('_rels/.rels', relsXml);
  }

  // 🔟 Add _xmlsignatures/_rels/origin.sigs.rels
  const originRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdSig" Type="http://schemas.openxmlformats.org/package/2006/relationships/digital-signature/signature" Target="sig1.xml"/>
</Relationships>`;
  zip.file('_xmlsignatures/_rels/origin.sigs.rels', originRels);

  // 11️⃣ Add _xmlsignatures/_rels/sig1.xml.rels (optional)
  const sigRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;
  zip.file('_xmlsignatures/_rels/sig1.xml.rels', sigRels);

  // ✅ Trả về file DOCX đã ký
  console.log('run')
  return zip.generate({ type: 'nodebuffer' });
}


  // Ky bang file doc
  async signDocWithP12(
    docBuffer: Buffer,
    p12Buffer: Buffer,
    passphrase?: string,
  ): Promise<Buffer> {
    const p12Asn1 = forge.asn1.fromDer(p12Buffer.toString('binary'));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

    const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ][0];
    const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[
      forge.pki.oids.certBag
    ][0];

    const privateKey = keyBag.key;
    const cert = certBag.cert;

    // Tạo gói PKCS#7 Detached
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(docBuffer.toString('binary'));
    p7.addCertificate(cert);
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
    });

    p7.sign({ detached: true });

    const asn1 = p7.toAsn1();
    const der = forge.asn1.toDer(asn1).getBytes();
    return Buffer.from(der, 'binary'); // file .p7s
  }

  async verifyPdfSignature(pdfBuffer: Buffer) {
    try {
      const pdfString = pdfBuffer.toString('binary');

      const byteRangeMatch = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/.exec(pdfString);
      if (!byteRangeMatch) throw new Error('No ByteRange found in PDF');

      const [_, start1, len1, start2, len2] = byteRangeMatch.map(Number);

      // (PKCS#7) /Contents
      const contentsMatch = /\/Contents\s*<([0-9A-Fa-f]+)>/.exec(pdfString);
      if (!contentsMatch) throw new Error('No Contents found in PDF');

      let signatureHex = contentsMatch[1].replace(/>$/, '');
      let signatureBytes = Buffer.from(signatureHex, 'hex');

      while (signatureBytes[signatureBytes.length - 1] === 0x00) {
        signatureBytes = signatureBytes.slice(0, -1);
      }

      const signedData = Buffer.concat([
        pdfBuffer.subarray(start1, start1 + len1),
        pdfBuffer.subarray(start2, start2 + len2),
      ]);

      // parse PKCS#7
      const p7Asn1 = forge.asn1.fromDer(forge.util.createBuffer(signatureBytes)); // dùng Buffer trực tiếp
      const p7 = forge.pkcs7.messageFromAsn1(p7Asn1);

      // certificate signer
      const signerCert = p7.certificates[0];
      if (!signerCert) throw new Error('No certificate found in signature.');

      const md = forge.md.sha256.create();
      md.update(signedData.toString('binary'));

      const publicKey = signerCert.publicKey;
      const verifiedData =
          p7.rawCapture.signature && publicKey.verify(md.digest().bytes(), p7.rawCapture.signature);

      // CA nội bộ
      let caVerified = false;
      try {
        const caPath = path.join(process.cwd(), 'certs', 'rootCA-crt.pem');
        const caCertPem = fs.readFileSync(caPath, 'utf8');
        console.log(caCertPem)
        const caCert = forge.pki.certificateFromPem(caCertPem);

        const caStore = forge.pki.createCaStore([caCert]);
        caVerified = forge.pki.verifyCertificateChain(caStore, [signerCert]);
      } catch (caErr) {
        console.warn('⚠️ Không verify được bằng CA nội bộ:', caErr.message);
      }

      return {
        integrity: !verifiedData,
        caVerified,
        overallVerified: !verifiedData && caVerified,
        subject: signerCert.subject.attributes,
        issuer: signerCert.issuer.attributes,
      };
    } catch (err) {
      console.error('Verify error:', err);
      throw new Error(err.message);
    }
  }
}
