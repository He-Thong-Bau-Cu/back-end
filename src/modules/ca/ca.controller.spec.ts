import { Test, TestingModule } from '@nestjs/testing';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('CaController', () => {
  let controller: CaController;
  let service: CaService;

  const mockCaService = {
    ensureRootCA: jest.fn(),
    issueSigner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaController],
      providers: [
        {
          provide: CaService,
          useValue: mockCaService,
        },
      ],
    }).compile();

    controller = module.get<CaController>(CaController);
    service = module.get<CaService>(CaService);

    jest.clearAllMocks();
  });

  // =====================================================================
  // 1. INIT ROOT CA
  // =====================================================================
  describe('initRootCA', () => {
    it('should call service.ensureRootCA()', () => {
      mockCaService.ensureRootCA.mockReturnValue('OK');

      const res = controller.initRootCA();
      expect(res).toBe('OK');
      expect(service.ensureRootCA).toHaveBeenCalled();
    });
  });

  // =====================================================================
  // 2. ISSUE SIGNER (SUCCESS)
  // =====================================================================
  describe('issue', () => {
    it('should return BaseResponse.success when issuing signer succeeds', async () => {
      const mockBody = {
        signerInfo: { fullName: 'John Doe' } as any,
        password: '123',
      };

      const mockResult = { id: 's001' };
      mockCaService.issueSigner.mockResolvedValue(mockResult);

      const res = await controller.issue(mockBody);

      expect(res).toEqual(
        BaseResponse.success(
          mockResult,
          'Đăng kí chứng thư số thành công, vui lòng kiểm tra email của bạn!',
          HttpStatus.OK,
        ),
      );

      expect(service.issueSigner).toHaveBeenCalledWith(
        mockBody.signerInfo,
        mockBody.password,
      );
    });

    // =====================================================================
    // 3. ISSUE SIGNER (MISSING FIELDS)
    // =====================================================================
    it('should throw HttpException when signerInfo or password is missing', async () => {
      const body = { signerInfo: null, password: null } as any;

      await expect(controller.issue(body)).rejects.toThrow(HttpException);
      await expect(controller.issue(body)).rejects.toThrow(
        MESSAGE.MISSING_SIGNER_OR_PASSWORD,
      );
    });

    // =====================================================================
    // 4. ISSUE SIGNER (SERVICE ERROR)
    // =====================================================================
    it('should throw HttpException when service.issueSigner fails', async () => {
      const mockBody = {
        signerInfo: { fullName: 'Error User' } as any,
        password: '123',
      };

      mockCaService.issueSigner.mockRejectedValue(new Error('Service Failed'));

      await expect(controller.issue(mockBody)).rejects.toThrow(HttpException);
      await expect(controller.issue(mockBody)).rejects.toThrow('Service Failed');
    });
  });
});
