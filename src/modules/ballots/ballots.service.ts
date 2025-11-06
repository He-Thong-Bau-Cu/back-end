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

      const ballots = await this.ballotsModel.find({ electionId })
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

      const ballots = await this.ballotsModel.find({ voterId })
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

      //Check if the ballots is exist
      if (!ballots) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async create(createBallot: CreateBallotDto) {
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
      const votingRight = await this.votingRightsModel.findOne({ voterId: createBallot.voterId, electionId: createBallot.electionId });
      if (votingRight) {
        if (votingRight.shares <= 0 || votingRight.votes <= 0) {
          throw new Error(MESSAGE.VOTING_RIGHT_NOT_ELIGIBLE);
        }
      } else {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }

      //Check electionEntity exists
      const electionEntityExists = await this.electionEntitiesModel.findOne({ _id: createBallot.entityId });
      if (electionEntityExists) {
        if (electionEntityExists.status && electionEntityExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.ELECTION_ENTITY_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.ELECTION_ENTITY_NOT_FOUND);
      }
      const ballot = await this.ballotsModel.create(createBallot);
      return ballot;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateBalllot: UpdateBallotDto) {
    try {
      //Check if the ballot is exist
      const ballotExist = await this.ballotsModel.exists({ _id: id });
      if (!ballotExist) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }
      const ballot = await this.ballotsModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateBalllot, { new: true })
        .exec();
      return ballot;
    } catch (error) {
      throw error;
    }
  }
}
