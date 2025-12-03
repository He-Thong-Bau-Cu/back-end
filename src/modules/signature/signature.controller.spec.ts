import { Test, TestingModule } from '@nestjs/testing';
import { SigningController } from './signature.controller';
import { SigningService } from './signature.service';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
jest.mock('path');

describe('SigningController', () => {
  let controller: SigningController;
  let service: SigningService;

  const mockService = {
    signPdfWithP12: jest.fn(),
    verifyPdfSignature: jest.fn(),
    signDocxXml: jest.fn(),
  };

  beforeEach(async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('P12_FILE'));
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SigningController],
      providers: [
        {
          provide: SigningService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SigningController>(SigningController);
    service = module.get<SigningService>(SigningService);

    jest.clearAllMocks();
  });

  // ==========================================================================

  it('should sign PDF using POST /signing/pdf', async () => {
    const fakePdf = Buffer.from('PDF_DATA');
    const fakeSignedPdf = Buffer.from('SIGNED_PDF');

    mockService.signPdfWithP12.mockResolvedValue(fakeSignedPdf);

    const mockRes: any = {
      set: jest.fn(),
      send: jest.fn(),
    };

    await controller.signPdf(
      { buffer: fakePdf, originalname: 'test.pdf' } as any,
      { p12Path: 'test.p12', password: '123' },
      mockRes,
    );

    expect(fs.readFileSync).toHaveBeenCalledWith('test.p12');
    expect(mockService.signPdfWithP12).toHaveBeenCalled();
    expect(mockRes.set).toHaveBeenCalled();
    expect(mockRes.send).toHaveBeenCalledWith(fakeSignedPdf);
  });

  // ==========================================================================

  it('should verify PDF signature using POST /signing/verify', async () => {
    const fakePdf = Buffer.from('PDF');
    const fakeResult = { verified: true };

    mockService.verifyPdfSignature.mockResolvedValue(fakeResult);

    const result = await controller.verifySignature({ buffer: fakePdf } as any);

    expect(mockService.verifyPdfSignature).toHaveBeenCalledWith(fakePdf);
    expect(result).toEqual(fakeResult);
  });

  // ==========================================================================

  it('should sign DOCX using POST /signing/doc', async () => {
    const fakeDoc = Buffer.from('DOCX');
    const fakeSigned = Buffer.from('SIGNED_DOCX');

    mockService.signDocxXml.mockResolvedValue(fakeSigned);

    const fakeRes: any = {
      download: jest.fn(),
    };

    await controller.signDoc(
      { buffer: fakeDoc, originalname: 'test.docx' } as any,
      { p12Path: 'cert.p12', password: '123' },
      fakeRes,
    );

    expect(fs.readFileSync).toHaveBeenCalledWith('cert.p12');
    expect(mockService.signDocxXml).toHaveBeenCalled();
    expect(fakeRes.download).toHaveBeenCalled();
  });
});
