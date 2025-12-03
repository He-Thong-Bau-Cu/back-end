const signMock = jest.fn(() => Buffer.from('SIGNED_PDF'));

const SignPdfMockImpl = {
  sign: signMock,
};

jest.doMock('node-signpdf', () => ({
  SignPdf: jest.fn(() => SignPdfMockImpl),
  plainAddPlaceholder: jest.fn(() => Buffer.from('PLACEHOLDER')),
}));

// ======================= MOCK PizZip =============================
const zipFileMock = jest.fn(() => ({
  asText: jest.fn().mockReturnValue('<xml></xml>'),
}));

const zipGenerateMock = jest.fn(() => Buffer.from('DOCX_SIGNED'));

jest.doMock('pizzip', () =>
  jest.fn().mockImplementation(() => ({
    file: zipFileMock,
    generate: zipGenerateMock,
  }))
);

// ===== MOCK forge =====
jest.doMock('node-forge', () => ({
  util: {
    createBuffer: jest.fn(),
    encode64: jest.fn(() => 'BASE64'),
  },
  asn1: {
    fromDer: jest.fn(() => ({})),
    toDer: jest.fn(() => ({ getBytes: () => 'DER' })),
  },
  md: {
    sha256: {
      create: () => ({
        update: jest.fn(),
        digest: jest.fn(() => ({ bytes: () => 'HASH' })),
      }),
    },
  },
  pki: {
    oids: {
      keyBag: '1',
      certBag: '2',
      pkcs8ShroudedKeyBag: '3',
    },
    certificateToPem: jest.fn(() => 'CERT'),
    certificateToAsn1: jest.fn(() => ({})),
  },
  pkcs12: {
    pkcs12FromAsn1: () => ({
      getBags: jest.fn((opt) => {
        if (opt.bagType === '1') return { 1: [{ key: { sign: jest.fn() } }] };
        if (opt.bagType === '2') return { 2: [{ cert: {} }] };
        if (opt.bagType === '3') return { 3: [{ key: { sign: jest.fn() } }] };
        return {};
      }),
    }),
  },
  pkcs7: {
    createSignedData: () => ({
      addCertificate: jest.fn(),
      addSigner: jest.fn(),
      sign: jest.fn(),
      toAsn1: jest.fn(() => ({})),
    }),
    messageFromAsn1: () => ({
      certificates: [{ publicKey: { verify: jest.fn(() => true) } }],
      rawCapture: { signature: 'SIG' },
    }),
  },
}));

import { SigningService } from './signature.service';
import { plainAddPlaceholder } from 'node-signpdf';

describe('SigningService', () => {
  let service: SigningService;

  const fakePdf = Buffer.from('PDF');
  const fakeP12 = Buffer.from('P12');
  const fakeDocx = Buffer.from('DOCX');

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SigningService();
  });

  it('should sign PDF using .p12', async () => {
    const res = await service.signPdfWithP12(fakePdf, fakeP12, '123');

    expect(plainAddPlaceholder).toHaveBeenCalled();
    expect(signMock).toHaveBeenCalled();         
    expect(res).toBeInstanceOf(Buffer);
  });

  it('should sign DOCX with signDocxWithP12', async () => {
    const result = await service.signDocxWithP12(fakeDocx, fakeP12, '123');

    expect(zipFileMock).toHaveBeenCalled();
    expect(zipGenerateMock).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should sign DOCX using XML signature method', async () => {
    const result = await service.signDocxXml(fakeDocx, fakeP12, '123');
    expect(result).toBeInstanceOf(Buffer);
  });

  it('should sign DOC using PKCS#7', async () => {
    const result = await service.signDocWithP12(fakeDocx, fakeP12, '123');
    expect(result).toBeInstanceOf(Buffer);
  });
});
