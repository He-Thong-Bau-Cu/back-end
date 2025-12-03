import { Test, TestingModule } from '@nestjs/testing';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { MESSAGE } from 'src/common/enums/message.enum';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ResultsController', () => {
  let controller: ResultsController;
  let service: ResultsService;

  const mockResultsService = {
    getByElectionId: jest.fn(),
    getById: jest.fn(),
    search: jest.fn(),
    update: jest.fn(),
    getWinnersCumulative: jest.fn(),
    getWinnersYesNo: jest.fn(),
    createAndSign: jest.fn(),
  };

  const mockReq = {
    user: { sub: "admin123" }
  } as any;

  const mockFile = {
    originalname: "cert.p12",
    buffer: Buffer.from("fake-file"),
    mimetype: "application/x-pkcs12",
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [
        {
          provide: ResultsService,
          useValue: mockResultsService,
        }
      ]
    }).compile();

    controller = module.get<ResultsController>(ResultsController);
    service = module.get<ResultsService>(ResultsService);
    jest.clearAllMocks();
  });

  // ======================================================
  // GET BY ELECTION ID
  // ======================================================
  it("should get results by election id", async () => {
    const data = [{ id: "r001" }];
    mockResultsService.getByElectionId.mockResolvedValue(data);

    const result = await controller.getByElectionId("e001");

    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.RESULT_GET_BY_VOTER_SUCCESS);
    expect(service.getByElectionId).toHaveBeenCalledWith("e001");
  });

  // ======================================================
  // GET BY ID
  // ======================================================
  it("should get result by id", async () => {
    const data = { id: "r001" };
    mockResultsService.getById.mockResolvedValue(data);

    const result = await controller.getById("r001");

    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.RESULT_GET_BY_ID_SUCCESS);
    expect(service.getById).toHaveBeenCalledWith("r001");
  });

  // ======================================================
  // SEARCH
  // ======================================================
  it("should search results", async () => {
    const res = [{ id: "r1" }];
    mockResultsService.search.mockResolvedValue(res);

    const result = await controller.search({ page: 1, limit: 10 } as any);

    expect(result.data).toEqual(res);
    expect(result.message).toBe(MESSAGE.RESULT_SEARCH_SUCCESS);
    expect(service.search).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  // ======================================================
  // UPDATE
  // ======================================================
  it("should update result", async () => {
    const updated = { id: "r001", score: 100 };
    mockResultsService.update.mockResolvedValue(updated);

    const result = await controller.update("r001", updated as any, mockReq);

    expect(result.data).toEqual(updated);
    expect(result.message).toBe(MESSAGE.RESULT_UPDATE_SUCCESS);
    expect(service.update).toHaveBeenCalledWith("r001", updated, "admin123");
  });

  // ======================================================
  // GET CUMULATIVE RESULTS
  // ======================================================
  it("should get cumulative results", async () => {
    const data = [{ winner: "u1" }];
    mockResultsService.getWinnersCumulative.mockResolvedValue(data);

    const result = await controller.getCumulativeResultsByElectionId("e001");

    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.RESULT_GET_CUMULATIVE_BY_ELECTION_SUCCESS);
    expect(service.getWinnersCumulative).toHaveBeenCalledWith("e001");
  });

  // ======================================================
  // GET YES-NO RESULTS
  // ======================================================
  it("should get yes/no results", async () => {
    const data = [{ yes: 10, no: 2 }];
    mockResultsService.getWinnersYesNo.mockResolvedValue(data);

    const result = await controller.getYesNoResultsByElectionId("e001");

    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.RESULT_GET_YES_NO_BY_ELECTION_SUCCESS);
    expect(service.getWinnersYesNo).toHaveBeenCalledWith("e001");
  });

  // ======================================================
  // SIGN RESULT
  // ======================================================
  it("should sign election result", async () => {
    mockResultsService.createAndSign.mockResolvedValue("/uploads/signed.pdf");

    const result = await controller.signResult(
      mockFile,
      "123456",
      "e001",
      mockReq,
    );

    expect((result as any).data.signedFilePath).toBe("/uploads/signed.pdf");
    expect(result.message).toBe(MESSAGE.RESULT_SIGN_SUCCESS);

    expect(service.createAndSign).toHaveBeenCalledWith(
      mockFile,
      "123456",
      "e001",
      "admin123"
    );
  });

});
