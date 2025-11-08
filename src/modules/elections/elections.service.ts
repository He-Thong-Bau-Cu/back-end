import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate } from 'src/common/dto/paignation';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import {
  Elections,
  ElectionsDocument,
} from 'src/database/schemas/elections.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { ElectionsDocumentDto } from './dto/electionsDocument.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';
import { Thresholds } from 'src/database/schemas/thresholds.schema';
import { Users } from 'src/database/schemas/users.schema';
import { CreateElectionDto } from './dto/create-elections-dto';
import { UpdateElectionDto } from './dto/update-elections-dto';
import { SearchElectionsDto } from './dto/search-dto';
import { SearchDTO } from 'src/common/dto/search.dto';
import removeVietnameseTones from 'src/common/utils/format';

@Injectable()
export class ElectionsService {
  constructor(
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<ElectionsDocument>,
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
    @InjectModel(ElectionTypes.name)
    private readonly electionTypeModel: Model<ElectionTypes>,
    @InjectModel(VotingMethods.name)
    private readonly votingMethodModel: Model<VotingMethods>,
    @InjectModel(Thresholds.name)
    private readonly thresholdModel: Model<Thresholds>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
  ) { }

  async searchElections(req: SearchDTO) {
    try {
      const elections = await this.electionsModel.find({
        $or: [
          { title: { $regex: removeVietnameseTones(req.textSearch), $options: 'i' } },
          { decisionName: { $regex: removeVietnameseTones(req.decisionName), $options: 'i' } },
          { decisionNumber: { $regex: req.decisionNumber, $options: 'i' } },
          { status: { $regex: req.status, $options: 'i' } },
        ],
      })
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId').exec();
      return paginate(elections, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }


  async createElection(createElection: CreateElectionDto) {
    try {
      //Kiểm tra electionType có tồn tại hay Không
      const electionTypeExist = await this.electionTypeModel.exists({ _id: createElection.typeId });
      if (!electionTypeExist) {
        throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
      }

      //Kiểm tra voting method có tồn tại hay Không
      const votingMethodExist = await this.votingMethodModel.exists({ _id: createElection.votingMethodId });
      if (!votingMethodExist) {
        throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
      }

      //Kiểm tra electionType có tồn tại hay Không
      const thresholdExist = await this.thresholdModel.exists({ _id: createElection.thresholdId });
      if (!thresholdExist) {
        throw new Error(MESSAGE.THRESHOLD_NOT_FOUND);
      }

      //Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
      if (createElection.startDate && createElection.endDate) {
        const start = new Date(createElection.startDate);
        const end = new Date(createElection.endDate);
        if (end <= start) {
          throw new BadRequestException('End date must be after start date');
        }
      }

      //Kiểm tra delegationDate có hợp lệ không
      if (createElection.delegationStart && createElection.delegationEnd) {
        const delStart = new Date(createElection.delegationStart);
        const delEnd = new Date(createElection.delegationEnd);
        if (delEnd <= delStart) {
          throw new BadRequestException('Delegation end must be after delegation start');
        }
        // Nếu có delegation, đảm bảo nằm trong phạm vi election
        if (createElection.startDate && createElection.endDate) {
          if (delStart < createElection.startDate || delEnd > createElection.endDate) {
            throw new BadRequestException('Delegation period must be within election duration');
          }
        }
      }


      const election = await this.electionsModel.create({
        ...createElection,
        typeId: createElection.typeId ? new Types.ObjectId(createElection.typeId) : null,
        votingMethodId: createElection.votingMethodId ? new Types.ObjectId(createElection.votingMethodId) : null,
        thresholdId: createElection.thresholdId ? new Types.ObjectId(createElection.thresholdId) : null,
      });
      return election;
    } catch (error) {
      throw error;
    }
  }

  async getElectionById(id: string) {
    try {
      //kiểm tra electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: id });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const election = await this.electionsModel
        .findById(new Types.ObjectId(id))
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId')
        .exec();
      return election;
    } catch (error) {
      throw error;
    }
  }

  // async searchElectionDocumentsByElectionId(electionId: string) {
  //   try {
  //     const documents = await this.electionDocumentsModel
  //       .find({ electionId: new Types.ObjectId(electionId) })
  //       .populate('electionId')
  //       .exec();
  //     return documents;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async updateElections(id: string, data: UpdateElectionDto) {
    try {
      //kiểm tra electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: id });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const election = await this.electionsModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...data,
          typeId: data.typeId ? new Types.ObjectId(data.typeId) : null,
          votingMethodId: data.votingMethodId ? new Types.ObjectId(data.votingMethodId) : null,
          thresholdId: data.thresholdId ? new Types.ObjectId(data.thresholdId) : null,
        }, { new: true })
        .exec();
      return election;
    } catch (error) {
      throw error;
    }
  }

  async deleteElection(id: string) {
    try {

      const election = await this.electionsModel
        .findById(new Types.ObjectId(id))
        .exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      election.status = STATUS.CLOSED;
      return election.save();
    } catch (error) {
      throw error;
    }
  }

  // async createElectionDocuments(req: ElectionsDocumentDto) {
  //   try {
  //     const election = await this.electionDocumentsModel.create(req);
  //     return election;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async searchDocumentsByElectionId(electionId: string) {
  //   try {
  //     const documents = await this.electionDocumentsModel
  //       .find({ electionId: new Types.ObjectId(electionId) })
  //       .exec();
  //     return documents;
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // async deleteDocumentByElectionId(electionId: string) {
  //   try {
  //     const documents = await this.electionDocumentsModel
  //       .deleteMany({ electionId: new Types.ObjectId(electionId) })
  //       .exec();
  //     return documents;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
