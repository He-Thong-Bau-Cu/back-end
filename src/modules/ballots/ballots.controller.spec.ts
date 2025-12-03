import { Test, TestingModule } from '@nestjs/testing';
import { BallotsController } from './ballots.controller';
import { BallotsService } from './ballots.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BallotsController', () => {
  let controller: BallotsController;
  let service: jest.Mocked<BallotsService>;

  beforeEach(async () => {
    const mockService = {
      getById: jest.fn(),
      getByElectionId: jest.fn(),
      getByVoterId: jest.fn(),
      getByVoterAndCast: jest.fn(),
      getStatistics: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateStatus: jest.fn(),
      searchBallots: jest.fn(),
      generateBallotPDF: jest.fn(),
      signBallot: jest.fn(),
      verifyOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BallotsController],
      providers: [
        {
          provide: BallotsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(BallotsController);
    service = module.get(BallotsService) as jest.Mocked<BallotsService>;
  });

  // ------------------------------
  // GET BY ID
  // ------------------------------
  describe('getById', () => {
    it('success', async () => {
      service.getById.mockResolvedValue({ id: '123' } as any);

      const res = await controller.getById('123');

      expect(service.getById).toHaveBeenCalledWith('123');
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.data.id).toBe('123');
    });

    it('should throw HttpException', async () => {
      service.getById.mockRejectedValue(new Error('ERR'));

      await expect(controller.getById('123')).rejects.toThrow(HttpException);
    });
  });

  // ------------------------------
  // GET BY ELECTION
  // ------------------------------
  describe('getBallotsByElectionId', () => {
    it('success', async () => {
      service.getByElectionId.mockResolvedValue([{ id: 1 } as any]);

      const res = await controller.getBallotsByElectionId('e01');

      expect(service.getByElectionId).toHaveBeenCalledWith('e01');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // GET BY VOTER
  // ------------------------------
  describe('getBallotsByVoterId', () => {
    it('success', async () => {
      service.getByVoterId.mockResolvedValue([{ id: 1 } as any]);

      const res = await controller.getBallotsByVoterId('v01');

      expect(service.getByVoterId).toHaveBeenCalledWith('v01');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // GET CAST BY VOTER
  // ------------------------------
  describe('getCastBallotsByVoterId', () => {
    it('success', async () => {
      service.getByVoterAndCast.mockResolvedValue([{ id: 1 } as any]);

      const res = await controller.getCastBallotsByVoterId('v02');

      expect(service.getByVoterAndCast).toHaveBeenCalledWith('v02');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // GET STATISTICS
  // ------------------------------
  describe('getStatistics', () => {
    it('success', async () => {
      service.getStatistics.mockResolvedValue({ total: 5 } as any);

      const res = await controller.getStatistics('e99');

      expect(service.getStatistics).toHaveBeenCalledWith('e99');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // CREATE BALLOT
  // ------------------------------
  describe('create', () => {
    const req: any = { user: { sub: 'u123' } };

    it('success', async () => {
      service.create.mockResolvedValue({ id: 100 } as any); 

      const res = await controller.create({ a: 1 } as any, req);

      expect(service.create).toHaveBeenCalledWith({ a: 1 }, 'u123');
      expect(res.status).toBe(HttpStatus.CREATED); // ✅ FIX
    });
  });

  // ------------------------------
  // UPDATE BALLOT
  // ------------------------------
  describe('update', () => {
    const req: any = { user: { sub: 'u1' } };

    it('success', async () => {
      service.update.mockResolvedValue({ id: '123' } as any);

      const res = await controller.update('123', { b: 2 } as any, req);

      expect(service.update).toHaveBeenCalledWith('123', { b: 2 }, 'u1');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // DELETE
  // ------------------------------
  describe('delete', () => {
    it('success', async () => {
      service.delete.mockResolvedValue({ deleted: true } as any);

      const res = await controller.delete('x1');

      expect(service.delete).toHaveBeenCalledWith('x1');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // UPDATE STATUS
  // ------------------------------
  describe('updateStatus', () => {
    const req: any = { user: { sub: 'abc' } };

    it('success', async () => {
      service.updateStatus.mockResolvedValue({ status: 'Active' } as any);

      const res = await controller.updateStatus('x1', req);

      expect(service.updateStatus).toHaveBeenCalledWith('x1', 'abc');
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // SEARCH BALLOTS
  // ------------------------------
  describe('searchBallots', () => {
    it('success', async () => {
      service.searchBallots.mockResolvedValue({ data: [] } as any);

      const res = await controller.searchBallots({ keyword: 'a' });

      expect(service.searchBallots).toHaveBeenCalledWith({ keyword: 'a' });
      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // PDF DOWNLOAD
  // ------------------------------
  describe('getBallotPDF', () => {
    it('success', async () => {
      const buffer = Buffer.from('PDF');

      service.generateBallotPDF.mockResolvedValue(buffer);

      const res: any = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await controller.getBallotPDF('id99', res);

      expect(service.generateBallotPDF).toHaveBeenCalledWith('id99');
      expect(res.send).toHaveBeenCalledWith(buffer);
    });
  });

  // ------------------------------
  // SIGN BALLOT
  // ------------------------------
  describe('signBallot', () => {
    const req: any = { user: { sub: 'u-sign' } };

    it('success', async () => {
      service.signBallot.mockResolvedValue('signed.pdf');

      const file = {
        buffer: Buffer.from('fake'),
      } as any;

      const res = await controller.signBallot(file, 'id1', 'pass', req);

      expect(service.signBallot).toHaveBeenCalledWith(
        file,
        'id1',
        'pass',
        'u-sign',
      );

      expect(res.status).toBe(HttpStatus.OK);
    });
  });

  // ------------------------------
  // VERIFY OTP
  // ------------------------------
  describe('verifyOtp', () => {
    it('success', async () => {
      service.verifyOtp.mockResolvedValue({
        message: 'Xác thực OTP thành công!',
        verified: true,
      });

      const dto = { email: 'a@a.com', otp: '123456' };

      const res = await controller.verifyOtp('id7', dto);

      expect(service.verifyOtp).toHaveBeenCalledWith('id7', dto);
      expect(res.status).toBe(HttpStatus.OK);
    });
  });
});
