import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { Connection, Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { ElectionDocument, ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { DELEGATION_TYPE, STATUS } from 'src/common/enums/status.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { UsersService } from '../users/users.service';
import { DelegationDto } from './dto/delegation.dto';
import PdfPrinter from 'pdfmake';
import path from 'path';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { paginate } from 'src/common/dto/paignation';
import { formatDateDMYVN, formatDateVN, validateStatusFormat, getCurrentDateVN } from 'src/common/utils/format';
import { SigningService } from '../signature/signature.service';
import { Voters, VotersDocument } from 'src/database/schemas/voters.schema';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import {
  ElectionsParticipants,
  ElectionsParticipantsDocument,
} from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesDocument } from 'src/database/schemas/roles.schema';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDto } from 'src/common/dto/user.dto';
import { VotingRights, VotingRightsDocument } from 'src/database/schemas/votingRights.schema';
import { VotingRightsController } from '../voting-rights/voting-rights.controller';
import { NotificationService } from '../notification/notification.service';
import { DelegateCardsService } from '../delegate-cards/delegate-cards.service';
import { MeetingAttendees, MeetingAttendeesDocument } from 'src/database/schemas/meetingAttendees.schema';
import { Meetings, MeetingsDocument } from 'src/database/schemas/meetings.schema';
import { DelegateCard, DelegateCardDocument } from 'src/database/schemas/delegateCard.schema';
import e from 'express';

