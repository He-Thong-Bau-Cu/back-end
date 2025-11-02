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

  async create(createVotingRightDto: CreateVotingRightDto) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.exists({ _id: createVotingRightDto.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      // Kiểm tra voterId có tồn tại không
      const voterExists = await this.votersModel.exists({ _id: createVotingRightDto.voterId });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const votingRight = await this.votingRightModel.create(createVotingRightDto);
      return votingRight;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateVotingRightDto: UpdateVotingRightDto) {
    try {
      //Check if the voting right exists
      const votingRightExists = await this.votingRightModel.exists({ _id: id });
      if (!votingRightExists) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }

      const votingRight = await this.votingRightModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateVotingRightDto, { new: true })
        .exec();
      return votingRight;
    } catch (error) {
      throw error;
    }
  }




}
