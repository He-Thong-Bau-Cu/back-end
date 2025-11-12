import { Injectable } from '@nestjs/common';
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
        .populate("createdBy", 'username fullName email position')
        .populate("updatedBy", 'username fullName email position')
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
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
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
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
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

  async getById(id: string) {
    try {
      console.log('id: ', id);
      const delegation = await this.delegationModel
        .findById(new Types.ObjectId(id))
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

  async getDeletaionsPending() {
    try {
      const delegation = await this.delegationModel
        .findOne({ status: 'pending' })
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
      const electionExist = await this.electionModel.exists({
        _id: new Types.ObjectId(createDelegation.electionId),
      });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check delegator have already authorized or not 
      const delegatorAuthorized = await this.delegationModel.findOne({
        delegatorId: new Types.ObjectId(createDelegation.delegatorId),
        electionId: new Types.ObjectId(createDelegation.electionId),
        status: { $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CONFIRMED] }
      });
      if (delegatorAuthorized) {
        throw new Error(MESSAGE.DELEGATOR_ALREADY_AUTHORIZED);
      }

      //Check delegate have adready been authorized or not
      const delegateAuthorized = await this.delegationModel.findOne({
        delegateId: new Types.ObjectId(createDelegation.delegateId),
        electionId: new Types.ObjectId(createDelegation.electionId),
        status: { $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CONFIRMED] }
      })
      if (delegateAuthorized) {
        throw new Error(MESSAGE.DELEGATE_ALREADY_AUTHORIZED);
      }
      //Check if the user is exist
      const delegatorExist = await this.userModel.exists({
        _id: new Types.ObjectId(createDelegation.delegatorId),
      });
      if (!delegatorExist) {
        throw new Error(MESSAGE.DELEGATOR_NOT_FOUND);
      }
      //Check if the user is exist
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

      //kiểm tra thời gian bắt đầu và kết thúc
      const startDate = new Date(createDelegation.startDate);
      const endDate = new Date(createDelegation.endDate);
      if (endDate <= startDate) {
        throw new Error('Ngày kết thúc phải lớn hơn ngày bắt đầu');
      }
      if (startDate < new Date()) {
        throw new Error('Ngày bắt đầu phải lớn hơn ngày hiện tại');
      }
      if (endDate <= new Date()) {
        throw new Error(
          'Ngày kết thúc phải lớn hơn ngày hiện tại và không được trùng với ngày hiện tại',
        );
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
        delegateId: new Types.ObjectId(createDelegation.delegateId),
        documentId: createDelegation.documentId
          ? new Types.ObjectId(createDelegation.documentId)
          : null,
        confirmedBy: createDelegation.confirmedBy
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
}
