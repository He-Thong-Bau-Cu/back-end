import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('StatisticsController (FULL PASS)', () => {
  let controller: StatisticsController;
  let service: StatisticsService;

  const mockStatsService = {
    getDashboardPreside: jest.fn(),
    getRecentParticipation: jest.fn(),
    statisticsDelegations: jest.fn(),
    getSecretaryDashboard: jest.fn(),
    getCumulativeEntityResults: jest.fn(),
    getYesNoEntityResults: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        { provide: StatisticsService, useValue: mockStatsService },
      ],
    }).compile();

    controller = module.get<StatisticsController>(StatisticsController);
    service = module.get<StatisticsService>(StatisticsService);

    jest.clearAllMocks();
  });

  // ========================================================================
  it('should get preside dashboard successfully', async () => {
    const mockData = { total: 10 };
    mockStatsService.getDashboardPreside.mockResolvedValue(mockData);

    const res = await controller.getDashboardPreside();

    expect(service.getDashboardPreside).toHaveBeenCalled();
    expect(res).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.STATISTICS_GET_DASHBOARD_PRESIDENT_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  // ========================================================================
  it('should get recent participation successfully', async () => {
    const mockData = [{ election: 'A', rate: 80 }];
    mockStatsService.getRecentParticipation.mockResolvedValue(mockData);

    const res = await controller.getRecentParticipation();

    expect(service.getRecentParticipation).toHaveBeenCalled();
    expect(res).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.STATISTICS_GET_DASHBOARD_PRESIDENT_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  // ========================================================================
  it('should get delegation statistics successfully', async () => {
    const mockData = { delegated: 20 };
    mockStatsService.statisticsDelegations.mockResolvedValue(mockData);

    const res = await controller.getStatisticsDelegations();

    expect(service.statisticsDelegations).toHaveBeenCalled();
    expect(res).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.STATISTICS_GET_DELEGATIONS_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  // ========================================================================
  it('should get secretary statistics', async () => {
    const mockData = { count: 5 };
    mockStatsService.getSecretaryDashboard.mockResolvedValue(mockData);

    const res = await controller.getStatisticsSecretary('123', '999');

    expect(service.getSecretaryDashboard).toHaveBeenCalledWith('123', '999');
    expect(res).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.STATISTICS_GET_SECRETARY_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  // ========================================================================
  it('should get cumulative entity statistics', async () => {
    const mockData = [{ id: 1, point: 100 }];
    mockStatsService.getCumulativeEntityResults.mockResolvedValue(mockData);

    const res = await controller.getStatisticsEntity('123');

    expect(service.getCumulativeEntityResults).toHaveBeenCalledWith('123');
    expect(res).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.STATISTICS_GET_ENTITY_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  // ========================================================================
  it('should get Yes/No entity statistics', async () => {
    const mockData = [{ id: 1, yes: 80, no: 20 }];
    mockStatsService.getYesNoEntityResults.mockResolvedValue(mockData);

    const res = await controller.getYesNoStatisticsEntity('123');

    expect(service.getYesNoEntityResults).toHaveBeenCalledWith('123');
    expect(res).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.STATISTICS_GET_ENTITY_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });
});
