import { Injectable } from '@nestjs/common';
import { CreateElectionDocumentDto } from './dto/create-election-document.dto';
import { UpdateElectionDocumentDto } from './dto/update-election-document.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { paginate } from 'src/common/dto/paignation';

@Injectable()
export class ElectionDocumentsService {
  constructor(
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionsParticipantsModel: Model<ElectionsParticipants>,
  ) { }

  async create(createElectionDocument: CreateElectionDocumentDto, userId: string) {
    try {
      //check if the election exists
      const election = await this.electionsModel.exists({ _id: createElectionDocument.electionId });
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      // //check if the preparedBy exists
      // const preparedBy = await this.electionsParticipantsModel.exists({ _id: createElectionDocument.preparedBy });
      // if (!preparedBy) {
      //   throw new Error(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      // }
      const electionDocument = await this.electionDocumentsModel.create({
        ...createElectionDocument,
        electionId: new Types.ObjectId(createElectionDocument.electionId),
        preparedBy: new Types.ObjectId(userId),
        createdBy: new Types.ObjectId(userId) || null,
      });
      return electionDocument;
    } catch (error) {
      throw error;
    }

  }

  async getById(id: string) {
    try {
      //check if the document exists
      const documentExist = await this.electionDocumentsModel.exists({ _id: id });
      if (!documentExist) {
        throw new Error(MESSAGE.ELECTION_DOCUMENT_NOT_FOUND);
      }
      const electionDocument = await this.electionDocumentsModel
        .findById(new Types.ObjectId(id))
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate('preparedBy')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return electionDocument;
    } catch (error) {
      throw error;
    }
  }


  async getByElectionId(electionId: string) {
    try {
      //check if the election exists
      const election = await this.electionsModel.exists({ _id: electionId });
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }


      const electionDocuments = await this.electionDocumentsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId')
        .populate('preparedBy')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return electionDocuments;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateElectionDocument: UpdateElectionDocumentDto, userId: string) {
    try {
      //check if the document exists
      const documentExist = await this.electionDocumentsModel.exists({ _id: id });
      if (!documentExist) {
        throw new Error(MESSAGE.ELECTION_DOCUMENT_NOT_FOUND);
      }
      const electionDocument = await this.electionDocumentsModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateElectionDocument,
          electionId: updateElectionDocument.electionId ? new Types.ObjectId(updateElectionDocument.electionId) : null,
          preparedBy: updateElectionDocument.preparedBy ? new Types.ObjectId(updateElectionDocument.preparedBy) : null,
        }, { new: true })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate('preparedBy')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return electionDocument;
    } catch (error) {
      throw error;
    }
  }
  async getByCreatedBy(userId: string) {
    try {
      const electionDocuments = await this.electionDocumentsModel
        .find({ createdBy: new Types.ObjectId(userId) })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName')
        .populate('preparedBy')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return paginate(electionDocuments);
    } catch (error) {
      throw error;
    }
  }
}
