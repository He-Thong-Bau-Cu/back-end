import { Injectable } from '@nestjs/common';
import { CreateVotingRightDto } from './dto/create-voting-right.dto';
import { UpdateVotingRightDto } from './dto/update-voting-right.dto';
import { InjectModel } from '@nestjs/mongoose';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import e from 'express';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class VotingRightsService {
  constructor(
    @InjectModel(VotingRights.name)
    private readonly votingRightModel: Model<VotingRights>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
  ) { }

  async getById(id: string) {
    try {

      const votingRight = await this.votingRightModel.findById(new Types.ObjectId(id))
        .populate('electionId')
        .populate('voterId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the voting right exists
      if (!votingRight) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }

      return votingRight;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      //Check if the election exists
      const electionExists = await this.electionsModel.exists({ _id: electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const votingRights = await this.votingRightModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId')
        .populate({
          path: 'voterId',
          populate: {
            path: 'userId',
            select: 'fullName username email phone position department'
          }
        })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the voting rights exists
      if (!votingRights) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }
      return votingRights;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterId(voterId: string) {
    try {
      //Check if the voter exists
      const voterExists = await this.votersModel.exists({ _id: voterId });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const votingRights = await this.votingRightModel
        .find({ voterId: new Types.ObjectId(voterId) })
        .populate('electionId')
        .populate('voterId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the voting rights exists
      if (!votingRights) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }
      return votingRights;
    } catch (error) {
      throw error;
    }
  }

  async create(createVotingRightDto: CreateVotingRightDto, userId: string) {
    try {
      //Check if the election exists
      const electionExists = await this.electionsModel.exists({ _id: createVotingRightDto.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      //Check if the voter exists
      const voterExists = await this.votersModel.exists({ _id: createVotingRightDto.voterId });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      //Kiểm tra votingRights đã tồn tại chưa
      const votingRightExists = await this.votingRightModel.exists({
        electionId: createVotingRightDto.electionId,
        voterId: createVotingRightDto.voterId,
      });
      if (votingRightExists) {
        throw new Error(MESSAGE.VOTING_RIGHT_ALREADY_EXISTS);
      }

      const votingRight = await this.votingRightModel.create({
        ...createVotingRightDto,
        electionId: new Types.ObjectId(createVotingRightDto.electionId),
        voterId: new Types.ObjectId(createVotingRightDto.voterId),
        createdBy: new Types.ObjectId(userId) || null,
      });
      return votingRight;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateVotingRightDto: UpdateVotingRightDto, userId: string) {
    try {
      //Check if the voting right exists
      const votingRightExists = await this.votingRightModel.exists({ _id: id });
      if (!votingRightExists) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }



      const votingRight = await this.votingRightModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateVotingRightDto,
          electionId: updateVotingRightDto.electionId ? new Types.ObjectId(updateVotingRightDto.electionId) : null,
          voterId: updateVotingRightDto.voterId ? new Types.ObjectId(updateVotingRightDto.voterId) : null,
          updatedBy: new Types.ObjectId(userId) || null,
        }, { new: true })
        .populate('electionId')
        .populate('voterId')
        .exec();
      return votingRight;
    } catch (error) {
      throw error;
    }
  }




}
