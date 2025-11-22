import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { Delegations } from 'src/database/schemas/delegations.schema';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';

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
    @InjectModel(Delegations.name)
    private readonly delegationsModel: Model<Delegations>,
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeeModel: Model<MeetingAttendees>,
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
        this.electionsModel.countDocuments({ statusData: STATUS.WAIT_APPROVAL }),
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
        .find({ status: STATUS.CLOSED })
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
        const participantAsVoters = await this.participantsModel.find({
          electionId: election._id,
          roleId: voterRole?._id,
        });
        for (const participant of participantAsVoters) {
          const meetingAttendee = await this.meetingAttendeeModel.findOne({
            electionId: election._id,
            participantId: participant._id,
          });
          if (meetingAttendee?.attended == true) {
            voterActiveCount++;
          }
        }
        // if (voterRole) {
        //   voterActiveCount = await this.participantsModel.countDocuments({
        //     roleId: voterRole._id,
        //   });
        // }

        const rate =
          totalParticipants === 0
            ? 0
            : Math.round((voterActiveCount / totalParticipants) * 100);

        result.push({
          title: election.title,
          rateAttendance: rate,
          totalVotersAttended: voterActiveCount,
          totalParticipants
        });
      }

      return result;

    } catch (error) {
      throw error;
    }
  }

  async getBoardOfControlDashboard(electionId: string) {
    try {
      // lấy thông tin cuộc bầu cử
      const election = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // lấy tổng số người tham gia
      const totalVoters = await this.votersModel.countDocuments({
        electionId: election._id,
      });
      const voterActiveCount = await this.votersModel.countDocuments({
        electionId: election._id,
        status: STATUS.ACTIVE,
      });

      // lấy tổng số phiếu hợp lệ và không hợp lệ
      const [validVotes, invalidVotes] = await Promise.all([
        this.ballotsModel.countDocuments({
          electionId: election._id,
          status: { $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CAST] }
        }),
        this.ballotsModel.countDocuments({
          electionId: election._id,
          status: { $in: [STATUS.INVALID, STATUS.LOCKED] }
        }),
      ]);
      return {
        electionName: election.title,
        totalVotes: validVotes + invalidVotes,
        totalValidVotes: validVotes,
        totalInvalidVotes: invalidVotes,
        totalVoters,
        voterActiveCount,
      };
    } catch (error) {
      throw error;
    }
  }

  async statisticsDelegations() {
    try {
      //Lấy tất cả ủy Quyền
      const totalDelegations = await this.delegationsModel.find()
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      //Tổng số đã phê duyện status = SIGNED
      const totalSigned = await this.delegationsModel.countDocuments({ status: STATUS.SIGNED });
      //Tổng số đang chờ phê duyệt status = CONFIRMED
      const totalConfirmed = await this.delegationsModel.countDocuments({ status: STATUS.CONFIRMED });
      //Tổng số bị từ chối status = REJECTED
      const totalRejected = await this.delegationsModel.countDocuments({ status: STATUS.REJECTED });
      return {
        totalDelegations,
        totalSigned,
        totalConfirmed,
        totalRejected,
      };
    } catch (error) {
      throw error;
    }
  }

  //Thống kế cho thư kí
  async getSecretaryDashboard(electionId: string, userId: string) {
    //tổng số voter tham giao election
    const totalVoters = await this.votersModel.countDocuments({
      electionId: new Types.ObjectId(electionId)
    });

    //Tống số ủy quyền chờ phê duyệt
    const totalConfirmed = await this.delegationsModel.countDocuments({
      electionId: new Types.ObjectId(electionId),
      status: STATUS.CONFIRMED
    });

    //Tổng số cuộc bầu cử user tham gia
    const totalElectionsParticipated = await this.participantsModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return {
      totalVoters,
      totalConfirmed,
      totalElectionsParticipated,
    };

  }

}
