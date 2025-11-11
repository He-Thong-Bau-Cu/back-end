import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { SystemLog } from 'src/database/schemas/systemLog.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CLIENT_RENEG_LIMIT } from 'tls';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(ElectionsParticipants.name)
    private readonly participantsModel: Model<ElectionsParticipants>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<Roles>,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    @InjectModel(SystemLog.name)
    private readonly systemLogModel: Model<SystemLog>,
  ) { }

  async getDashboardPreside() {
    try {
      const [
        totalElections,
        totalVoters,
        pendingApprovals,
      ] = await Promise.all([
        this.electionsModel.countDocuments(),
        this.votersModel.countDocuments(),
        this.electionsModel.countDocuments({ statusData: STATUS.WAIT_APROVAL }),
      ]);

      //Lấy tông số hoạt động trong tháng
      let totalActivitiesThisMonth: number | null = null;
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        totalActivitiesThisMonth = await this.systemLogModel.countDocuments({
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        });
      } catch (error) {
        totalActivitiesThisMonth = null;
      }

      //Tỷ lệ tham gia bầu cử
      let participationRate = 0;
      try {
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          const participationActive = await this.participantsModel.countDocuments({
            status: STATUS.ACTIVE,
            roleId: voterRole._id
          });
          const totalParticipants = await this.participantsModel.countDocuments({ roleId: voterRole._id });
          participationRate = (participationActive / totalParticipants) * 100;
        }
      } catch (error) {
        participationRate = 0;
      }




      return {
        totalElections,
        totalVoters,
        pendingApprovals,
        totalActivitiesThisMonth,
        participationRate,
      };
    } catch (error) {
      throw error;
    }
  }

  async getRecentParticipation() {
    try {
      // Lấy 5 cuộc bầu cử gần nhất đã kết thúc
      const elections = await this.electionsModel
        .find({ status: 'FINISHED' })
        .sort({ endDate: -1 })
        .limit(5)
        .lean();

      const result: any = [];

      for (const election of elections) {

        const totalParticipants = await this.participantsModel.countDocuments({
          electionId: election._id,
        });

        // Đếm số người tham gia
        let voterActiveCount = 0;
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          voterActiveCount = await this.participantsModel.countDocuments({
            roleId: voterRole._id,
          });
        }

        const rate =
          totalParticipants === 0
            ? 0
            : Math.round((voterActiveCount / totalParticipants) * 100);

        result.push({
          title: election.title,
          rate,
        });
      }

      return result;

    } catch (error) {
      throw error;
    }
  }

}
