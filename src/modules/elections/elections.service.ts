import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate } from 'src/common/dto/paignation';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import {
  Elections,
  ElectionsDocument,
} from 'src/database/schemas/elections.schema';
import { ElectionsDto } from './dto/elections.dto';
import { STATUS } from 'src/common/enums/status.enum';
import { ElectionsDocumentDto } from './dto/electionsDocument.dto';

@Injectable()
export class ElectionsService {
  constructor(
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<ElectionsDocument>,
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
  ) { }

  async searchElections(req: ElectionsDto) {
    try {
      const elections = await this.electionsModel.find().exec();
      return paginate(elections, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  async getElectionById(id: string) {
    try {
      const election = await this.electionsModel
        .findById(new Types.ObjectId(id))
        .exec();
      return election;
    } catch (error) {
      throw error;
    }
  }

  async searchElectionDocumentsByElectionId(electionId: string) {
    try {
      const documents = await this.electionDocumentsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId')
        .exec();
      return documents;
    } catch (error) {
      throw error;
    }
  }

  async updateElections(id: string, data: ElectionsDto) {
    try {
      const election = await this.electionsModel
        .findByIdAndUpdate(new Types.ObjectId(id), data, { new: true })
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
        throw new Error('Không tìm thấy cuộc bầu cử để xóa');
      }
      election.status = STATUS.CLOSED;
      return election.save();
    } catch (error) {
      throw error;
    }
  }

  async createElectionDocuments(req: ElectionsDocumentDto) {
    try {
      const election = await this.electionDocumentsModel.create(req);
      return election;
    } catch (error) {
      throw error;
    }
  }

  async searchDocumentsByElectionId(electionId: string) {
    try {
      const documents = await this.electionDocumentsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .exec();
      return documents;
    } catch (error) {
      throw error;
    }
  }

  async deleteDocumentByElectionId(electionId: string) {
    try {
      const documents = await this.electionDocumentsModel
        .deleteMany({ electionId: new Types.ObjectId(electionId) })
        .exec();
      return documents;
    } catch (error) {
      throw error;
    }
  }
}
