import { Injectable } from '@nestjs/common';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Voters } from 'src/database/schemas/voters.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
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
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,

  ) { }



  async create(createVoter: CreateVoterDto) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.findOne({ electionId: createVoter.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }else if(electionExists.status && electionExists.status !== STATUS.ACTIVE){
        throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
      }

      // Kiểm tra userId có tồn tại không
      const userExists = await this.userModel.findOne({ userId: createVoter.userId });
      if (!userExists) {
        throw new Error(MESSAGE.USER_NOT_FOUND);
      }else if(userExists.status && userExists.status !== STATUS.ACTIVE){
        throw new Error(MESSAGE.USER_IS_NOT_ACTIVE);
      }
      const voter = new this.voterModel({
        electionId: new Types.ObjectId(createVoter.electionId),
        userId: new Types.ObjectId(createVoter.userId),
        eligible: createVoter.eligible,
        status: createVoter.status
      })
      return await voter.save();
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
          populate:[
            {path:"typeId",select:"typeName typeNameCode description status"},
            {path:"votingMethodId",select:"methodName methodCode description status"},
            {path:"thresholdId",select:"thresholdName thresholdCode value description status"}
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
          populate:[
            {path:"typeId",select:"typeName typeNameCode description status"},
            {path:"votingMethodId",select:"methodName methodCode description status"},
            {path:"thresholdId",select:"thresholdName thresholdCode value description status"}
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
          populate:[
            {path:"typeId",select:"typeName typeNameCode description status"},
            {path:"votingMethodId",select:"methodName methodCode description status"},
            {path:"thresholdId",select:"thresholdName thresholdCode value description status"}
          ]
        })
        .populate('userId', 'fullName username email phone position department')
        .exec();

      return voters;
    } catch (error) {
      throw error;
    }
  }
}
