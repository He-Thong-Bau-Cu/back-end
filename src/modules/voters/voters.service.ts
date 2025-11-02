import { Injectable } from '@nestjs/common';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Voters } from 'src/database/schemas/voters.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { User } from 'src/database/schemas/users.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class VotersService {
  constructor(
    @InjectModel(Voters.name)
    private readonly voterModel: Model<Voters>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,

  ) { }

  async create(createVoter: CreateVoterDto) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.exists({ _id: createVoter.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      // Kiểm tra userId có tồn tại không
      const userExists = await this.userModel.exists({ _id: createVoter.userId });
      if (!userExists) {
        throw new Error(MESSAGE.USER_NOT_FOUND);
      }
      const voter = await this.voterModel.create(createVoter);
      return voter;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateVoter: UpdateVoterDto) {
    try {
      //Check if the voter exists
      const voterExists = await this.voterModel.exists({ _id: id });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const voter = await this.voterModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateVoter, { new: true })
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
      const electionExists = await this.electionsModel.findOne({ _id: electionId });
      if (electionExists) {
        if (electionExists.status && electionExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check voters exists
      const votersExists = await this.voterModel.find({ electionId: electionId, status: STATUS.ACTIVE });


      return votersExists;
    } catch (error) {
      throw error;
    }
  }
}
