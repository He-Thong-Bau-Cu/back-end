import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reports, ReportsDocument } from 'src/database/schemas/reports.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Reports.name)
    private readonly reportModel: Model<Reports>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>
  ) { }

  async create(createReport: CreateReportDto) {
    try {
      //Check if elctions is exists
      const eletionExist = await this.electionsModel.exists({ _id: createReport.electionId });
      if (!eletionExist)
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);

      const report = await this.reportModel.create(createReport);
      return report;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.reportModel
        .find()
        .populate('electionId')
        .populate('reviewedBy', 'username fullName email position')
        .populate('signedBy', 'username fullName email position')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const report = await this.reportModel
        .findById(new Types.ObjectId(id))
        .populate('electionId')
        .populate('reviewedBy', 'username fullName email position')
        .populate('signedBy', 'username fullName email position')
        .exec();

      //Check if report is exist or IsNotEmpty
      if (!report) {
        throw new Error(MESSAGE.REPORT_NOT_FOUND);
      }

      return report;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      //Check if electionId is exist or IsNotEmpty
      const electionExist = await this.electionsModel.exists({ _id: new Types.ObjectId(electionId) });
      if (!electionExist)
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);

      const report = await this.reportModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId')
        .populate('reviewedBy', 'username fullName email position')
        .populate('signedBy', 'username fullName email position')
        .exec();

      //Check if report is exist or IsNotEmpty
      if (!report) {
        throw new Error(MESSAGE.REPORT_NOT_FOUND);
      }

      return report;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateReport: UpdateReportDto) {
    try {
      //Check if the report is exist
      const reportExist = await this.reportModel.exists({ _id: id });
      if (!reportExist) {
        throw new Error(MESSAGE.REPORT_NOT_FOUND);
      }
      return await this.reportModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateReport, { new: true })
        .populate('electionId')
        .populate('reviewedBy', 'username fullName email position')
        .populate('signedBy', 'username fullName email position')
        .exec();
    } catch (error) {
      throw error;
    }
  }
}
