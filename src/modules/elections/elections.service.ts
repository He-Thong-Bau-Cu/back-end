import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate } from 'src/common/dto/paignation';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { Elections, ElectionsDocument } from 'src/database/schemas/elections.schema';
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
import removeVietnameseTones, { isValidateTimeline } from 'src/common/utils/format';
import {
  ElectionsParticipants,
  ElectionsParticipantsDocument,
} from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesDocument } from 'src/database/schemas/roles.schema';
import { USER_ROLE } from 'src/common/enums/config.enum';

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
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipantsDocument>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<RolesDocument>,
  ) { }

  async searchElections(req: SearchDTO) {
    try {
      const query: any = {};
      if (req.textSearch) {
        query.title = { $regex: req.textSearch, $options: 'i' };
      }
      if (req.statusData) {
        query.statusData = req.statusData;
      }
      if (req.decisionName) {
        query.decisionName = { $regex: req.decisionName, $options: 'i' };
      }
      if (req.decisionNumber) {
        query.decisionNumber = { $regex: req.decisionNumber, $options: 'i' };
      }
      if (req.status) {
        query.status = req.status;
      }

      const elections = await this.electionsModel
        .find(query)
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId')
        .populate('createdBy', 'username fullName email position')
        .exec();
      return paginate(elections, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  async createElection(createElection: CreateElectionDto, userId: string) {
    try {
      //Kiểm tra trong ngày đó đã có cuộc bầu cử nào chưa
      if (createElection?.startDate && createElection?.endDate) {
        const startDate = new Date(createElection.startDate);
        const endDate = new Date(createElection.endDate);
        const elections = await this.electionsModel.find({
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        });
        if (elections.length > 0) {
          throw new Error(MESSAGE.ELECTION_ALREADY_EXISTS);
        }
      }
      //Kiểm tra electionType có tồn tại hay Không
      if (createElection?.typeId) {
        const electionTypeExist = await this.electionTypeModel.exists({
          _id: new Types.ObjectId(createElection.typeId),
        });
        if (!electionTypeExist) {
          throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
        }
      }
      //Kiểm tra voting method có tồn tại hay Không
      if (createElection?.votingMethodId) {
        const votingMethodExist = await this.votingMethodModel.exists({
          _id: new Types.ObjectId(createElection.votingMethodId),
        });
        if (!votingMethodExist) {
          throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
        }
      }

      //Kiểm tra electionType có tồn tại hay Không
      if (createElection?.thresholdId) {
        const thresholdExist = await this.thresholdModel.exists({
          _id: createElection.thresholdId,
        });
        if (!thresholdExist) {
          throw new Error(MESSAGE.THRESHOLD_NOT_FOUND);
        }
      }

      const createdAt = new Date();
      if (createElection?.endDate && createElection?.startDate) {
        //Kiểm tra ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày
        const endDate = new Date(createElection?.endDate);
        const minEnd = new Date(createdAt);
        minEnd.setDate(minEnd.getDate() + 20);

        if (endDate < minEnd) {
          throw new Error("Ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày");
        }

        //Kiểm tra ngày bắt đầu cuộc bầu cử và ngày kết thúc cuộc bầu cử phải nằm trong cùng 1 Ngày
        const startDate = new Date(createElection?.startDate);
        if (startDate.toDateString() !== endDate.toDateString()) {
          throw new Error("Ngày bắt đầu và ngày kết thúc cuộc bầu cử phải nằm trong cùng một ngày");
        }
        //  endDate > startDate (khác giờ)
        if (endDate <= startDate) {
          throw new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu");
        }
      }
      //Kiểm tra xem delegationEnd phải nhỏ hơn startDate ít nhất 10 Ngày
      if (createElection?.delegationEnd && createElection?.startDate) {
        const delegationEnd = new Date(createElection.delegationEnd);
        const startDate = new Date(createElection.startDate);
        const minStart = new Date(delegationEnd);
        minStart.setDate(minStart.getDate() + 10);
        if (startDate < minStart) {
          throw new Error('Ngày kết thúc ủy quyền phải nhỏ hơn ngày bắt đầu cuộc bầu cử ít nhất 10 ngày');
        }
      }


      //Kiểm tra delegationDate có hợp lệ không
      if (createElection?.delegationStart && createElection?.delegationEnd) {
        const delStart = new Date(createElection.delegationStart);
        const delEnd = new Date(createElection.delegationEnd);

        if (delEnd <= delStart) {
          throw new BadRequestException('Ngày kết thúc ủy quyền phải sau ngày bắt đầu ủy quyền');
        }
        // Nếu có delegation, đảm bảo nằm trong phạm vi election
        if (createElection?.startDate && createElection?.endDate) {
          if (delStart < createdAt) {
            throw new BadRequestException('Thời gian ủy quyền phải trong khoảng thời gian của cuộc bầu cử');
          }
        }
      }

      const election = await this.electionsModel.create({
        ...createElection,
        typeId: createElection.typeId ? new Types.ObjectId(createElection.typeId) : null,
        votingMethodId: createElection.votingMethodId
          ? new Types.ObjectId(createElection.votingMethodId)
          : null,
        thresholdId: createElection.thresholdId
          ? new Types.ObjectId(createElection.thresholdId)
          : null,
        createdBy: userId ? new Types.ObjectId(userId) : null,
        createdAt: createdAt,
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
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
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

  async updateElections(id: string, updateElection: UpdateElectionDto, userId: string) {
    try {
      //Kiểm tra nếu có timeline thì thời gian phải hợp lệ
      if (updateElection?.timeline) {
        isValidateTimeline(updateElection.timeline);
      }
      //Kiểm tra trong ngày đó đã có cuộc bầu cử nào chưa
      if (updateElection?.startDate && updateElection?.endDate) {
        const startDate = new Date(updateElection.startDate);
        const endDate = new Date(updateElection.endDate);
        const elections = await this.electionsModel.find({
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        });
        if (elections.length > 0) {
          throw new Error(MESSAGE.ELECTION_ALREADY_EXISTS);
        }
      }
      //Kiểm tra electionType có tồn tại hay Không
      if (updateElection?.typeId) {
        const electionTypeExist = await this.electionTypeModel.exists({
          _id: new Types.ObjectId(updateElection.typeId),
        });
        if (!electionTypeExist) {
          throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
        }
      }
      //Kiểm tra voting method có tồn tại hay Không
      if (updateElection?.votingMethodId) {
        const votingMethodExist = await this.votingMethodModel.exists({
          _id: new Types.ObjectId(updateElection.votingMethodId),
        });
        if (!votingMethodExist) {
          throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
        }
      }

      //Kiểm tra electionType có tồn tại hay Không
      if (updateElection?.thresholdId) {
        const thresholdExist = await this.thresholdModel.exists({
          _id: new Types.ObjectId(updateElection.thresholdId),
        });
        if (!thresholdExist) {
          throw new Error(MESSAGE.THRESHOLD_NOT_FOUND);
        }
      }

      const createdAt = new Date();
      if (updateElection?.endDate && updateElection?.startDate) {
        //Kiểm tra ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày
        const endDate = new Date(updateElection?.endDate);
        const minEnd = new Date(createdAt);
        minEnd.setDate(minEnd.getDate() + 20);

        if (endDate < minEnd) {
          throw new Error("Ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày");
        }

        //Kiểm tra ngày bắt đầu cuộc bầu cử và ngày kết thúc cuộc bầu cử phải nằm trong cùng 1 Ngày
        const startDate = new Date(updateElection?.startDate);
        if (startDate.toDateString() !== endDate.toDateString()) {
          throw new Error("Ngày bắt đầu và ngày kết thúc cuộc bầu cử phải nằm trong cùng một ngày");
        }
        //  endDate > startDate (khác giờ)
        if (endDate <= startDate) {
          throw new Error("Giờ kết thúc phải lớn hơn giờ bắt đầu");
        }
      }
      //Kiểm tra xem delegationEnd phải nhỏ hơn startDate ít nhất 10 Ngày
      if (updateElection?.delegationEnd && updateElection?.startDate) {
        const delegationEnd = new Date(updateElection.delegationEnd);
        const startDate = new Date(updateElection.startDate);
        const minStart = new Date(delegationEnd);
        minStart.setDate(minStart.getDate() + 10);
        if (startDate < minStart) {
          throw new Error('Ngày kết thúc ủy quyền phải nhỏ hơn ngày bắt đầu cuộc bầu cử ít nhất 10 ngày');
        }
      }


      //Kiểm tra delegationDate có hợp lệ không
      if (updateElection?.delegationStart && updateElection?.delegationEnd) {
        const delStart = new Date(updateElection.delegationStart);
        const delEnd = new Date(updateElection.delegationEnd);

        if (delEnd <= delStart) {
          throw new BadRequestException('Ngày kết thúc ủy quyền phải sau ngày bắt đầu ủy quyền');
        }
        // Nếu có delegation, đảm bảo nằm trong phạm vi election
        if (updateElection?.startDate && updateElection?.endDate) {
          if (delStart < createdAt) {
            throw new BadRequestException('Thời gian ủy quyền phải trong khoảng thời gian của cuộc bầu cử');
          }
        }
      }


      const election = await this.electionsModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          {
            ...updateElection,
            typeId: updateElection.typeId ? new Types.ObjectId(updateElection.typeId) : null,
            votingMethodId: updateElection.votingMethodId ? new Types.ObjectId(updateElection.votingMethodId) : null,
            thresholdId: updateElection.thresholdId ? new Types.ObjectId(updateElection.thresholdId) : null,
            startDate: updateElection.startDate,
            endDate: updateElection.endDate,
            delegationStart: updateElection.delegationStart,
            delegationEnd: updateElection.delegationEnd,
            updatedBy: userId ? new Types.ObjectId(userId) : null,
          },
          { new: true },
        )
        .exec();
      return election;
    } catch (error) {
      throw error;
    }
  }

  async deleteElection(id: string) {
    try {
      const election = await this.electionsModel.findById(new Types.ObjectId(id)).exec();
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

  async getElectionOrganizerByTime(startTime: Date, endTime: Date) {
    try {
      const elections = await this.electionsModel
        .find({
          startDate: { $lt: endTime },
          endDate: { $gt: startTime },
        })
        .exec();

      const electionParticipants = await this.electionParticipantsModel
        .find({
          electionId: { $in: elections.map((e) => e._id) },
        })
        .populate('userId')
        .exec();

      const busyUserIds = electionParticipants.map((item) => item.userId._id);

      const roles = await this.rolesModel
        .find({
          $or: [{ roleCode: USER_ROLE.ADMIN }, { roleCode: USER_ROLE.PRESIDE }],
        })
        .exec();

      const roleIds = roles.map((role) => role._id);

      const availableUsers = await this.userModel
        .find({
          _id: { $nin: busyUserIds },
          roleId: { $nin: roleIds },
        })
        .exec();

      return availableUsers;
    } catch (error) {
      throw error;
    }
  }

  async approveAndSign(
    p12File: Express.Multer.File,
    electionId: string,
    password: string,
    userId: string,
  ) {
    try {
    } catch (error) {
      throw error;
    }
  }
}
