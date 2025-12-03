import { Test, TestingModule } from '@nestjs/testing';
import { DelegateCardsController } from './delegate-cards.controller';
import { DelegateCardsService } from './delegate-cards.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('DelegateCardsController', () => {
  let controller: DelegateCardsController;
  let service: jest.Mocked<DelegateCardsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DelegateCardsController],
      providers: [
        {
          provide: DelegateCardsService,
          useValue: {
            getDelegateCardsActive: jest.fn(),
            getByToken: jest.fn(),
            getById: jest.fn(),
            getByElectionId: jest.fn(),
            getByVoterId: jest.fn(),
            generateDelegateCardQRCode: jest.fn(),
            create: jest.fn(),
            autoCreateDelegateCardForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DelegateCardsController>(DelegateCardsController);
    service = module.get(DelegateCardsService);
  });

  // ----------------------------------------------------------
  it('should return active delegate cards', async () => {
    service.getDelegateCardsActive.mockResolvedValue([{ id: 1 } as any]);

    const res = await controller.getDelegateCardsActive();

    expect(service.getDelegateCardsActive).toHaveBeenCalled();
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should get by token', async () => {
    service.getByToken.mockResolvedValue({ id: 'T1' } as any);

    const res = await controller.getByToken('T1');
    expect(service.getByToken).toHaveBeenCalledWith('T1');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should get by ID', async () => {
    service.getById.mockResolvedValue({ id: 'ABC' } as any);

    const res = await controller.getById('ABC');
    expect(service.getById).toHaveBeenCalledWith('ABC');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should get by election ID', async () => {
    service.getByElectionId.mockResolvedValue([{ id: 'E1' } as any]);

    const res = await controller.getByElectionId('E1');
    expect(service.getByElectionId).toHaveBeenCalledWith('E1');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should get by voter ID', async () => {
    service.getByVoterId.mockResolvedValue([{ id: 'V1' } as any]);

    const res = await controller.getByVoterId('V1');
    expect(service.getByVoterId).toHaveBeenCalledWith('V1');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should generate QR code', async () => {
    service.generateDelegateCardQRCode.mockResolvedValue({ qrCode: 'QR_DATA' } as any);

    const res = await controller.generateDelegateCardQRCode('ID5');
    expect(service.generateDelegateCardQRCode).toHaveBeenCalledWith('ID5');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should create delegate card', async () => {
    const mockReq: any = { user: { sub: 'USER123' } };
    const dto = { electionId: 'E111', voterId: 'V111' };

    service.create.mockResolvedValue({ id: 'DC1' });

    const res = await controller.create(dto as any, mockReq);

    expect(service.create).toHaveBeenCalledWith(dto, 'USER123');
    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should auto-create delegate card when eligible', async () => {
    const mockReq: any = { user: { sub: 'U1' } };

    service.autoCreateDelegateCardForUser.mockResolvedValue({
      created: true,
      delegateCard: { id: 'NEWCARD' },
      message: 'Created OK',
    });

    const res = await controller.autoCreate('E123', mockReq);

    expect(service.autoCreateDelegateCardForUser).toHaveBeenCalledWith('U1', 'E123');
    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.success).toBe(true);
  });

  // ----------------------------------------------------------
  it('should return existing info if auto-create skipped', async () => {
    const mockReq: any = { user: { sub: 'U1' } };

    service.autoCreateDelegateCardForUser.mockResolvedValue({
      created: false,
      reason: 'Already exists',
    });

    const res = await controller.autoCreate('E123', mockReq);

    expect(service.autoCreateDelegateCardForUser).toHaveBeenCalledWith('U1', 'E123');
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.success).toBe(true);
  });
});
