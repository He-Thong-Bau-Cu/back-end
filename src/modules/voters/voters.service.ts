import { Injectable } from '@nestjs/common';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Voters } from 'src/database/schemas/voters.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { User } from 'src/database/schemas/users.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';

@Injectable()
export class VotersService {
  constructor(
    @InjectModel(Voters.name)
    private readonly voterModel: Model<Voters>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,


  ) { }

  async create(createVoter: CreateVoterDto) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.exists({ _id: createVoter.electionId });
      if (!electionExists) {
        throw new Error('Không tìm thấy cuộc bầu cử');
      }
      // Kiểm tra userId có tồn tại không
      const userExists = await this.userModel.exists({ _id: createVoter.userId });
      if (!userExists) {
        throw new Error('Không tìm thấy người dùng');
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
        throw new Error('Không tìm thấy cử tri');
      }
      const voter = await this.voterModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateVoter, { new: true })
        .exec();
      return voter;
    } catch (error) {
      throw error;
    }
  }

}
