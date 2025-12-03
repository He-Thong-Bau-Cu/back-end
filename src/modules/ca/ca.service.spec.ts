import { Test, TestingModule } from '@nestjs/testing';
import { CaService } from './ca.service';
import { MailService } from '../mail/mail.service';
import { PassThrough } from 'stream';

jest.useFakeTimers();

// ------------------------------------------------------
// MOCK ARCHIVER (NO STREAM, NO TIMEOUT)
// ------------------------------------------------------
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => {
    let pipedStream: any = null;
    const mock: any = {
      pipe: jest.fn(function (stream: any) {
        pipedStream = stream;
        return stream;
      }),
      append: jest.fn(),
      finalize: jest.fn(function () {
        // Emit data event first, then end event on the piped stream
        if (pipedStream) {
          process.nextTick(() => {
            pipedStream.emit('data', Buffer.from('mock zip data'));
            pipedStream.emit('end');
          });
        }
      }),
      on: jest.fn(),
    };
    return mock;
  });
});

// ------------------------------------------------------
// MOCK FORGE (SAFE, NO REAL RSA)
// ------------------------------------------------------
jest.mock('node-forge', () => ({
  pki: {
    rsa: {
      generateKeyPair: jest.fn().mockReturnValue({
        privateKey: { fake: true },
        publicKey: { fake: true }
      })
    },
    createCertificationRequest: jest.fn().mockReturnValue({
      publicKey: {},
      setSubject: jest.fn(),
      sign: jest.fn(),
      subject: { attributes: [] }
    }),
    createCertificate: jest.fn().mockReturnValue({
      publicKey: {},
      serialNumber: "",
      validity: { notBefore: {}, notAfter: {} },
      setSubject: jest.fn(),
      setIssuer: jest.fn(),
      setExtensions: jest.fn(),
      sign: jest.fn(),
      subject: { attributes: [] }
    }),
    privateKeyFromPem: jest.fn(),
    certificateFromPem: jest.fn().mockReturnValue({ subject: { attributes: [] } }),
    privateKeyToPem: jest.fn().mockReturnValue("PEM_KEY"),
    certificateToPem: jest.fn().mockReturnValue("PEM_CERT")
  },
  md: { sha256: { create: () => ({}) } },
  pkcs12: {
    toPkcs12Asn1: jest.fn().mockReturnValue("ASN1")
  },
  asn1: {
    toDer: jest.fn().mockReturnValue({ getBytes: () => "BYTES" })
  }
}));

// ------------------------------------------------------
// MOCK FS
// ------------------------------------------------------
import * as fs from 'fs';
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// ------------------------------------------------------
// MOCK MAIL SERVICE
// ------------------------------------------------------
const mailMock = {
  sendCaTemplate: jest.fn(),
};

// ------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------
describe("CaService FINAL FIX", () => {

  let service: CaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaService,
        { provide: MailService, useValue: mailMock }
      ],
    }).compile();

    service = module.get(CaService);
  });

  // ------------------------------------------------------
  it("should create root CA when not exists", () => {
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false).mockReturnValueOnce(false);

    const res = service.ensureRootCA();
    expect(res.created).toBe(true);
    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
  });

  // ------------------------------------------------------
  it("should NOT create CA when exists", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const res = service.ensureRootCA();
    expect(res.created).toBe(false);
  });

  // ------------------------------------------------------
  it("should list .p12 files only", () => {
    (fs.readdirSync as jest.Mock).mockReturnValue(["a.p12", "b.txt", "c.p12"]);

    expect(service.listSigners()).toEqual(["a.p12", "c.p12"]);
  });

  // ------------------------------------------------------
  it("should return null when no root cert", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    expect(service.getRootCertPem()).toBeNull();
  });

  // ------------------------------------------------------
  it("should return root cert PEM", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("PEM_DATA");

    expect(service.getRootCertPem()).toBe("PEM_DATA");
  });

  // ------------------------------------------------------
  it("should create zip buffer", async () => {
    jest.useRealTimers();
    const buffer = await (service as any).createZipBuffer({
      "file.txt": "HELLO"
    });

    expect(Buffer.isBuffer(buffer)).toBe(true);
    jest.useFakeTimers();
  }, 10000); // Increase timeout to 10s

  // ------------------------------------------------------
  it("should issue signer & send mail", async () => {
    jest.useRealTimers();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue("ROOT");
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    const signerInfo = {
      commonName: "Tester",

      organizationName: "ORG",
      countryName: "VN",
      stateOrProvinceName: "HN",
      localityName: "HL",
      emailAddress: "test@mail.com"
    };

    await service.issueSigner(signerInfo, "123");

    expect(mailMock.sendCaTemplate).toHaveBeenCalled();
    jest.useFakeTimers();
  }, 10000); // Increase timeout to 10s

});
