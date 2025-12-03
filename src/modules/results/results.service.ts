import { Injectable } from '@nestjs/common';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Results } from 'src/database/schemas/results.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { STATUS } from 'src/common/enums/status.enum';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';
import path from 'path/win32';
import PdfPrinter from "pdfmake";
import * as fs from "fs";
import * as os from "os";

import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { error } from 'console';
import { SigningService } from '../signature/signature.service';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ResultsService {
  constructor(
    @InjectModel(Results.name)
    private readonly resultsModel: Model<Results>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(ElectionEntities.name)
    private readonly electionEntitiesModel: Model<ElectionEntities>,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    @InjectModel(VotingMethods.name)
    private readonly votingMethodsModel: Model<VotingMethods>,
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionsParticipantsModel: Model<ElectionsParticipants>,
    private readonly signingService: SigningService,
    private readonly minioService: MinioService,
    private readonly mailService: MailService,
  ) { }



  async search(req: BaseSearchDTO) {
    try {
      //search theo electionId
      const matchedElection = await this.electionsModel.find({
        title: { $regex: req.keyword, $options: 'i' }
      }).collation({ locale: 'vi', strength: 1 }).lean().exec();
      const electionIds = matchedElection.map(election => election._id);
      //search theo entity title
      const matchedEntity = await this.electionEntitiesModel.find({
        $or: [
          { title: { $regex: req.keyword, $options: 'i' } },
          { description: { $regex: req.keyword, $options: 'i' } },
          { metaData: { $regex: req.keyword, $options: 'i' } },
          { fileUrl: { $regex: req.keyword, $options: 'i' } },
          { status: { $regex: req.keyword, $options: 'i' } }
        ]
      }).collation({ locale: 'vi', strength: 1 }).lean().exec();
      const entityIds = matchedEntity.map(entity => entity._id);

      //tim kiem trong result
      const query: any = {};
      if (electionIds.length > 0) query.electionId = { $in: electionIds };
      if (entityIds.length > 0) query.entityId = { $in: entityIds };
      const results = await this.resultsModel.find(query)
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status decisionNumber decisionName')
        .populate('entityId', 'title description metaData fileUrl proposerId status')
        .exec();
      return results;

    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      //Check if the result is exist
      const resultExist = await this.resultsModel.exists({ _id: id });
      if (!resultExist) {
        throw new Error(MESSAGE.RESULT_NOT_FOUND);
      }
      const result = await this.resultsModel.findById(new Types.ObjectId(id))
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status decisionNumber decisionName')
        .populate('entityId', 'title description metaData fileUrl proposerId status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      //Check if the election is exist
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const result = await this.resultsModel.find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status decisionNumber decisionName')
        .populate('entityId', 'title description metaData fileUrl proposerId status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async createAndSign(
    p12File: Express.Multer.File,
    password: string,
    electionId: string,
    userId: string) {
    try {
      //Check if elections is exists
      const electionExist = await this.electionsModel.findById({ _id: new Types.ObjectId(electionId) });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Tìm phương thức bầu cử
      const votingMethod = await this.votingMethodsModel.findById(new Types.ObjectId(electionExist.votingMethodId));
      if (!votingMethod) {
        throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
      }

      //Tìm người chiến thắng dựa trên phương thức bầu cử
      let results;
      console.log("results: ", results);

      if (votingMethod.methodCode === 'CUMULATIVE') {
        results = await this.getWinnersCumulative(electionId);
      } else if (votingMethod.methodCode === 'YES_NO_ABSTAIN') {
        results = await this.getWinnersYesNo(electionId);
        console.log("results 2: ", results);
      }

      //tạo file pdf kết quả
      const pdfPath = await this.generateResultPdf(electionId, results);
      //tạo file kí số
      const signFile = await this.signingService.signPdfWithP12(
        pdfPath,
        p12File.buffer,
        password
      );

      if (signFile) {
        //tạo bản ghi kết quả
        await this.resultsModel.create({
          electionId: new Types.ObjectId(electionId),
          entityId: results[0]?._id,
          votesCount: results[0]?.totalVotes,
          isFinal: true,
          status: STATUS.SIGNED,
          createdBy: new Types.ObjectId(userId),
        });

        //Gửi mail tới các thành viên về kết quả 
        const electionParticipants = await this.electionsParticipantsModel.find({
          electionId: new Types.ObjectId(electionId),
          status: STATUS.ACTIVE
        }).populate('userId', 'email fullName').exec();

        await Promise.all(electionParticipants.map(participant => {
          const user = participant.userId as any;
          this.mailService.sendMailResult(
            user.email,
            user.fullName,
            electionExist.title,
            pdfPath,
          )
        }));



        //upload file đã ký lên minio
        const fileUpload = await this.minioService.uploadSignedPdf(
          FileType.ELECTION_RESULT,
          userId,
          signFile
        );
        if (fileUpload) {
          //Tạo bản ghi file trong election documentId
          await this.electionDocumentsModel.create({
            electionId: new Types.ObjectId(electionId),
            preparedBy: new Types.ObjectId(userId),
            title: `Kết quả bầu cử - ${electionExist.title}`,
            type: FileType.ELECTION_RESULT,
            fileUrl: fileUpload.url,
            createdBy: new Types.ObjectId(userId),
          });
        }
        return fileUpload;
      } else {
        throw new Error("Ký số không thành công");
      }
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateResultDto: UpdateResultDto, userId: string) {
    try {
      //Check if the result is exist
      const resultExist = await this.resultsModel.exists({ _id: id });
      if (!resultExist) {
        throw new Error(MESSAGE.RESULT_NOT_FOUND);
      }
      const result = await this.resultsModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateResultDto,
          electionId: updateResultDto.electionId ? new Types.ObjectId(updateResultDto.electionId) : null,
          entityId: updateResultDto.entityId ? new Types.ObjectId(updateResultDto.entityId) : null,
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        }, { new: true })
        .exec();
      return result;
    } catch (error) {
      throw error;
    }
  }

  //Tìm người chiến thắng nếu votingMethod là CUMULATIVE
  async getWinnersCumulative(electionId: string) {
    try {
      const results = await this.ballotsModel.aggregate([
        {
          $match: {
            electionId: new Types.ObjectId(electionId)
            , status: STATUS.CAST
          }
        },
        { $unwind: '$allocations' },
        {
          $group: {
            _id: '$allocations.entityId',
            totalVotes: { $sum: '$allocations.voteValue' }
          }
        },
        {
          $lookup: {
            from: 'electionentities',
            localField: '_id',
            foreignField: '_id',
            as: 'entity'
          }
        },
        {
          $unwind: "$entity"
        },
        {
          $project: {
            _id: 1,
            totalVotes: 1,
            //entityTitle: '$entity.title',
            entityDescription: '$entity.description',
            entityMetaData: '$entity.metaData'
          }
        },
        {
          $sort: { totalVotes: -1 }
        },

      ]);

      // Tính tổng của tất cả entity để tính %
      const sumVotes = results.reduce((acc, item) => acc + item.totalVotes, 0);

      // Thêm phần trăm
      const finalResults = results.map(r => ({
        ...r,
        percentage: sumVotes === 0
          ? 0
          : Number(((r.totalVotes / sumVotes) * 100).toFixed(2))
      }));
      return finalResults;

    } catch (error) {
      throw error;
    }
  }
  //Tìm người chiến thắng nếu votingMethod là YES_NO_ABSTAIN
  async getWinnersYesNo(electionId: string) {
    try {
      const totalYesNoAbstain = await this.ballotsModel.aggregate([
        {
          $match: {
            electionId: new Types.ObjectId(electionId),
            status: STATUS.CAST
          }
        },
        {
          $unwind: "$allocations"
        },
        {
          $group: {
            _id: "$allocations.voteValue",
            total: { $sum: 1 }
          }
        },
      ]);
      let agree = 0;
      let disagree = 0;
      let abstain = 0;

      for (const r of totalYesNoAbstain) {
        if (r._id == 1) agree = r.total;
        else if (r._id == 0) disagree = r.total;
        else abstain = r.total;  // -1 hoặc null
      }

      const totalVotes = agree + disagree + abstain;

      const results = await this.ballotsModel.aggregate([
        { $match: { electionId: new Types.ObjectId(electionId), status: STATUS.CAST } },
        { $unwind: '$allocations' },
        {
          $group: {
            _id: '$allocations.entityId',
            agree: {
              $sum: {
                $cond: [{ $eq: ['$allocations.voteValue', 1] }, 1, 0]
              }
            },
            disagree: {
              $sum: {
                $cond: [{ $eq: ['$allocations.voteValue', 0] }, 1, 0]
              }
            },
            abstain: {
              $sum: {
                $cond: [{ $eq: ['$allocations.voteValue', -1] }, 1, 0]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'electionentities',
            localField: '_id',
            foreignField: '_id',
            as: 'entity'
          }
        },
        {
          $unwind: "$entity"
        },
        {
          $project: {
            _id: 1,
            totalVotes: { $add: ['$agree', '$disagree', '$abstain'] },
            //entityTitle: '$entity.title',
            entityDescription: '$entity.description',
            entityMetaData: '$entity.metaData',
            agree: 1,
            disagree: 1,
            abstain: 1
          }
        },
        {
          $sort: { totalVotes: -1 }
        }
      ]);

      const finalResults = results.map(r => ({
        ...r,
        percentage: r.agree === 0
          ? 0
          : Number(((r.agree / totalVotes) * 100).toFixed(2))
      }));
      return finalResults;
    } catch (error) {
      throw error;
    }
  }

  async generateResultPdf(electionId: string, results: any[]) {
    try {

      //Lấy thông tin cuộc bầu cử
      const election: any = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .populate([
          { path: 'typeId', select: 'typeCode typeName description status' },
          { path: 'votingMethodId', select: 'methodName methodCode description status' },
          { path: 'thresholdId', select: 'thresholdName thresholdCode value description status' },
        ]).exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }


      let winner = results[0];


      const printer = new PdfPrinter({
        Roboto: {
          normal: path.join(process.cwd(), 'src/fonts/Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src/fonts/Roboto-Bold.ttf'),
          italics: path.join(process.cwd(), 'src/fonts/Roboto-Italic.ttf'),
          bolditalics: path.join(process.cwd(), 'src/fonts/Roboto-BoldItalic.ttf'),
        }
      });


      const docDefinition: any = {
        content: [
          { text: 'KẾT QUẢ BẦU CỬ', style: 'header' },
          { text: election.title, style: 'title' },
          '\n',

          { text: 'Thông tin cuộc bầu cử', style: 'sectionHeader' },
          {
            table: {
              widths: ['30%', '70%'],
              body: [
                ['Tiêu đề:', election.title],
                ['Thời gian bắt đầu:', new Date(election.startDate).toLocaleString()],
                ['Thời gian kết thúc:', new Date(election.endDate).toLocaleString()],
                ['Phương thức bầu cử:', election.votingMethodId.methodName],
                ['Loại bầu cử:', election.typeId.typeName],
                ['Ngưỡng thông qua:', election.thresholdId.thresholdName],
              ]
            },
            margin: [0, 5, 0, 15]
          },

          { text: 'Danh sách đối tượng / lựa chọn tham gia', style: 'sectionHeader' },
          {
            ul: results.map(e => `${e?.entityTitle}`)
          },
          '\n\n',

          { text: 'Kết quả thống kê', style: 'sectionHeader' },
          {
            table: {
              widths: ['40%', '20%', '20%', '20%'],
              body: [
                ['Đối tượng', 'Tổng phiếu', 'Phần trăm', 'Trạng thái'],
                ...results.map(r => ([
                  r?.entityTitle,
                  r?.totalVotes.toString(),
                  `${r?.percentage}%`,
                  r?._id === winner?._id ? '🏆 Thắng' : '',
                ]))
              ]
            }
          },

          '\n\n',
          { text: 'Người chiến thắng', style: 'sectionHeader' },
          {
            text: `${winner?.entityTitle}\nSố phiếu: ${winner?.totalVotes}\nTỷ lệ: ${winner?.percentage}%`,
            style: 'winnerBox'
          }
        ],

        styles: {
          header: {
            fontSize: 22,
            bold: true,
            alignment: 'center'
          },
          title: {
            fontSize: 16,
            italics: true,
            alignment: 'center'
          },
          sectionHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5]
          },
          winnerBox: {
            fontSize: 12,
            margin: [0, 5, 0, 5],
            bold: true
          }
        }
      };

      //Footer Sign
      docDefinition.content.push({
        columns: [
          { text: '' },
          {
            text: `CHỦ TỊCH`,
            alignment: 'center',
            margin: [0, 50, 0, 0],
          },
        ],
      })

      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: any[] = [];
      return await new Promise<Buffer>((resolve, reject) => {
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (error) => reject(error));
        pdfDoc.end();
      });
    } catch (error) {
      throw error;
    }
  }

}