@Injectable()
export class DelegationsService {
  constructor(
    @InjectModel(Delegations.name)
    private readonly delegationModel: Model<Delegations>,
    @InjectModel(Elections.name)
    private readonly electionModel: Model<Elections>,
    @InjectModel(Users.name)
    private readonly userModel: Model<Users>,
    @InjectModel(ElectionDocuments.name)
    private readonly documentModel: Model<ElectionDocument>,
    private readonly signatureService: SigningService,
    @InjectModel(Voters.name)
    private readonly voterModel: Model<VotersDocument>,
    private readonly fileService: MinioService,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipantsDocument>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<RolesDocument>,
    private readonly usersService: UsersService,
    @InjectModel(VotingRights.name)
    private readonly votingRightModel: Model<VotingRightsDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly notificationService: NotificationService,
    private readonly delegateCardsService: DelegateCardsService,
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendeesDocument>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<MeetingsDocument>,
    @InjectModel(DelegateCard.name)
    private readonly delegateCardModel: Model<DelegateCardDocument>,
  ) { }
  async getDelegatorIdAndElectionId(delegatorId: string, electionId: string) {
    try {
      //kiểm tra xem có electionId không
      const electionExist = await this.electionModel.exists({
        _id: new Types.ObjectId(electionId),
      });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //kiểm tra xem có delegatorId Không
      const delegatorExist = await this.userModel.exists({
        _id: new Types.ObjectId(delegatorId),
      });
      if (!delegatorExist) {
        throw new Error(MESSAGE.DELEGATOR_NOT_FOUND);
      }

      const delegation = await this.delegationModel
        .find({
          delegatorId: new Types.ObjectId(delegatorId),
          electionId: new Types.ObjectId(electionId),
        })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(id: string) {
    try {
      //kiểm tra xem có electionId không
      const electionExist = await this.electionModel.exists({
        _id: new Types.ObjectId(id),
      });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const delegation = await this.delegationModel
        .find({ electionId: new Types.ObjectId(id) })
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'delegatorId', select: 'username fullName email position' },
          { path: 'delegateId', select: 'username fullName email position' },
          { path: 'confirmedBy', select: 'username fullName email position' },
          { path: 'documentId', select: 'title file_url status' },
          { path: 'createdBy', select: 'username fullName email position' },
          { path: 'updatedBy', select: 'username fullName email position' },
        ])
        .exec();

      // Chỉ populate documentId nếu nó tồn tại và là ObjectId hợp lệ
      // if (delegation) {
      //   const docId = delegation.documentId as any;
      //   if (docId && docId !== '' && Types.ObjectId.isValid(docId)) {
      //     const document = await this.documentModel
      //       .findById(docId)
      //       .select('title file_url status')
      //       .lean()
      //       .exec();
      //     (delegation as any).documentId = document;
      //   } else {
      //     (delegation as any).documentId = null;
      //   }
      // }

      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async getByDelegator(delegatorId: string) {
    try {
      //kiểm tra xem có delegatorId không
      const delegatorExist = await this.userModel.exists({
        _id: new Types.ObjectId(delegatorId),
      });
      if (!delegatorExist) {
        throw new Error(MESSAGE.DELEGATOR_NOT_FOUND);
      }
      const delegations = await this.delegationModel
        .find({ delegatorId: new Types.ObjectId(delegatorId) })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async getByDelegate(delegateId: string) {
    try {
      //kiểm tra xem có delegateId không
      const delegateExist = await this.userModel.exists({
        _id: new Types.ObjectId(delegateId),
      });
      if (!delegateExist) {
        throw new Error(MESSAGE.DELEGATE_NOT_FOUND);
      }
      const delegations = await this.delegationModel
        .find({ delegateId: new Types.ObjectId(delegateId) })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async getStatusActive() {
    try {
      const delegations = await this.delegationModel
        .find({ status: STATUS.ACTIVE })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //kiểm tra có delegation
      if (!delegations) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }

      // Populate documentId cho từng delegation nếu có
      for (const delegation of delegations) {
        const docId = delegation.documentId as any;
        if (docId && docId !== '' && Types.ObjectId.isValid(docId)) {
          const document = await this.documentModel
            .findById(docId)
            .select('title file_url status')
            .lean()
            .exec();
          (delegation as any).documentId = document;
        } else {
          (delegation as any).documentId = null;
        }
      }

      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async getByStatus(status: string) {
    try {
      //Kiểm tra trạng thái có hợp lệ không
      validateStatusFormat(status);
      const delegations = await this.delegationModel
        .find({ status })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //kiểm tra có delegation
      if (!delegations) {
        throw new Error(`Không có ủy quyền theo trạng thái: ${status}`);
      }

      // Populate documentId cho từng delegation nếu có
      for (const delegation of delegations) {
        const docId = delegation.documentId as any;
        if (docId && docId !== '' && Types.ObjectId.isValid(docId)) {
          const document = await this.documentModel
            .findById(docId)
            .select('title file_url status')
            .lean()
            .exec();
          (delegation as any).documentId = document;
        } else {
          (delegation as any).documentId = null;
        }
      }

      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      //kiểm tra xem có delegationId không
      const delegationExist = await this.delegationModel.exists({
        _id: new Types.ObjectId(id),
      });
      if (!delegationExist) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }


      const delegation = await this.delegationModel
        .findById(new Types.ObjectId(id))
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .lean()
        .exec();

      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async getDelegationByElectionId(electionId: string) {
    try {
      const delegations = await this.delegationModel
        .find({
          electionId: new Types.ObjectId(electionId),
        })
        .exec();
      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async getDelegationsPending() {
    try {
      const delegation = await this.delegationModel
        .findOne({ status: STATUS.PENDING })
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      // Chỉ populate documentId nếu nó tồn tại và là ObjectId hợp lệ
      if (delegation) {
        const docId = delegation.documentId as any;
        if (docId && docId !== '' && Types.ObjectId.isValid(docId)) {
          const document = await this.documentModel
            .findById(docId)
            .select('title file_url status')
            .lean()
            .exec();
          (delegation as any).documentId = document;
        } else {
          (delegation as any).documentId = null;
        }
      }

      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async create(createDelegation: CreateDelegationDto, userId: string) {
    try {
      const electionExist = await this.validateElection(createDelegation);
      await this.validateDelegateInfo(createDelegation);
      await this.validateDelegator(createDelegation);
      await this.validateDelegate(createDelegation);
      await this.validateDelegationTime(createDelegation, electionExist);
      await this.validateDocument(createDelegation);
      await this.validateConfirmedBy(createDelegation);

      //Create delegation
      const delegation = await this.delegationModel.create({
        ...createDelegation,
        electionId: new Types.ObjectId(createDelegation.electionId),
        delegatorId: new Types.ObjectId(createDelegation.delegatorId),
        delegateId: createDelegation?.delegateId
          ? new Types.ObjectId(createDelegation.delegateId)
          : null,
        documentId: createDelegation?.documentId
          ? new Types.ObjectId(createDelegation.documentId)
          : null,
        confirmedBy: createDelegation?.confirmedBy
          ? new Types.ObjectId(createDelegation.confirmedBy)
          : null,
        startDate:
          createDelegation.delegationType == DELEGATION_TYPE.ELECTION
            ? new Date(electionExist.startDate)
            : createDelegation.startDate,
        endDate:
          createDelegation.delegationType == DELEGATION_TYPE.ELECTION
            ? new Date(electionExist.endDate)
            : createDelegation.endDate,
        createdBy: new Types.ObjectId(userId) || null,
      });

      // Return delegation with all fields
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateDelegation: UpdateDelegationDto, userId: string) {
    try {
      //Check if the delegation is exist
      const delegationExist = await this.delegationModel.exists({ _id: id });
      if (!delegationExist) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }

      // Chỉ update những field có dữ liệu
      const updateData: any = {
        updatedBy: new Types.ObjectId(userId),
      };

      // Chỉ thêm field vào updateData nếu có giá trị
      if (updateDelegation.delegationType !== undefined && updateDelegation.delegationType !== null) {
        updateData.delegationType = updateDelegation.delegationType;
      }

      if (updateDelegation.electionId !== undefined && updateDelegation.electionId !== null && updateDelegation.electionId !== '') {
        updateData.electionId = new Types.ObjectId(updateDelegation.electionId);
      }

      if (updateDelegation.delegatorId !== undefined && updateDelegation.delegatorId !== null && updateDelegation.delegatorId !== '') {
        updateData.delegatorId = new Types.ObjectId(updateDelegation.delegatorId);
      }

      if (updateDelegation.delegateId !== undefined && updateDelegation.delegateId !== null && updateDelegation.delegateId !== '') {
        updateData.delegateId = new Types.ObjectId(updateDelegation.delegateId);
      }

      if (updateDelegation.delegateInfo !== undefined && updateDelegation.delegateInfo !== null) {
        updateData.delegateInfo = updateDelegation.delegateInfo;
      }

      if (updateDelegation.startDate !== undefined && updateDelegation.startDate !== null) {
        updateData.startDate = updateDelegation.startDate;
      }

      if (updateDelegation.endDate !== undefined && updateDelegation.endDate !== null) {
        updateData.endDate = updateDelegation.endDate;
      }

      if (updateDelegation.documentId !== undefined && updateDelegation.documentId !== null && updateDelegation.documentId !== '') {
        updateData.documentId = new Types.ObjectId(updateDelegation.documentId);
      }

      if (updateDelegation.delegateReason !== undefined && updateDelegation.delegateReason !== null && updateDelegation.delegateReason !== '') {
        updateData.delegateReason = updateDelegation.delegateReason;
      }

      if (updateDelegation.signature !== undefined && updateDelegation.signature !== null) {
        updateData.signature = updateDelegation.signature;
      }

      if (updateDelegation.status !== undefined && updateDelegation.status !== null && updateDelegation.status !== '') {
        updateData.status = updateDelegation.status;
      }

      if (updateDelegation.confirmedBy !== undefined && updateDelegation.confirmedBy !== null && updateDelegation.confirmedBy !== '') {
        updateData.confirmedBy = new Types.ObjectId(updateDelegation.confirmedBy);
      }

      if (updateDelegation.confirmedAt !== undefined && updateDelegation.confirmedAt !== null) {
        updateData.confirmedAt = updateDelegation.confirmedAt;
      }

      const delegation = await this.delegationModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          updateData,
          { new: true },
        )
        .exec();
      return delegation;
    } catch (error) {
      throw error;
    }
  }

  async searchDelegations(req: BaseSearchDTO) {
    try {
      const keyword = req.keyword.normalize('NFC');

      //search theo election
      const elections = await this.electionModel
        .find({
          $or: [
            { title: { $regex: keyword || '', $options: 'i' } },
            { decisionName: { $regex: keyword || '', $options: 'i' } },
          ],
        })
        .lean();

      const electionIds = elections.map((e) => e._id);

      //search theo delegator
      const delegators = await this.userModel
        .find({
          $or: [
            { fullName: { $regex: keyword || '', $options: 'i' } },
            { email: { $regex: keyword || '', $options: 'i' } },
            { username: { $regex: keyword || '', $options: 'i' } },
          ],
        })
        .lean();
      const delegatorIds = delegators.map((d) => d._id);
      //search theo delegate
      const delegates = await this.userModel
        .find({
          $or: [
            { fullName: { $regex: keyword || '', $options: 'i' } },
            { email: { $regex: keyword || '', $options: 'i' } },
            { username: { $regex: keyword || '', $options: 'i' } },
          ],
        })
        .lean();
      const delegateIds = delegates.map((d) => d._id);

      //tìm kiếm trong delegation
      const delegations = await this.delegationModel
        .find({
          $or: [
            { delegateReason: { $regex: keyword || '', $options: 'i' } },
            { status: { $regex: keyword || '', $options: 'i' } },
          ],
        })
        .lean();
      const delegationIds = delegations.map((d) => d._id);

      const OR: any[] = [];

      if (electionIds.length) OR.push({ electionId: { $in: electionIds } });

      if (delegatorIds.length) OR.push({ delegatorId: { $in: delegatorIds } });

      if (delegateIds.length) OR.push({ delegateId: { $in: delegateIds } });

      if (delegationIds.length) OR.push({ _id: { $in: delegationIds } });
      const result = await this.delegationModel
        .find({ $or: OR })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      return paginate(result, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  async getSumaryDelagateApproveBySecretary(req: DelegationDto) {
    try {
      const electionData = await this.electionModel
        .findById(new Types.ObjectId(req.electionId))
        .exec();
      if (!electionData) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const { delegationStart, delegationEnd } = electionData;

      const delegations = await this.delegationModel
        .find({
          confirmedBy: new Types.ObjectId(req.secretaryId),
          electionId: new Types.ObjectId(req.electionId),
          status: STATUS.CONFIRMED,
          createdAt: { $gte: delegationStart, $lte: delegationEnd },
        })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async getSummaryDelegatesForChair(req: DelegationDto) {
    try {
      const pipeline: any[] = [
        {
          $lookup: {
            from: 'elections',
            localField: 'electionId',
            foreignField: '_id',
            as: 'election',
          },
        },
        { $unwind: '$election' },
        {
          $lookup: {
            from: 'electiondocuments',
            let: { eId: '$election._id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$electionId', '$$eId'] },
                },
              },
              {
                $match: {
                  type: FileType.DELEGATION_SUMMARY_SIGNED,
                },
              },
            ],
            as: 'documents',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'delegatorId',
            foreignField: '_id',
            as: 'delegator',
          },
        },
        { $unwind: '$delegator' },
        {
          $lookup: {
            from: 'users',
            localField: 'delegateId',
            foreignField: '_id',
            as: 'delegate',
          },
        },
        {
          $unwind: {
            path: '$delegate',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'confirmedBy',
            foreignField: '_id',
            as: 'confirmedBy',
          },
        },
        {
          $unwind: {
            path: '$confirmedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            ...(req.electionName?.trim()
              ? {
                'election.title': {
                  $regex: req.electionName,
                  $options: 'i',
                },
              }
              : {}),
          },
        },
        {
          $addFields: {
            statusData: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [{ $ne: ['$confirmedBy', null] }, { $eq: ['$status', 'SIGNED'] }],
                    },
                    then: 'SIGNED',
                  },
                  {
                    case: { $eq: ['$status', 'CONFIRMED'] },
                    then: 'CONFIRMED',
                  },
                  {
                    case: { $eq: ['$status', 'PENDING'] },
                    then: 'PENDING',
                  },
                  {
                    case: { $eq: ['$status', 'REJECT'] },
                    then: 'REJECT',
                  },
                ],
                default: 'PENDING',
              },
            },
          },
        },
        {
          $group: {
            _id: '$election._id',
            election: { $first: '$election' },
            documents: { $first: '$documents' },
            status: { $first: '$statusData' },
            delegations: {
              $push: {
                id: '$_id',
                delegateReason: '$delegateReason',
                timeDelegation: {
                  $floor: {
                    $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24],
                  },
                },
                delegator: {
                  fullName: '$delegator.fullName',
                  email: '$delegator.email',
                  position: '$delegator.position',
                  address: '$delegator.address',
                  citizenId: '$delegator.citizenId',
                  phone: '$delegator.phone',
                },
                delegate: {
                  fullName: { $ifNull: ['$delegate.fullName', '$delegateInfo.fullName'] },
                  email: { $ifNull: ['$delegate.email', '$delegateInfo.email'] },
                  position: { $ifNull: ['$delegate.position', ''] },
                  address: { $ifNull: ['$delegate.address', '$delegateInfo.address'] },
                  citizenId: { $ifNull: ['$delegate.citizenId', '$delegateInfo.citizenId'] },
                  phone: { $ifNull: ['$delegate.phone', '$delegateInfo.phone'] },
                },

                createdAt: '$createdAt',
              },
            },
          },
        },
        {
          $match: {
            ...(req.status && req.status.trim().toUpperCase() !== 'ALL'
              ? { status: req.status.trim().toUpperCase() }
              : {}),
          },
        },

        { $sort: { 'election.startDate': 1 } },
      ];

      return await this.delegationModel.aggregate(pipeline);
    } catch (error) {
      throw error;
    }
  }

  async getSummaryDelegatesByElectionId(electionId: string) {
    try {
      const pipeline: any[] = [
        {
          $match: { electionId: new Types.ObjectId(electionId) },
        },
        {
          $lookup: {
            from: 'elections',
            localField: 'electionId',
            foreignField: '_id',
            as: 'election',
          },
        },
        { $unwind: '$election' },
        {
          $lookup: {
            from: 'electiondocuments',
            let: { eId: '$election._id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$electionId', '$$eId'] },
                },
              },
              {
                $match: {
                  type: FileType.DELEGATION_SUMMARY_SIGNED,
                },
              },
            ],
            as: 'documents',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'delegatorId',
            foreignField: '_id',
            as: 'delegator',
          },
        },
        { $unwind: '$delegator' },
        {
          $lookup: {
            from: 'users',
            localField: 'delegateId',
            foreignField: '_id',
            as: 'delegate',
          },
        },
        {
          $unwind: {
            path: '$delegate',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'confirmedBy',
            foreignField: '_id',
            as: 'confirmedBy',
          },
        },
        {
          $unwind: {
            path: '$confirmedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            statusData: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [{ $ne: ['$confirmedBy', null] }, { $eq: ['$status', 'SIGNED'] }],
                    },
                    then: 'SIGNED',
                  },
                  {
                    case: { $eq: ['$status', 'CONFIRMED'] },
                    then: 'CONFIRMED',
                  },
                  {
                    case: { $eq: ['$status', 'PENDING'] },
                    then: 'PENDING',
                  },
                  {
                    case: { $eq: ['$status', 'REJECT'] },
                    then: 'REJECT',
                  },
                ],
                default: 'PENDING',
              },
            },
          },
        },
        {
          $group: {
            _id: '$election._id',
            election: { $first: '$election' },
            documents: { $first: '$documents' },
            status: { $first: '$statusData' },
            delegations: {
              $push: {
                id: '$_id',
                delegateReason: '$delegateReason',
                status: '$status',
                delegationType: '$delegationType',
                timeDelegation: {
                  $floor: {
                    $divide: [{ $subtract: ['$endDate', '$startDate'] }, 1000 * 60 * 60 * 24],
                  },
                },
                delegator: {
                  fullName: '$delegator.fullName',
                  email: '$delegator.email',
                  position: '$delegator.position',
                  address: '$delegator.address',
                  citizenId: '$delegator.citizenId',
                  phone: '$delegator.phone',
                },
                delegate: {
                  fullName: { $ifNull: ['$delegate.fullName', '$delegateInfo.fullName'] },
                  email: { $ifNull: ['$delegate.email', '$delegateInfo.email'] },
                  position: { $ifNull: ['$delegate.position', ''] },
                  address: { $ifNull: ['$delegate.address', '$delegateInfo.address'] },
                  citizenId: { $ifNull: ['$delegate.citizenId', '$delegateInfo.citizenId'] },
                  phone: { $ifNull: ['$delegate.phone', '$delegateInfo.phone'] },
                },

                createdAt: '$createdAt',
              },
            },
          },
        },

        { $sort: { 'election.startDate': 1 } },
      ];

      return await this.delegationModel.aggregate(pipeline);
    } catch (error) {
      throw error;
    }
  }

  async generateDelegationPdf(
    secretaryId: string,
    recipient: string,
    electionId: string,
  ): Promise<Buffer> {
    const delegations = await this.delegationModel.find({
      confirmedBy: null,
      status: STATUS.PENDING,
      electionId: new Types.ObjectId(electionId),
    });
    const delegationsGrouped = await this.delegationModel.aggregate([
      {
        $match: {
          confirmedBy: null,
          status: STATUS.CONFIRMED,
          electionId: new Types.ObjectId(electionId),
        },
      },
      {
        $lookup: {
          from: 'elections',
          localField: 'electionId',
          foreignField: '_id',
          as: 'election',
        },
      },
      { $unwind: '$election' },
      {
        $lookup: { from: 'users', localField: 'delegatorId', foreignField: '_id', as: 'delegator' },
      },
      { $unwind: '$delegator' },
      {
        $lookup: { from: 'users', localField: 'delegateId', foreignField: '_id', as: 'delegate' },
      },
      { $unwind: '$delegate' },
      {
        $lookup: {
          from: 'users',
          localField: 'confirmedBy',
          foreignField: '_id',
          as: 'confirmedBy',
        },
      },
      {
        $unwind: {
          path: '$confirmedBy',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$election._id',
          election: { $first: '$election' },
          delegations: {
            $push: {
              delegator: '$delegator',
              delegate: '$delegate',
              createdAt: '$createdAt',
            },
          },
        },
      },
      { $sort: { 'election.startDate': 1 } },
    ]);

    // Cấu hình font
    const fonts = {
      Roboto: {
        normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
      },
    };
    const printer = new PdfPrinter(fonts);

    const currentDate = getCurrentDateVN();
    const formattedDate = currentDate.toLocaleDateString('vi-VN');

    // Tạo số công văn
    const reportNumber = `Số: ${currentDate.getFullYear()}/TH-BCUQ`;

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'portrait', // hoặc 'landscape' nếu bảng rộng
      pageMargins: [40, 60, 40, 60],
      content: [
        // Header hai cột
        {
          columns: [
            {
              stack: [
                {
                  text: 'CÔNG TY ABC',
                  bold: true,
                  fontSize: 12,
                  margin: [0, 5, 0, 0],
                  alignment: 'center',
                },
                { text: reportNumber, fontSize: 10, margin: [0, 5, 0, 0], alignment: 'center' },
              ],
              width: '50%',
            },
            {
              stack: [
                {
                  text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                  bold: true,
                  fontSize: 12,
                  alignment: 'center', // <-- center text trong cột
                  margin: [0, 5, 0, 0],
                },
                {
                  text: 'ĐỘC LẬP - TỰ DO - HẠNH PHÚC',
                  bold: true,
                  fontSize: 12,
                  alignment: 'center', // <-- center text trong cột
                  margin: [0, 5, 0, 0],
                },
              ],
              width: '50%',
            },
          ],
          columnGap: 10,
          margin: [0, 0, 0, 20],
        },

        // Tiêu đề báo cáo viết hoa, xuống dòng
        {
          stack: [
            {
              text: 'BÁO CÁO',
              bold: true,
              fontSize: 16,
              alignment: 'center',
              margin: [0, 0, 0, 2],
            },
            {
              text: 'TỔNG HỢP ỦY QUYỀN ĐÃ TIẾP NHẬN',
              bold: true,
              fontSize: 16,
              alignment: 'center',
            },
          ],
          margin: [0, 0, 0, 20],
        },
        { text: `Kính gửi: ${recipient}`, margin: [0, 0, 0, 5] },
        { text: `Người gửi: Thư ký (ID: ${secretaryId})`, margin: [0, 0, 0, 5] },
        { text: `Ngày lập báo cáo: ${formattedDate}`, margin: [0, 0, 0, 20] },
      ],
      footer: (currentPage, pageCount) => ({
        columns: [
          { text: '' },
          { text: `Trang ${currentPage} / ${pageCount}`, alignment: 'center' },
        ],
      }),
    };

    // Table dữ liệu chi tiết giống code trước, table border full
    // Table dữ liệu theo election
    delegationsGrouped.forEach((group) => {
      const body: any[] = [];

      // Header chính
      body.push([
        { text: 'STT', style: 'tableHeader', alignment: 'center', bold: true },
        { text: 'Người ủy quyền', style: 'tableHeader', alignment: 'center', bold: true },
        { text: 'Người được ủy quyền', style: 'tableHeader', alignment: 'center', bold: true },
        { text: 'Ngày tạo', style: 'tableHeader', alignment: 'center', bold: true },
      ]);

      // Data
      group.delegations.forEach((d, index) => {
        body.push([
          index + 1,
          d.delegator.fullName,
          d.delegate.fullName,
          new Date(d.createdAt).toLocaleDateString('vi-VN'),
        ]);
      });

      docDefinition.content.push(
        { text: `Cuộc bầu cử: ${group.election.title}`, bold: true, margin: [0, 10, 0, 5] },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto'], // 4 cột tổng cộng
            body,
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => 'black',
            vLineColor: () => 'black',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 2,
            paddingBottom: () => 2,
          },
          margin: [0, 0, 0, 10],
        },
      );
    });

    // Chân ký Chủ tọa
    docDefinition.content.push({
      columns: [
        { text: '' },
        {
          text: `CHỦ TỌA`,
          alignment: 'center',
          margin: [0, 50, 0, 0],
        },
      ],
    });

    // Tạo PDF
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const chunks: Uint8Array[] = [];
    return new Promise((resolve, reject) => {
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
  }

  async getSummaryDelegateByElectionId(electionId: string, delegationsIds: string[]) {
    try {
      const delegationsGrouped = await this.delegationModel.aggregate([
        {
          $match: {
            confirmedBy: null,
            status: STATUS.CONFIRMED,
            electionId: new Types.ObjectId(electionId),
            _id: { $in: delegationsIds.map(id => new Types.ObjectId(id)) }
          },
        },
        {
          $lookup: {
            from: 'elections',
            localField: 'electionId',
            foreignField: '_id',
            as: 'election',
          },
        },
        { $unwind: '$election' },
        {
          $lookup: {
            from: 'users',
            localField: 'delegatorId',
            foreignField: '_id',
            as: 'delegator',
          },
        },
        { $unwind: '$delegator' },
        {
          $lookup: { from: 'users', localField: 'delegateId', foreignField: '_id', as: 'delegate' },
        },
        {
          $unwind: {
            path: '$delegate',
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //   $lookup: {
        //     from: 'users',
        //     localField: 'confirmedBy',
        //     foreignField: '_id',
        //     as: 'confirmedBy',
        //   },
        // },
        // { $unwind: '$confirmedBy' },
        {
          $group: {
            _id: '$election._id',
            election: { $first: '$election' },
            delegations: {
              $push: {
                delegator: '$delegator',
                delegate: { $ifNull: ['$delegate', '$delegateInfo'] },
                delegationType: '$delegationType',
                createdAt: '$createdAt',
              },
            },
          },
        },
        { $sort: { 'election.startDate': 1 } },
      ]);

      return delegationsGrouped;
    } catch (error) {
      throw error;
    }
  }

  async rejectDelegation(
    delegationIds: { id: string; rejectReason: string }[],
    electionId: string,
  ) {
    try {
      const idDelegationMap = delegationIds.map((d) => d.id);

      const delegations = await this.delegationModel
        .find({
          _id: { $in: idDelegationMap },
          electionId: new Types.ObjectId(electionId),
        })
        .exec();

      if (delegations.length === 0) {
        throw new NotFoundException('Không tìm thấy dữ liệu ủy quyền!');
      }

      const reasonMap = new Map(delegationIds.map((d) => [d.id, d.rejectReason]));

      for (const d of delegations) {
        if (d.status !== STATUS.CONFIRMED) {
          throw new Error(`Trạng thái không thể từ chối!`);
        }

        d.status = STATUS.REJECTED;

        const rejectReason = reasonMap.get(String(d._id)) || '';

        await this.notificationService.notifyUser(
          String(d.delegatorId),
          `Yêu cầu ủy quyền của bạn đã bị từ chối bởi chủ tọa. Lý do: ${rejectReason}`,
        );

        await d.save();
      }

      return delegations;
    } catch (error) {
      throw error;
    }
  }

  async approvedAndSign(
    p12File: Express.Multer.File,
    userId: string,
    electionId: string,
    password: string,
    delegationIds: string[],
  ) {
    try {
      const election = await this.electionModel.findById(new Types.ObjectId(electionId)).exec();
      if (!election) {
        throw new NotFoundException('Không tìm thấy cuộc bầu cử!');
      }
      if (election.delegationEnd > getCurrentDateVN()) {
        throw new Error('Bạn chỉ có thể kí khi thời hạn ủy quyền kết thúc!');
      }
      const dataSummaryElection = await this.getSummaryDelegateByElectionId(
        electionId,
        delegationIds,
      );
      if (dataSummaryElection.length === 0) {
        throw new NotFoundException('Không tìm thấy dữ liệu tổng hợp!');
      }
      const pdfFile = await this.generateFilePdf(dataSummaryElection, 'Chủ tọa');
      const signFile = await this.signatureService.signPdfWithP12(
        pdfFile,
        p12File.buffer,
        password,
      );
      if (signFile) {
        const delegation = await this.delegationModel
          .find({
            _id: { $in: delegationIds },
            electionId: new Types.ObjectId(electionId)
          })
          .exec();

        if (delegation.length > 0) {
          const role = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER }).exec();
          if (!role) {
            throw new NotFoundException('Không tìm thấy role Voter trong hệ thống!');
          }

          // Lấy meetingId từ electionId
          const meeting = await this.meetingsModel
            .findOne({ electionId: new Types.ObjectId(electionId) })
            .exec();

          for (const delegationItem of delegation) {
            await this.delegationModel.updateOne(
              { _id: delegationItem._id },
              { $set: { status: STATUS.SIGNED, confirmedBy: new Types.ObjectId(userId) } },
            );

            const voterDelegator = await this.voterModel
              .findOne({
                electionId: new Types.ObjectId(electionId),
                userId: delegationItem.delegatorId,
              })
              .exec();
            if (voterDelegator) {
              voterDelegator.status = STATUS.INACTIVE;
              await voterDelegator.save();
            }

            const votingRight = await this.votingRightModel
              .findOne({
                electionId: new Types.ObjectId(electionId),
                voterId: voterDelegator?._id,
              })
              .exec();

            if (delegationItem.delegateId) {
              const voter = new this.voterModel({
                electionId: new Types.ObjectId(electionId),
                userId: delegationItem.delegateId,
                eligible: false,
                status: STATUS.AUTHORIZED,
              });
              await voter.save();
              if (votingRight) {
                votingRight.voterId = voter._id as Types.ObjectId;
                await votingRight.save();
              }
              const electionParticipantVoter = new this.electionParticipantsModel({
                electionId: new Types.ObjectId(electionId),
                userId: delegationItem.delegateId,
                roleId: role._id,
                status: STATUS.ACTIVE,
              });
              await electionParticipantVoter.save();

              // Tạo thẻ đại biểu cho delegate
              try {
                await this.delegateCardsService.create(
                  {
                    electionId: electionId,
                    voterId: (voter._id as Types.ObjectId).toString(),
                    delegationId: (delegationItem._id as Types.ObjectId).toString(),
                    status: STATUS.ACTIVE,
                  },
                  userId
                );
              } catch (error) {
                console.error('Error creating delegate card for delegate:', error);
              }

              // Cập nhật meetingAttendee: xóa delegator, thêm delegate
              if (meeting) {
                try {
                  // Tìm participantId của delegator
                  const delegatorParticipant = await this.electionParticipantsModel
                    .findOne({
                      electionId: new Types.ObjectId(electionId),
                      userId: delegationItem.delegatorId,
                    })
                    .exec();

                  // Tìm và xóa meetingAttendee của delegator
                  if (delegatorParticipant) {
                    await this.meetingAttendeesModel.deleteMany({
                      meetingId: meeting._id,
                      participantId: delegatorParticipant._id,
                    }).exec();
                  }

                  // Thêm meetingAttendee cho delegate
                  const newMeetingAttendee = new this.meetingAttendeesModel({
                    meetingId: meeting._id,
                    participantId: electionParticipantVoter._id,
                    checkInTime: getCurrentDateVN(),
                    attended: false,
                    createdBy: new Types.ObjectId(userId),
                    updatedBy: new Types.ObjectId(userId),
                  });
                  await newMeetingAttendee.save();
                } catch (error) {
                  console.error('Error updating meetingAttendee:', error);
                }
              }
            } else {
              let userDto = {
                fullName: delegationItem.delegateInfo?.fullName,
                email: delegationItem.delegateInfo?.email,
                phone: delegationItem.delegateInfo?.phone,
                citizenId: delegationItem.delegateInfo?.citizenId,
                address: delegationItem.delegateInfo?.address,
              } as UserDto;
              const user = await this.usersService.createByInfoDelegate(userDto);
              const voter = new this.voterModel({
                electionId: new Types.ObjectId(electionId),
                userId: user._id,
                eligible: false,
                status: STATUS.AUTHORIZED,
              });
              await voter.save();
              if (votingRight) {
                votingRight.voterId = voter._id as Types.ObjectId;
                await votingRight.save();
              }
              const electionParticipantVoter = new this.electionParticipantsModel({
                electionId: new Types.ObjectId(electionId),
                userId: user._id,
                roleId: role._id,
                status: STATUS.ACTIVE,
              });
              await electionParticipantVoter.save();
              await this.delegationModel.updateOne(
                { _id: delegationItem._id },
                { $set: { delegateId: user._id, delegateInfo: null } },
              );

              // Tạo thẻ đại biểu cho delegate
              try {
                await this.delegateCardsService.create(
                  {
                    electionId: electionId,
                    voterId: (voter._id as Types.ObjectId).toString(),
                    delegationId: (delegationItem._id as Types.ObjectId).toString(),
                    status: STATUS.ACTIVE,
                  },
                  userId
                );
              } catch (error) {
                console.error('Error creating delegate card for delegate:', error);
              }

              // Cập nhật meetingAttendee: xóa delegator, thêm delegate
              if (meeting) {
                try {
                  // Tìm participantId của delegator
                  const delegatorParticipant = await this.electionParticipantsModel
                    .findOne({
                      electionId: new Types.ObjectId(electionId),
                      userId: delegationItem.delegatorId,
                    })
                    .exec();

                  // Tìm và xóa meetingAttendee của delegator
                  if (delegatorParticipant) {
                    await this.meetingAttendeesModel.deleteMany({
                      meetingId: meeting._id,
                      participantId: delegatorParticipant._id,
                    }).exec();
                  }

                  // Thêm meetingAttendee cho delegate
                  const newMeetingAttendee = new this.meetingAttendeesModel({
                    meetingId: meeting._id,
                    participantId: electionParticipantVoter._id,
                    checkInTime: getCurrentDateVN(),
                    attended: false,
                    createdBy: new Types.ObjectId(userId),
                    updatedBy: new Types.ObjectId(userId),
                  });
                  await newMeetingAttendee.save();
                } catch (error) {
                  console.error('Error updating meetingAttendee:', error);
                }
              }
            }

            const electionParticipant = await this.electionParticipantsModel
              .findOne({
                electionId: new Types.ObjectId(electionId),
                userId: delegationItem.delegatorId,
              })
              .exec();
            if (electionParticipant) {
              electionParticipant.status = STATUS.INACTIVE;
              await electionParticipant.save();
            }

            // Tìm và set inactive thẻ đại biểu của delegator
            try {
              const delegatorVoter = await this.voterModel
                .findOne({
                  electionId: new Types.ObjectId(electionId),
                  userId: delegationItem.delegatorId,
                })
                .exec();

              if (delegatorVoter) {
                const delegatorDelegateCard = await this.delegateCardsService.getByVoterId(
                  (delegatorVoter._id as Types.ObjectId).toString()
                );

                if (delegatorDelegateCard && Array.isArray(delegatorDelegateCard) && delegatorDelegateCard.length > 0) {
                  // Tìm thẻ đại biểu của delegator trong cuộc bầu cử này
                  const cardToUpdate = delegatorDelegateCard.find(
                    (card: any) => card.electionId?._id?.toString() === electionId
                  );

                  if (cardToUpdate) {
                    // Cập nhật trạng thái thành inactive
                    await this.delegateCardModel.updateOne(
                      { _id: new Types.ObjectId((cardToUpdate._id as Types.ObjectId).toString()) },
                      {
                        $set: {
                          status: STATUS.INACTIVE,
                          updatedBy: new Types.ObjectId(userId),
                          updatedAt: getCurrentDateVN()
                        }
                      }
                    ).exec();
                  }
                }
              }
            } catch (error) {
              console.error('Error updating delegator delegate card status:', error);
            }

            await this.notificationService.notifyUser(
              delegationItem.delegatorId.toString(),
              'Tài liệu ủy quyền của bạn đã được kí duyệt !!!',
            );
          }
        }
        const fileUpload = await this.fileService.uploadSignedPdf(
          FileType.DELEGATION_SUMMARY_SIGNED,
          userId,
          signFile,
        );
        const electionParticipant = await this.electionParticipantsModel
          .findOne({
            electionId: new Types.ObjectId(electionId),
            userId: new Types.ObjectId(userId),
          })
          .exec();
        if (fileUpload) {
          const electionDocumentDelete = await this.documentModel.findOne({
            electionId: new Types.ObjectId(electionId),
            type: FileType.DELEGATION_SUMMARY_SIGNED,
          });
          if (electionDocumentDelete) {
            await this.documentModel.deleteOne({ _id: electionDocumentDelete._id }).exec();
          }
          const electionDocument = new this.documentModel({
            electionId: new Types.ObjectId(electionId),
            preparedBy: electionParticipant?.id || null,
            title: 'Kí file',
            type: FileType.DELEGATION_SUMMARY_SIGNED,
            fileUrl: fileUpload.key,
            createdBy: new Types.ObjectId(userId),
            createdAt: getCurrentDateVN(),
          });
          await electionDocument.save();
        }
        return fileUpload;
      } else {
        throw new NotFoundException('Kí file không thành công!');
      }
    } catch (error) {
      throw error;
    }
  }

  async generateFilePdf(delegationsGrouped: any, recipient: string) {
    try {
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
        },
      };
      const printer = new PdfPrinter(fonts);

      const currentDate = getCurrentDateVN();
      const formattedDate = currentDate.toLocaleDateString('vi-VN');

      // Tạo số công văn
      const reportNumber = `Số: ${currentDate.getFullYear()}/TH-BCUQ`;

      const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait', // hoặc 'landscape' nếu bảng rộng
        pageMargins: [40, 60, 40, 60],
        content: [
          // Header hai cột
          {
            columns: [
              {
                stack: [
                  {
                    text: 'CÔNG TY ABC',
                    bold: true,
                    fontSize: 12,
                    margin: [0, 5, 0, 0],
                    alignment: 'center',
                  },
                  { text: reportNumber, fontSize: 10, margin: [0, 5, 0, 0], alignment: 'center' },
                ],
                width: '50%',
              },
              {
                stack: [
                  {
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    bold: true,
                    fontSize: 12,
                    alignment: 'center', // <-- center text trong cột
                    margin: [0, 5, 0, 0],
                  },
                  {
                    text: 'ĐỘC LẬP - TỰ DO - HẠNH PHÚC',
                    bold: true,
                    fontSize: 12,
                    alignment: 'center', // <-- center text trong cột
                    margin: [0, 5, 0, 0],
                  },
                ],
                width: '50%',
              },
            ],
            columnGap: 10,
            margin: [0, 0, 0, 20],
          },

          // Tiêu đề báo cáo viết hoa, xuống dòng
          {
            stack: [
              {
                text: 'BÁO CÁO',
                bold: true,
                fontSize: 16,
                alignment: 'center',
                margin: [0, 0, 0, 2],
              },
              {
                text: 'TỔNG HỢP ỦY QUYỀN ĐÃ TIẾP NHẬN',
                bold: true,
                fontSize: 16,
                alignment: 'center',
              },
            ],
            margin: [0, 0, 0, 20],
          },
          { text: `Kính gửi: ${recipient}`, margin: [0, 0, 0, 5] },
          { text: `Người gửi: Thư ký`, margin: [0, 0, 0, 5] },
          { text: `Ngày lập báo cáo: ${formattedDate}`, margin: [0, 0, 0, 20] },
        ],
        footer: (currentPage, pageCount) => ({
          columns: [
            { text: '' },
            { text: `Trang ${currentPage} / ${pageCount}`, alignment: 'center' },
          ],
        }),
      };

      // Table dữ liệu chi tiết giống code trước, table border full
      // Table dữ liệu theo election
      delegationsGrouped.forEach((group) => {
        const body: any[] = [];

        // Header chính
        body.push([
          { text: 'STT', style: 'tableHeader', alignment: 'center', bold: true },
          { text: 'Người ủy quyền', style: 'tableHeader', alignment: 'center', bold: true },
          { text: 'Người được ủy quyền', style: 'tableHeader', alignment: 'center', bold: true },
          { text: 'Ngày tạo', style: 'tableHeader', alignment: 'center', bold: true },
        ]);

        // Data
        group.delegations.forEach((d, index) => {
          body.push([
            index + 1,
            d.delegator.fullName,
            d.delegate.fullName,
            new Date(d.createdAt).toLocaleDateString('vi-VN'),
          ]);
        });

        docDefinition.content.push(
          { text: `Cuộc bầu cử: ${group.election.title}`, bold: true, margin: [0, 10, 0, 5] },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', '*', 'auto'], // 4 cột tổng cộng
              body,
            },
            layout: {
              hLineWidth: () => 1,
              vLineWidth: () => 1,
              hLineColor: () => 'black',
              vLineColor: () => 'black',
              paddingLeft: () => 4,
              paddingRight: () => 4,
              paddingTop: () => 2,
              paddingBottom: () => 2,
            },
            margin: [0, 0, 0, 10],
          },
        );
      });

      // Chân ký Chủ tọa
      docDefinition.content.push({
        columns: [
          { text: '' },
          {
            text: `CHỦ TỌA`,
            alignment: 'center',
            margin: [0, 50, 0, 0],
          },
        ],
      });

      // Tạo PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: any[] = [];
      return await new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err) => reject(err));
        pdfDoc.end();
      });
    } catch (error) {
      throw error;
    }
  }

  async approveBySecretary(delegationId: string, status: string, rejectReason?: string) {
    try {
      const delegation = await this.delegationModel
        .findById(new Types.ObjectId(delegationId))
        .exec();
      if (!delegation) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }
      if (delegation.status !== STATUS.PENDING) {
        throw new Error(MESSAGE.DELEGATION_NOT_PENDING);
      }
      if (status === STATUS.REJECTED) {
        delegation.status = STATUS.REJECTED;
        delegation.rejectReasonBySecretary = rejectReason || '';
      } else {
        delegation.status = STATUS.CONFIRMED;
        delegation.confirmedAt = getCurrentDateVN();
      }
      return delegation.save();
    } catch (error) {
      throw error;
    }
  }

  async signByDelegator(delegationId: string, p12File: Express.Multer.File, password: string) {
    try {
      const delegation = await this.delegationModel
        .findById(new Types.ObjectId(delegationId))
        .populate('delegatorId')
        .populate('delegateId')
        .exec();
      if (!delegation) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }

      if (delegation.status !== STATUS.DRAFT) {
        throw new Error('Không thể kí ở trạng thái hiện tại!');
      }
      let delegator = delegation?.delegatorId as any;
      let delegate = delegation?.delegateId as any;
      let delegateInfo = delegation?.delegateInfo as any;
      const thoiHanNgay =
        (delegation.endDate.getTime() - delegation.startDate.getTime()) / (1000 * 60 * 60 * 24);

      let dataBinding = {
        hoTen: delegator.fullName || '',
        chucVu: delegator.position || '',
        phone: delegator.phone || '',
        cmnd: delegator.citizenId || '',
        diaChiA: delegator.address || '',
        uyQuyenCho: delegate ? delegate.fullName : delegateInfo.fullName,
        phone2: delegate ? delegate.phone : delegateInfo.phone,
        cmnd2: delegate ? delegate.citizenId : delegateInfo.citizenId,
        diaChiB: delegate ? delegate.address : delegateInfo.address,
        phamViUyQuyen:
          'Được thay mặt tôi tiến hành toàn bộ các thủ tục liên quan đến việc tham dự, thực hiện quyền bầu cử, bỏ phiếu, ký nhận và thực hiện các công việc cần thiết khác theo đúng quy định pháp luật hiện hành và theo quy chế của cuộc bầu cử.',
        thoiHan: `${thoiHanNgay} ngày, tính từ ngày ${formatDateDMYVN(
          delegation.startDate,
        )} đến ngày ${formatDateDMYVN(delegation.endDate)}`,
      };
      const pdfFile = await this.generateUyQuyenPdf(dataBinding);
      const signFile = await this.signatureService.signPdfWithP12(
        pdfFile,
        p12File.buffer,
        password,
      );
      console.log('run3');

      console.log(signFile);
      if (signFile) {
        const fileUpload = await this.fileService.uploadSignedPdf(
          FileType.DELEGATION_DELEGATOR_SIGNED,
          String(delegator._id),
          signFile,
        );

        const electionDocument = new this.documentModel({
          electionId: new Types.ObjectId(delegation.electionId),
          preparedBy: delegator?._id || null,
          title: 'Kí file',
          type: FileType.DELEGATION_DELEGATOR_SIGNED,
          fileUrl: fileUpload.key,
          createdBy: new Types.ObjectId(delegator?._id),
          createdAt: getCurrentDateVN(),
        });
        await electionDocument.save();
        delegation.documentId = electionDocument.id;
        delegation.status = STATUS.PENDING;
        await delegation.save();
        return delegation;
      } else {
        throw new Error('Kí file không thành công');
      }
    } catch (error) {
      throw error;
    }
  }

  async generateUyQuyenPdf(data: any) {
    try {
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
        },
      };
      const printer = new PdfPrinter(fonts);

      const currentDate = getCurrentDateVN();
      const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1
        }/${currentDate.getFullYear()}`;

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],

        content: [
          // ======= HEADER ========
          {
            stack: [
              {
                text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                bold: true,
                alignment: 'center',
                fontSize: 12,
              },
              {
                text: 'Độc lập - Tự do - Hạnh phúc',
                alignment: 'center',
                fontSize: 11,
                margin: [0, 2, 0, 2],
              },
              { text: '-----------------------------', alignment: 'center', margin: [0, 0, 0, 20] },
            ],
          },

          // ======= TITLE ========
          {
            text: 'GIẤY ỦY QUYỀN',
            alignment: 'center',
            bold: true,
            fontSize: 15,
            margin: [0, 0, 0, 20],
          },

          // ======= FORM CONTENT ========
          {
            text: `Tôi là: ${data.hoTen || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Chức vụ: ${data.chucVu || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Số điện thoại: ${data.phone || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `CMND/CCCD số: ${data.cmnd || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Địa chỉ: ${data.diaChiA || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Ủy quyền cho ông/bà: ${data.uyQuyenCho || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Số điện thoại: ${data.phone2 || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `CMND/CCCD số: ${data.cmnd2 || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Địa chỉ tại: ${data.diaChiB || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },
          {
            text: `Phạm vi ủy quyền: ${data.phamViUyQuyen || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },

          {
            text: `Thời hạn ủy quyền: ${data.thoiHan || '...........................................................'
              }`,
            margin: [0, 0, 0, 10],
          },

          {
            text: 'Vì vậy, .................................................................................................................................',
            margin: [0, 10, 0, 20],
          },

          // ======= FOOTER SIGN ========
          {
            columns: [
              { width: '*', text: '' },
              {
                stack: [
                  {
                    text: `......., ngày .... tháng .... năm ${currentDate.getFullYear()}`,
                    alignment: 'center',
                  },
                  {
                    text: 'Người ủy quyền',
                    alignment: 'center',
                    bold: true,
                    margin: [0, 20, 0, 60],
                  },
                  { text: '(Ký tên, đóng dấu)', alignment: 'center' },
                ],
                width: 200,
              },
            ],
            margin: [0, 40, 0, 0],
          },
        ],
      };

      // Xuất PDF
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: any[] = [];
      return await new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err) => reject(err));
        pdfDoc.end();
      });
    } catch (err) {
      throw err;
    }
  }

  //Lấy danh sách người được ủy quyền theo electionId
  async getDelegateNotAsParticipants(electionId: string) {
    try {
      //Kiểm tra electionId có tồn tại không
      const electionExist = await this.electionModel.findById(
        new Types.ObjectId(electionId),
      ).exec();
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      //Lấy danh sách người được ủy quyền không phải là voter, admin, preside và không phải là người tham gia cuộc bầu cử
      //Lấy danh sách voter
      const voters = await this.voterModel.find({
        electionId: new Types.ObjectId(electionId),
      }).exec();
      const voterUserIds = voters.map((v) => v.userId.toString());

      //Lấy danh sách người tham gia cuộc bầu cử
      const electionParticipants = await this.electionParticipantsModel.find({
        electionId: new Types.ObjectId(electionId),
      }).exec();
      const participantUserIds = electionParticipants.map((ep) => ep.userId.toString());
      //Lấy danh sách admin và preside
      const sepcialRoles = await this.rolesModel.find({ roleCode: { $in: [USER_ROLE.ADMIN, USER_ROLE.PRESIDE] } }).exec();
      const sepcialRoleIds = sepcialRoles.map((role) => role._id);

      const users = await this.userModel.find({
        _id: { $nin: [...voterUserIds, ...participantUserIds], },
        roleId: { $nin: sepcialRoleIds },
      })
        .populate('roleId')
        .exec();


      return users;
    } catch (error) {
      throw error;
    }
  }

  private async validateElection(dto: CreateDelegationDto) {
    let electionExist: any;
    if (dto.delegationType == DELEGATION_TYPE.ELECTION) {
      electionExist = await this.electionModel.findById(new Types.ObjectId(dto.electionId));
      //Kiểm tra electionId có tồn tại không
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
    }
    return electionExist;
  }
  private async validateDelegateInfo(dto: CreateDelegationDto) {
    //Kiểm  tra delegateId và delegateInfo không được cùng tồn tại
    const { delegateInfo, delegateId } = dto;

    if (delegateInfo && delegateId) {
      throw new Error(MESSAGE.DELEGATE_INFO_CONFLICT);
    }

    if (!delegateInfo && !delegateId) {
      throw new Error('Bạn phải chọn user hoặc nhập thông tin người được ủy quyền');
    }

    //Kiểm tra thông tin user nếu người được ủy quyền chưa có tài khoản trong hệ thống
    if (delegateInfo && delegateId == null) {
      if (
        !delegateInfo.fullName ||
        !delegateInfo.email ||
        !delegateInfo.citizenId ||
        !delegateInfo.phone ||
        !delegateInfo.address
      ) {
        throw new Error(MESSAGE.DELEGATE_INFO_INCOMPLETE);
      }
      await this.validateCitizenId(delegateInfo.citizenId);
      await this.validatePhone(delegateInfo.phone);
      await this.validateEmail(delegateInfo.email);
    }
  }
  private async validateDelegator(dto: CreateDelegationDto) {
    //Kiêm tra delegatorId có tồn tại không
    const delegatorExist = await this.userModel.exists({
      _id: new Types.ObjectId(dto.delegatorId),
    });
    if (!delegatorExist) {
      throw new Error(MESSAGE.DELEGATOR_NOT_FOUND);
    }

    //Kiểm tra xem cử tri đã ủy quyền cho ai chưa trong cuộc bầu cử này chưa
    const delegatorAuthorized = await this.delegationModel.findOne({
      delegatorId: new Types.ObjectId(dto.delegatorId),
      electionId: new Types.ObjectId(dto.electionId),
      status: {
        $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CONFIRMED, STATUS.SIGNED, STATUS.DRAFT],
      },
    });
    if (delegatorAuthorized) {
      throw new Error(MESSAGE.DELEGATOR_ALREADY_AUTHORIZED);
    }
  }
  private async validateDelegate(dto: CreateDelegationDto) {
    if (!dto.delegateId) return;
    //Kiểm tra xem người được ủy quyền đã được ủy quyền trong cuộc bầu cử này chưa
    const delegateAuthorized = await this.delegationModel.findOne({
      delegateId: new Types.ObjectId(dto.delegateId),
      electionId: new Types.ObjectId(dto.electionId),
      status: {
        $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CONFIRMED, STATUS.SIGNED, STATUS.DRAFT],
      },
    });
    if (delegateAuthorized) {
      throw new Error(MESSAGE.DELEGATE_ALREADY_AUTHORIZED);
    }

    //Kiểm tra người được ủy quyền có đang có vai trò khác trong cuộc bầu cử này không
    const electionParticipant: any = await this.electionParticipantsModel
      .findOne({
        electionId: new Types.ObjectId(dto.electionId),
        userId: new Types.ObjectId(dto.delegateId),
      })
      .populate('roleId')
      .exec();
    if (electionParticipant) {
      throw new Error(
        `Người được ủy quyền đang có vai trò khác trong cuộc bầu cử này: ${electionParticipant.roleId.roleName}`,
      );
    }

    //Kiểm tra người được ủy quyền có đang là quản trị viên hoặc chủ tọa của hệ thống không
    const adminRole: any = await this.rolesModel.findOne({ roleCode: USER_ROLE.ADMIN });
    const preside: any = await this.rolesModel.findOne({ roleCode: USER_ROLE.PRESIDE });
    const delegateUser = await this.userModel.findById(new Types.ObjectId(dto.delegateId));
    if (!delegateUser) {
      throw new Error(MESSAGE.DELEGATE_NOT_FOUND);
    }
    if (
      delegateUser.roleId.toString() == adminRole?._id.toString() ||
      delegateUser.roleId.toString() == preside?._id.toString()
    ) {
      throw new Error(MESSAGE.DELEGATE_CANNOT_ADMIN_PRESIDE);
    }
    //Kiểm tra người ủy quyền và người được ủy tuyển có trùng userId không
    if (dto.delegatorId === dto.delegateId) {
      throw new Error(MESSAGE.DELEGATION_DELEGATOR_FAIL);
    }
  }

  private async validateDelegationTime(dto: CreateDelegationDto, election) {
    if (dto.delegationType !== DELEGATION_TYPE.LONG_TERM) return;

    if (!dto.startDate || !dto.endDate) {
      throw new Error(
        'Ngày bắt đầu/kết thúc ủy quyền không được để trống đối với ủy quyền dài hạn',
      );
    }

    if (new Date(dto.startDate) >= new Date(dto.endDate)) {
      throw new Error('Ngày bắt đầu ủy quyền phải trước ngày kết thúc ủy quyền');
    }
  }

  private async validateDocument(dto: CreateDelegationDto) {
    if (!dto.documentId) return;

    const exists = await this.documentModel.exists({ _id: new Types.ObjectId(dto.documentId) });
    if (!exists) throw new Error(MESSAGE.ELECTION_DOCUMENT_NOT_FOUND);
  }
  private async validateConfirmedBy(dto: CreateDelegationDto) {
    if (!dto.confirmedBy) return;

    const exists = await this.userModel.exists({ _id: new Types.ObjectId(dto.confirmedBy) });
    if (!exists) throw new Error(MESSAGE.USER_NOT_FOUND);
  }
  private async validateCitizenId(citizenId: string) {
    const exists = await this.userModel.exists({ citizenId: citizenId });
    if (exists) throw new Error("CMND/CCCD đã tồn tại trong hệ thống");
  }
  private async validatePhone(phone: string) {
    const exists = await this.userModel.exists({ phone: phone });
    if (exists) throw new Error("Số điện thoại đã tồn tại trong hệ thống");
  }
  private async validateEmail(email: string) {
    const exists = await this.userModel.exists({ email: email });
    if (exists) throw new Error("Email đã tồn tại trong hệ thống");
  }
}
