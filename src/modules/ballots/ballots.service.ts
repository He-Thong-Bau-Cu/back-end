import { Injectable } from '@nestjs/common';
import { CreateBallotDto } from './dto/create-ballot.dto';
import { UpdateBallotDto } from './dto/update-ballot.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@Injectable()
export class BallotsService {

  constructor(
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(ElectionEntities.name)
    private readonly electionEntitiesModel: Model<ElectionEntities>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,
  ) { }

  async findAll() {
    try {
      const ballots = await this.ballotsModel.find()
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: "username fullName email position",
            }
          ]
        })
        .populate('entityId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      //Check if the ballot is exist
      const ballotExist = await this.ballotsModel.exists({ _id: id });
      if (!ballotExist) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      const ballot = await this.ballotsModel
        .findById(new Types.ObjectId(id))
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: "username fullName email position",
            }
          ]
        })
        .populate('entityId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      return ballot;
    } catch (error) {
      throw error;
    }
  }


  async getByElectionId(electionId: string) {
    try {
      //Check if the election is exist
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const ballots = await this.ballotsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: "username fullName email position",
            }
          ]
        })
        .populate('entityId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the ballots is exist
      if (!ballots) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }
      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterId(voterId: string) {
    try {
      //Check if the voter is exist
      const voterExist = await this.votersModel.exists({ _id: voterId });
      if (!voterExist) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      const ballots = await this.ballotsModel.find({ voterId: new Types.ObjectId(voterId) })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: "username fullName email position",
            }
          ]
        })
        .populate('entityId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the ballots is exist
      if (!ballots) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async create(createBallot: CreateBallotDto, userId: string) {
    try {
      //Check election exists
      const electionExists = await this.electionsModel.findOne({ _id: createBallot.electionId });
      if (electionExists) {
        if (electionExists.status && electionExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check voter exists
      const voterExists = await this.votersModel.findOne({ _id: createBallot.voterId });
      if (voterExists) {
        if (voterExists.status && voterExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.VOTER_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      //Check votingRight shares and count > 0
      const votingRight = await this.votingRightsModel.findOne({
        voterId: createBallot.voterId,
        electionId: createBallot.electionId
      });
      if (votingRight) {
        if (votingRight.shares <= 0 || votingRight.votes <= 0) {
          throw new Error(MESSAGE.VOTING_RIGHT_NOT_ELIGIBLE);
        }
      } else if (!votingRight) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }


      const ballot = await this.ballotsModel.create({
        ...createBallot,
        electionId: new Types.ObjectId(createBallot.electionId),
        voterId: new Types.ObjectId(createBallot.voterId),
        createdBy: new Types.ObjectId(userId) ? new Types.ObjectId(userId) : null,
      });
      return ballot;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateBalllot: UpdateBallotDto, userId: string) {
    try {
      //Check if the ballot is exist
      const ballotExist = await this.ballotsModel.exists({ _id: id });
      if (!ballotExist) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }



      const ballot = await this.ballotsModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateBalllot,
          electionId: updateBalllot.electionId ? new Types.ObjectId(updateBalllot.electionId) : null,
          voterId: updateBalllot.voterId ? new Types.ObjectId(updateBalllot.voterId) : null,
          updatedBy: new Types.ObjectId(userId) ? new Types.ObjectId(userId) : null,
        }, { new: true })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: "username fullName email position",
            }
          ]
        })
        .populate('entityId')
        .exec();
      return ballot;
    } catch (error) {
      throw error;
    }
  }
  async updateStatus(id: string, userId: string) {
    try {
      //Check if the ballot is exist
      const ballotExist = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballotExist) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      //Check if the election is valid
      const electionExist = await this.electionsModel.findById(new Types.ObjectId(ballotExist.electionId));
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      if (electionExist.status && electionExist.status !== STATUS.ACTIVE) {
        throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
      }

      //Check if the voter is valid
      const voterExist = await this.votersModel.findById(new Types.ObjectId(ballotExist.voterId));
      if (!voterExist) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      if (voterExist.status && voterExist.status !== STATUS.ACTIVE) {
        throw new Error(MESSAGE.VOTER_IS_NOT_ACTIVE);
      }

      //Check the status of ballots is valid
      if (ballotExist.status === 'Active') {
        throw new Error('Ballot is already active');
      }
      if (ballotExist.status === 'Locked' || ballotExist.status === 'Invalid') {
        throw new Error('Ballot cannot be activated');
      }

      //genertate OTP

      ballotExist.status = 'Active';
      ballotExist.issuedAt = new Date();
      ballotExist.updatedBy = new Types.ObjectId(userId);


      await ballotExist.save();
      return ballotExist;
    } catch (error) {
      throw error;
    }
  }


  async getStatistics() {
    try {
      //Lấy tổng số phiếu của cuộc bầu cử
      const ballots = await this.ballotsModel.countDocuments();

      //Lấy tổng số phiếu đã bình chọn và chưa bình chonk => pending và active
      const ballotStatus = await this.ballotsModel.aggregate([
        {
          $match: {
            status: { $in: [STATUS.PENDING, STATUS.CAST] },
          },
        },
        {
          $group: {
            _id: '$status',
            totalBallots: { $sum: 1 },
          },
        },
      ]);
      return {
        total: ballots,
        ballotStatus,
      };
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const ballot = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballot) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      ballot.status = STATUS.INACTIVE;
      await ballot.save();

      return ballot;
    } catch (error) {
      throw error;
    }
  }
}
