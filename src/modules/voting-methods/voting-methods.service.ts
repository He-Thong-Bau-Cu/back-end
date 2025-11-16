import { Injectable } from '@nestjs/common';
import { CreateVotingMethodDto } from './dto/create-voting-method.dto';
import { UpdateVotingMethodDto } from './dto/update-voting-method.dto';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { VotingMethodSearchDTO } from './dto/search.dto';
import { paginate } from 'src/common/dto/paignation';

@Injectable()
export class VotingMethodsService {
  constructor(
    @InjectModel(VotingMethods.name)
    private readonly votingMethodsModel: Model<VotingMethods>
  ) { }

  async findOne(methodCode: string) {
    try {
      const votingMethod = await this.votingMethodsModel
        .findOne({ methodCode })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!votingMethod) {
        throw new Error(MESSAGE.VOTING_METHOD_CODE_NOT_FOUND);
      }
      return votingMethod;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const votingMethod = await this.votingMethodsModel
        .findById(new Types.ObjectId(id))
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!votingMethod) {
        throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
      }
      return votingMethod;
    } catch (error) {
      throw error;
    }
  }

  async search(req: VotingMethodSearchDTO) {
    try {
      const query: any = {};

      if (req.keyword) {
        query.$or = [
          { role_name: { $regex: req.keyword, $options: 'i' } },
          { role_code: { $regex: req.keyword, $options: 'i' } },
          { description: { $regex: req.keyword, $options: 'i' } },
        ];
      }

      const votingMethods = await this.votingMethodsModel.find(query)
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return paginate(
        votingMethods,
        req.page,
        req.limit
      );
    } catch (error) {
      throw error;
    }
  }
  async create(createVotingMethodDto: CreateVotingMethodDto, userId: string) {
    try {
      const createdVotingMethod = this.votingMethodsModel.create(createVotingMethodDto);
      return { ...createdVotingMethod, createdBy: userId };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateVotingMethodDto: UpdateVotingMethodDto, userId: string) {
    try {
      const updatedVotingMethod = await this.votingMethodsModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { ...updateVotingMethodDto, updatedBy: userId },
        { new: true },
      ).exec();
      if (!updatedVotingMethod) {
        throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
      }
      return updatedVotingMethod;
    } catch (error) {
      throw error;
    }
  }




}
