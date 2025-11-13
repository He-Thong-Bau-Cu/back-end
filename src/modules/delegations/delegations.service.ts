import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { STATUS } from 'src/common/enums/status.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { UsersService } from '../users/users.service';
import { DelegationDto } from './dto/delegation.dto';
import PdfPrinter from 'pdfmake';
import path from 'path';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { paginate } from 'src/common/dto/paignation';
import { validateStatusFormat } from 'src/common/utils/format';
import { SigningService } from '../signature/signature.service';
import { Voters, VotersDocument } from 'src/database/schemas/voters.schema';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import {
  ElectionsParticipants,
  ElectionsParticipantsDocument,
} from 'src/database/schemas/electionParticipants.schema';

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
    private readonly documentModel: Model<ElectionDocuments>,
    private readonly signatureService: SigningService,
    @InjectModel(Voters.name)
    private readonly voterModel: Model<VotersDocument>,
    private readonly fileService: MinioService,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipantsDocument>,
  ) {}
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
        .findOne({
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
        .findOne({ electionId: new Types.ObjectId(id) })
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
      //Check if the election is exist
      const electionExist = await this.electionModel.findById(
        new Types.ObjectId(createDelegation.electionId),
      );
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check delegator have already authorized or not
      const delegatorAuthorized = await this.delegationModel.findOne({
        delegatorId: new Types.ObjectId(createDelegation.delegatorId),
        electionId: new Types.ObjectId(createDelegation.electionId),
        status: { $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CONFIRMED] },
      });
      if (delegatorAuthorized) {
        throw new Error(MESSAGE.DELEGATOR_ALREADY_AUTHORIZED);
      }

      //Check delegate have adready been authorized or not
      if (createDelegation?.delegateId) {
        const delegateAuthorized = await this.delegationModel.findOne({
          delegateId: new Types.ObjectId(createDelegation.delegateId),
          electionId: new Types.ObjectId(createDelegation.electionId),
          status: { $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CONFIRMED] },
        });
        if (delegateAuthorized) {
          throw new Error(MESSAGE.DELEGATE_ALREADY_AUTHORIZED);
        }
      }
      //Check if the user is exist
      const delegatorExist = await this.userModel.exists({
        _id: new Types.ObjectId(createDelegation.delegatorId),
      });
      if (!delegatorExist) {
        throw new Error(MESSAGE.DELEGATOR_NOT_FOUND);
      }
      //Check if the user is exist
      if (createDelegation?.delegateId) {
        const delegateExist = await this.userModel.exists({
          _id: new Types.ObjectId(createDelegation.delegateId),
        });
        if (!delegateExist) {
          throw new Error(MESSAGE.DELEGATE_NOT_FOUND);
        }
        //Kiểm tra người ủy quyền và người được ủy tuyển có trùng userId không
        if (createDelegation.delegatorId === createDelegation.delegateId) {
          throw new Error(MESSAGE.DELEGATION_DELEGATOR_FAIL);
        }
      }
      //kiểm tra thời gian bắt đầu và kết thúc
      const startDate = new Date(createDelegation.startDate);
      const endDate = new Date(createDelegation.endDate);
      if (endDate <= startDate) {
        throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu');
      }
      if (startDate <= new Date()) {
        throw new Error('Ngày bắt đầu phải lớn hơn ngày hiện tại');
      }
      if (endDate < new Date()) {
        throw new Error(
          'Ngày kết thúc phải lớn hơn ngày hiện tại và không được trùng với ngày hiện tại',
        );
      }
      //Check delegation period is within election delegation period
      if (createDelegation.delegationType == ' ELECTION') {
        if (startDate < electionExist.delegationStart || endDate > electionExist.delegationEnd) {
          throw new Error(
            'Thời gian ủy quyền phải trong khoảng thời gian ủy quyền của cuộc bầu cử',
          );
        }
      }
      //Check if the document is exist
      if (createDelegation.documentId) {
        const documentExist = await this.documentModel.exists({
          _id: new Types.ObjectId(createDelegation.documentId),
        });
        if (!documentExist) {
          throw new Error(MESSAGE.ELECTION_DOCUMENT_NOT_FOUND);
        }
      }
      //Check if the confirmedBy is exist

      if (createDelegation.confirmedBy) {
        const confirmedByExist = await this.userModel.exists({ _id: createDelegation.confirmedBy });
        if (!confirmedByExist) {
          throw new Error(MESSAGE.USER_NOT_FOUND);
        }
      }
      //Create delegation
      const delegation = await this.delegationModel.create({
        ...createDelegation,
        electionId: new Types.ObjectId(createDelegation.electionId),
        delegatorId: new Types.ObjectId(createDelegation.delegatorId),
        delegateId: createDelegation?.delegateId
          ? new Types.ObjectId(createDelegation.delegateId)
          : null,
        documentId: createDelegation.documentId
          ? new Types.ObjectId(createDelegation.documentId)
          : null,
        confirmedBy: createDelegation?.confirmedBy
          ? new Types.ObjectId(createDelegation.confirmedBy)
          : null,
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
      const delegation = await this.delegationModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          {
            ...updateDelegation,
            electionId: updateDelegation.electionId
              ? new Types.ObjectId(updateDelegation.electionId)
              : null,
            delegatorId: updateDelegation.delegatorId
              ? new Types.ObjectId(updateDelegation.delegatorId)
              : null,
            delegateId: updateDelegation.delegateId
              ? new Types.ObjectId(updateDelegation.delegateId)
              : null,
            documentId: updateDelegation.documentId
              ? new Types.ObjectId(updateDelegation.documentId)
              : null,
            confirmedBy: updateDelegation.confirmedBy
              ? new Types.ObjectId(updateDelegation.confirmedBy)
              : null,
            updatedBy: new Types.ObjectId(userId) || null,
          },
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
      //search theo election
      const elections = await this.electionModel
        .find({
          title: { $regex: req.keyword || '', $options: 'i' },
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();

      const electionIds = elections.map((e) => e._id);

      //search theo delegator
      const delegators = await this.userModel
        .find({
          $or: [
            { fullName: { $regex: req.keyword || '', $options: 'i' } },
            { email: { $regex: req.keyword || '', $options: 'i' } },
            { username: { $regex: req.keyword || '', $options: 'i' } },
          ],
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();
      const delegatorIds = delegators.map((d) => d._id);
      //search theo delegate
      const delegates = await this.userModel
        .find({
          $or: [
            { fullName: { $regex: req.keyword || '', $options: 'i' } },
            { email: { $regex: req.keyword || '', $options: 'i' } },
            { username: { $regex: req.keyword || '', $options: 'i' } },
          ],
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();
      const delegateIds = delegates.map((d) => d._id);

      //tìm kiếm trong delegation
      const delegations = await this.delegationModel
        .find({
          $or: [
            { delegateReason: { $regex: req.keyword || '', $options: 'i' } },
            { status: { $regex: req.keyword || '', $options: 'i' } },
          ],
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();
      const delegationIds = delegations.map((d) => d._id);

      const query: any = {};
      if (electionIds.length > 0) {
        query.electionId = { $in: electionIds };
      }
      if (delegatorIds.length > 0) {
        query.delegatorId = { $in: delegatorIds };
      }
      if (delegateIds.length > 0) {
        query.delegateId = { $in: delegateIds };
      }
      if (delegationIds.length > 0) {
        query._id = { $in: delegationIds };
      }
      const result = await this.delegationModel
        .find(query)
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
      const delegationsGrouped = await this.delegationModel.aggregate([
        {
          $match: {
            // confirmedBy: null ,
            // status: 'PENDING',
            // electionId: new Types.ObjectId(req.electionId),
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
          $addFields: {
            statusData: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [{ $ne: ['$confirmedBy', null] }, { $eq: ['$status', 'CONFIRMED'] }],
                    },
                    then: 'SIGNED',
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
                },
                delegate: {
                  fullName: '$delegate.fullName',
                  email: '$delegate.email',
                  position: '$delegate.position',
                  address: '$delegate.address',
                  citizenId: '$delegate.citizenId',
                },
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
    console.log('delegations', delegations);
    const delegationsGrouped = await this.delegationModel.aggregate([
      {
        $match: {
          confirmedBy: null,
          status: STATUS.PENDING,
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

    const currentDate = new Date();
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

  async getSummaryDelegateByElectionId(electionId: string) {
    try {
      const delegationsGrouped = await this.delegationModel.aggregate([
        {
          $match: {
            confirmedBy: null,
            status: STATUS.PENDING,
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
        { $unwind: '$delegate' },
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
                delegate: '$delegate',
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

  async approvedAndSign(
    p12File: Express.Multer.File,
    userId: string,
    electionId: string,
    password: string,
  ) {
    try {
      const election = await this.electionModel.findById(new Types.ObjectId(electionId)).exec();
      if (!election) {
        throw new NotFoundException('Không tìm thấy cuộc bầu cử!');
      }
      if (election.delegationEnd < new Date()) {
        throw new Error('Bạn chỉ có thể kí khi thời hạn ủy quyền kết thúc!');
      }
      const dataSummaryElection = await this.getSummaryDelegateByElectionId(electionId);
      console.log(dataSummaryElection, 123);
      if (dataSummaryElection.length === 0) {
        throw new NotFoundException('Không tìm thấy dữ liệu tổng hợp!');
      }
      const pdfFile = await this.generateFilePdf(dataSummaryElection, 'Chủ tọa');
      const signFile = await this.signatureService.signPdfWithP12(
        pdfFile,
        p12File.buffer,
        password,
      );
      console.log(signFile);
      if (signFile) {
        const delegation = await this.delegationModel
          .find({ electionId: new Types.ObjectId(electionId) })
          .exec();

        if (delegation.length > 0) {
          for (const delegationItem of delegation) {
            await this.delegationModel.updateOne(
              { _id: delegationItem._id },
              { $set: { status: STATUS.CONFIRMED, confirmedBy: new Types.ObjectId(userId) } },
            );
            const voter = new this.voterModel({
              electionId: new Types.ObjectId(electionId),
              userId: delegationItem.delegateId,
              eligible: false,
              status: STATUS.AUTHORIZED,
            });
            await voter.save();
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
          }
        }
        const fileUpload = await this.fileService.uploadSignedPdf(
          FileType.DELEGATION_SUMMARY_SIGNED,
          userId,
          signFile,
        );
        console.log(fileUpload);
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
            await this.documentModel
              .deleteOne({ _id: electionDocumentDelete._id })
              .exec();
          }
          const electionDocument = new this.documentModel({
            electionId: new Types.ObjectId(electionId),
            preparedBy: electionParticipant?.id || null,
            title: 'Kí file',
            type: FileType.DELEGATION_SUMMARY_SIGNED,
            fileUrl: fileUpload.key,
            createdBy: new Types.ObjectId(userId),
            createdAt: new Date(),
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

      const currentDate = new Date();
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
}
