import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Voters } from 'src/database/schemas/voters.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Roles } from 'src/database/schemas/roles.schema';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { paginate } from 'src/common/dto/paignation';

@Injectable()
export class VotersService {
  constructor(
    @InjectModel(Voters.name)
    private readonly voterModel: Model<Voters>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<Roles>,
  ) { }

  async search(req: BaseSearchDTO) {
    try {
      const keyword = req.keyword ? req.keyword.trim() : '';

      //tìm kiếm voter theo election
      const matchedElections = await this.electionsModel
        .find({
          title: { $regex: keyword, $options: 'i' },
          decisionName: { $regex: keyword, $options: 'i' },
        })
        .collation({ locale: 'vi', strength: 1 })
        .exec();
      const electionIds = matchedElections.map((e) => e._id);
      //tìm kiếm voter theo user
      const matchedUsers = await this.userModel
        .find({
          fullName: { $regex: keyword, $options: 'i' },
          email: { $regex: keyword, $options: 'i' },
          username: { $regex: keyword, $options: 'i' },
        })
        .collation({ locale: 'vi', strength: 1 })
        .exec();
      const userIds = matchedUsers.map((u) => u._id);
      //tìm kiếm voter
      const matchedVoters = await this.voterModel
        .find({
          $or: [
            { status: { $regex: keyword, $options: 'i' } },
          ],
        })
        .collation({ locale: 'vi', strength: 1 })
        .exec();
      const voterIds = matchedVoters.map((v) => v._id);

      // Kết hợp tất cả các điều kiện tìm kiếm
      const query: any = {}
      if (electionIds.length > 0) { query.electionId = { $in: electionIds }; }
      if (userIds.length > 0) { query.userId = { $in: userIds }; }
      if (voterIds.length > 0) { query._id = { $in: voterIds }; }

      const voters = await this.voterModel
        .find(query)
        .populate({
          path: 'electionId',
          select: 'title',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: "createdBy", select: "username fullName email position" },
            { path: "updatedBy", select: "username fullName email position" }
          ]
        })
        .populate('userId', 'fullName username email phone position department')
        .sort({ createdAt: -1 })
        .exec();
      return paginate(voters, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  async create(createVoter: CreateVoterDto, userId: string) {
    try {
      // Kiểm tra electionId có tồn tại không (sử dụng _id)
      const electionId = new Types.ObjectId(createVoter.electionId);
      const electionExists = await this.electionsModel.findById(electionId);
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      } else if (electionExists.status && electionExists.status !== STATUS.ACTIVE) {
        throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
      }

      // Kiểm tra userId có tồn tại không (sử dụng _id) và lấy thông tin roleId, position
      const userId = new Types.ObjectId(createVoter.userId);
      const userExists = await this.userModel.findById(userId);
      if (!userExists) {
        throw new Error(MESSAGE.USER_NOT_FOUND);
      } else if (userExists.status && userExists.status !== STATUS.ACTIVE) {
        throw new Error(MESSAGE.USER_IS_NOT_ACTIVE);
      }

      // Kiểm tra xem đã có voter chưa (tránh duplicate)
      const existingVoter = await this.voterModel.findOne({
        electionId: electionId,
        userId: userId,
      });

      if (existingVoter) {
        throw new Error(MESSAGE.VOTER_ALREADY_EXISTS);
      }

      // Kiểm tra xem đã có electionParticipant chưa
      const existingParticipant = await this.electionParticipantsModel.findOne({
        electionId: electionId,
        userId: userId,
      });


      if (!existingParticipant) {
        // Lấy role VOTER
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER }).exec();
        if (!voterRole || !voterRole._id) {
          throw new Error(MESSAGE.ROLE_NOT_FOUND);
        }
        // Tạo electionParticipant nếu chưa tồn tại
        await this.electionParticipantsModel.create({
          electionId: electionId,
          userId: userId,
          roleId: voterRole._id,
          position: userExists.position || 'Voter',
        });
      }

      // Tạo voter
      const voter = await this.voterModel.create({
        ...createVoter,
        electionId: electionId,
        userId: userId,
        createdBy: userId ? new Types.ObjectId(userId) : null
      });

