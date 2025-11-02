import { Injectable } from '@nestjs/common';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { User } from 'src/database/schemas/users.schema';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class DelegationsService {
  constructor(
    @InjectModel(Delegations.name)
    private readonly delegationModel: Model<Delegations>,
    @InjectModel(Elections.name)
    private readonly electionModel: Model<Elections>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(ElectionDocuments.name)
    private readonly documentModel: Model<ElectionDocuments>,

  ) { }

  async getByElectionId(id: string) {
    try {
      const delegation = await this.delegationModel
        .findOne({ electionId: id })
        .populate([
          { path: 'electionId', select: "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName" },
          { path: 'delegatorId', select: "username fullName email position" },
          { path: 'delegateId', select: "username fullName email position" },
          { path: 'confirmedBy', select: "username fullName email position" },
          { path: 'documentId', select: "title file_url status" },
        ]).exec();
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      console.log("id: ", id);
      const delegation = await this.delegationModel
        .findById(new Types.ObjectId(id))
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .exec();
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async getDeletaionsPending() {
    try {
      const delegation = await this.delegationModel
        .findOne({ status: 'pending' })
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .exec();
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async create(createDelegation: CreateDelegationDto) {
    try {
      //Check if the election is exist
      const electionExist = await this.electionModel.exists({ _id: createDelegation.electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      //Check if the user is exist
      const userExist = await this.userModel.exists({ _id: createDelegation.delegatorId });
      if (!userExist) {
        throw new Error(MESSAGE.USER_IS_NOT_FOUND);
      }
      //Check electionDocument is exist
      if (createDelegation.documentId) {
        const documentExist = await this.documentModel.exists({ _id: createDelegation.documentId });
        if (!documentExist) {
          throw new Error(MESSAGE.DOCUMENT_IS_NOT_FOUND);
        }
      }
      const delegation = await this.delegationModel.create(createDelegation);
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateDelegation: UpdateDelegationDto) {
    try {
      //Check if the delegation is exist
      const delegationExist = await this.delegationModel.exists({ _id: id });
      if (!delegationExist) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }
      const delegation = await this.delegationModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateDelegation, { new: true })
        .exec();
      return delegation;
    } catch (error) {
      throw error;
    }
  }
}