      return voter;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateVoter: UpdateVoterDto, userId: string) {
    try {
      //Check if the voter exists
      const voterExists = await this.voterModel.exists({ _id: id });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      const voter = await this.voterModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateVoter,
          electionId: updateVoter.electionId ? new Types.ObjectId(updateVoter.electionId) : null,
          userId: updateVoter.userId ? new Types.ObjectId(updateVoter.userId) : null,
          updatedBy: userId ? new Types.ObjectId(userId) : null
        }, { new: true })
        .exec();
      return voter;
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(id: string, status: string, userId: string) {
    try {
      //Check if the voter exists
      const voterExists = await this.voterModel.exists({ _id: id });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const voter = await this.voterModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          status,
          updatedBy: new Types.ObjectId(userId) || null
        }, { new: true })
        .exec();
      return voter;
    } catch (error) {
      throw error;
    }
  }

  //Kiểm tra những cử tri đủ điều kiện phát hành phiếu
  async getEligibleVoters(electionId: string) {
    try {
      //Check election exists
      const electionExists = await this.electionsModel
        .findOne({ _id: new Types.ObjectId(electionId) }).exec();
      if (electionExists) {
        if (electionExists.status && electionExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check voters exists
      const votersExists = await this.voterModel
        .find({ electionId: new Types.ObjectId(electionId), status: STATUS.ACTIVE })
        .populate({
          path: 'electionId',
          select: 'title',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: "createdBy", select: "username fullName email position" },
            { path: "updatedBy", select: "username fullName email position" }
          ]
        })
        .populate('userId', 'fullName username email phone position department')
        .exec();


      return votersExists;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string) {
    try {

      const voter = await this.voterModel
        .findById(new Types.ObjectId(id))
        .exec();
      if (!voter) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      voter.status = STATUS.INACTIVE;
      return voter.save();
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      //Check if the election exists
      const electionExists = await this.electionsModel
        .findOne({ _id: new Types.ObjectId(electionId) }).exec();
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const voters = await this.voterModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate({
          path: 'electionId',
          select: 'title',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: "createdBy", select: "username fullName email position" },
            { path: "updatedBy", select: "username fullName email position" }
          ]
        })
        .populate('userId', 'fullName username email phone position department')
        .exec();

      //Check if the voters exists
      if (!voters) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      return voters;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      //Check if the voters exists
      const votersExists = await this.voterModel.exists({ _id: id }).exec();
      if (!votersExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const voters = await this.voterModel
        .findById(new Types.ObjectId(id))
        .populate({
          path: 'electionId',
          select: 'title',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: "createdBy", select: "username fullName email position" },
            { path: "updatedBy", select: "username fullName email position" }
          ]
        })
        .populate('userId', 'fullName username email phone position department')
        .exec();

      return voters;
    } catch (error) {
      throw error;
    }
  }

  async getVoterDashboard(electionId: string) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.findById(new Types.ObjectId(electionId));
      if (!electionExists) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }


      // 1. Lấy tổng số voter trong cuộc bầu cử
      // const totalVoters = await this.voterModel.countDocuments({
      //   electionId: new Types.ObjectId(electionId)
      // });

      // 2. Lấy role VOTER
      const voterRole: any = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
      if (!voterRole) {
        throw new NotFoundException('Không tìm thấy role VOTER trong hệ thống');
      }

      // 1. Lấy tổng số voter trong cuộc bầu cử
      const totalVoters = await this.electionParticipantsModel.countDocuments({
        electionId: new Types.ObjectId(electionId),
        roleId: new Types.ObjectId(voterRole._id),
      });

      // 3. Lấy tổng số người tham gia cuộc bầu cử 
      const totalParticipants = await this.electionParticipantsModel.countDocuments({
        electionId: new Types.ObjectId(electionId),
        //status: STATUS.ACTIVE,
      });

      // 4. Tính tỉ lệ phần trăm: (voters / participants) * 100
      const participationPercentage = totalParticipants > 0
        ? ((totalVoters / totalParticipants) * 100).toFixed(2)
        : '0.00';

      //5. Số lượng voter chưa tham gia cuộc bầu cử
      const voterNotActive = await this.voterModel.countDocuments({
        electionId: new Types.ObjectId(electionId),
        roleId: voterRole._id,
        status: { $in: [STATUS.INVITED, STATUS.CONFIRMED] }
      })

      return {
        totalVoters: totalVoters,
        totalParticipants,
        participationPercentage: parseFloat(participationPercentage),
        voterNotActive
      };
    } catch (error) {
      throw error;
    }
  }


}
