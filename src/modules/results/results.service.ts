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
import * as path from 'path';
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
import { Reports } from 'src/database/schemas/reports.schema';

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
    @InjectModel(Reports.name)
    private readonly reportsModel: Model<Reports>,
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


      if (votingMethod.methodCode === 'CUMULATIVE') {
        results = await this.getWinnersCumulative(electionId);
      } else if (votingMethod.methodCode === 'YES_NO_ABSTAIN') {
        results = await this.getWinnersYesNo(electionId);

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
            fileUrl: fileUpload.key,
            createdBy: new Types.ObjectId(userId),
          });

          // Cập nhật tất cả kết quả của cuộc bầu cử sang SIGNED
          await this.resultsModel.updateMany(
            { electionId: new Types.ObjectId(electionId) },
            { $set: { status: STATUS.SIGNED } }
          );
        }
        // -----------------------------
        // 2. Ký báo cáo VERIFICATION và lưu ElectionDocument
        // -----------------------------
        const verificationReport = await this.reportsModel.findOne({
          electionId: new Types.ObjectId(electionId),
          type: 'VERIFICATION',
        });

        if (verificationReport) {
          // Tạo pdf đơn giản cho báo cáo xác minh
          const verificationPdf = await this.generateVerificationPdf(electionExist.title, verificationReport);

          // Ký pdf báo cáo xác minh
          const signedVerification = await this.signingService.signPdfWithP12(
            verificationPdf,
            p12File.buffer,
            password
          );

          // Upload file đã ký lên minio
          const verificationUpload = await this.minioService.uploadSignedPdf(
            FileType.REPORT_VERIFICATION_SIGN,
            userId,
            signedVerification
          );

          if (verificationUpload) {
            // Lưu ElectionDocument
            const verificationDoc = await this.electionDocumentsModel.create({
              electionId: new Types.ObjectId(electionId),
              preparedBy: new Types.ObjectId(userId),
              title: `Báo cáo xác minh - ${electionExist.title}`,
              type: FileType.REPORT_VERIFICATION_SIGN,
              fileUrl: verificationUpload.key,
              fileKey: (verificationUpload as any).key || null,
              createdBy: new Types.ObjectId(userId),
            });

            // Cập nhật report: status RESOLVED + gán documentId
            verificationReport.status = STATUS.RESOLVED;
            verificationReport.documentId = verificationDoc._id as Types.ObjectId;
            verificationReport.reviewedBy = new Types.ObjectId(userId);
            verificationReport.reviewedAt = new Date();
            await verificationReport.save();
          }
        }

        return fileUpload;
      } else {
        throw new Error("Ký số không thành công");
      }
    } catch (error) {
      throw error;
    }
  }

  private async generateVerificationPdf(electionTitle: string, report: any) {
    const printer = new PdfPrinter({
      Roboto: {
        normal: path.join(process.cwd(), 'src/fonts/Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src/fonts/Roboto-Bold.ttf'),
        italics: path.join(process.cwd(), 'src/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(process.cwd(), 'src/fonts/Roboto-BoldItalic.ttf'),
      }
    });

    const summary = report?.summary ? (() => {
      try {
        return JSON.parse(report.summary);
      } catch {
        return {};
      }
    })() : {};

    const docDefinition: any = {
      content: [
        { text: 'BÁO CÁO XÁC MINH', style: 'header' },
        { text: electionTitle, style: 'title' },
        '\n',
        { text: 'Thông tin báo cáo', style: 'sectionHeader' },
        {
          table: {
            widths: ['35%', '65%'],
            body: [
              ['Mã báo cáo', report?._id?.toString() || '--'],
              ['Trạng thái', report?.status || STATUS.PENDING],
              ['Ngày xác minh', new Date().toLocaleString('vi-VN')],
              ['Checksum trước', summary.checksumBefore || '--'],
              ['Checksum sau', summary.checksumAfter || '--'],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 5, 0, 15],
        },
        { text: 'Ghi chú', style: 'sectionHeader' },
        { text: report?.description || 'Không có', margin: [0, 4, 0, 0] },
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center' },
        title: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 6, 0, 12] },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 12, 0, 6] },
      },
      defaultStyle: { fontSize: 11 },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const tempDir = os.tmpdir();
    const tempPath = path.join(tempDir, `verification-${Date.now()}.pdf`);

    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
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
            electionId: new Types.ObjectId(electionId),
            status: STATUS.CAST,
            allocations: { $ne: [] }
          },
        },
        { $unwind: '$allocations' },
        {
          $group: {
            _id: '$allocations.entityId',
            totalVotes: { $sum: '$allocations.voteValue' },
          },
        },
        {
          $lookup: {
            from: 'electionentities',
            localField: '_id',
            foreignField: '_id',
            as: 'entity',
          },
        },
        {
          $unwind: '$entity',
        },
        {
          $project: {
            _id: 1,
            totalVotes: 1,
            entityTitle: '$entity.title',
            entityDescription: '$entity.description',
            entityMetaData: '$entity.metaData',
          },
        },
        {
          $sort: { totalVotes: -1 },
        },
      ]);

      // Tính tổng của tất cả entity để tính %
      const sumVotes = results.reduce((acc, item) => acc + item.totalVotes, 0);

      // Thêm phần trăm
      const finalResults = results.map((r) => ({
        ...r,
        percentage: sumVotes === 0 ? 0 : Number(((r.totalVotes / sumVotes) * 100).toFixed(2)),
      }));
      return finalResults;
    } catch (error) {
      throw error;
    }
  }
  //Tìm người chiến thắng nếu votingMethod là YES_NO_ABSTAIN
  async getWinnersYesNo(electionId: string) {
    try {
      //Kiểm tra electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // Đếm số phiếu trắng (allocations == null hoặc allocations == [])
      const blankVotesCount = await this.ballotsModel.countDocuments({
        electionId: new Types.ObjectId(electionId),
        status: STATUS.BLANK,
        allocations: { $size: 0 }
      });

      // Tính kết quả cho các phiếu đã bỏ (có allocations)
      const totalYesNoAbstain = await this.ballotsModel.aggregate([
        {
          $match: {
            electionId: new Types.ObjectId(electionId),
            status: STATUS.CAST,
            allocations: { $ne: [] }
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

      for (const r of totalYesNoAbstain) {
        if (r._id == 1) agree = r.total;
        else if (r._id == 0) disagree = r.total;
      }

      const totalVotesIncludingBlank = agree + disagree + blankVotesCount;

      const results = await this.ballotsModel.aggregate([
        {
          $match: {
            electionId: new Types.ObjectId(electionId),
            status: STATUS.CAST,
            allocations: { $not: { $size: 0 } }
          }
        },
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
            totalVotes: { $add: ['$agree', '$disagree', blankVotesCount] },
            entityTitle: '$entity.title',
            entityDescription: '$entity.description',
            entityMetaData: '$entity.metaData',
            agree: 1,
            disagree: 1,
          }
        },
        {
          $sort: { totalVotes: -1 }
        }
      ]);

      const finalResults: any = results.map(r => ({
        ...r,
        percentage: r.agree === 0
          ? 0
          : Number(((r.agree / r.totalVotes) * 100).toFixed(2))
      }));

      // Thêm thông tin phiếu trắng vào kết quả nếu có
      if (blankVotesCount > 0) {
        finalResults.push({
          blankVotes: blankVotesCount,
          percentage: totalVotesIncludingBlank === 0
            ? 0
            : Number(((blankVotesCount / totalVotesIncludingBlank) * 100).toFixed(2))
        });

      }

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

  // Tính kết quả theo ngưỡng (PERCENT | VALUE) và trả về danh sách kết quả + người thắng
  async computeResultsWithThreshold(electionId: string) {
    try {
      const electionObjectId = new Types.ObjectId(electionId);
      // Lấy election kèm threshold và votingMethod
      const election: any = await this.electionsModel
        .findById(electionObjectId)
        .populate([
          { path: 'votingMethodId', select: 'methodName methodCode description status' },
          { path: 'thresholdId', select: 'thresholdName thresholdCode value description status' },
        ])
        .lean()
        .exec();

      if (!election) throw new Error(MESSAGE.ELECTION_NOT_FOUND);

      const votingMethodCode = election.votingMethodId?.methodCode;
      const threshold = election.thresholdId || null;

      const [totalBallots, castBallots] = await Promise.all([
        this.ballotsModel.countDocuments({ electionId: electionObjectId }),
        this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.CAST }),
      ]);
      const participationPercent =
        totalBallots === 0 ? 0 : Number(((castBallots / (totalBallots || 1)) * 100).toFixed(2));

      let rawResults: any[] = [];
      if (votingMethodCode === 'CUMULATIVE') {
        rawResults = await this.getWinnersCumulative(electionId);
      } else if (votingMethodCode === 'YES_NO_ABSTAIN') {
        rawResults = await this.getWinnersYesNo(electionId);
      } else {
        rawResults = [];
      }

      const normalizeToken = (value?: string | null) =>
        value ? value.toString().trim().toUpperCase().replace(/\s+/g, '_') : null;
      const thresholdCode: string | null = normalizeToken(threshold?.thresholdCode || null);
      const thresholdTypeToken: string | null = normalizeToken(threshold?.thresholdType || null);
      const tokenSet = new Set(
        [thresholdCode, thresholdTypeToken].filter((token): token is string => Boolean(token)),
      );
      const hasToken = (...tokens: string[]) => tokens.some((token) => tokenSet.has(token));

      const thresholdValue: number = threshold?.value !== undefined ? Number(threshold.value) : NaN;

      const sumVotes = rawResults.reduce((acc, r) => acc + (Number(r.totalVotes) || 0), 0);

      const candidatePercentThreshold = hasToken(
        'PERCENT',
        'CANDIDATE_PERCENT',
        'SIMPLE_MAJORITY',
        'ABSOLUTE_MAJORITY',
        'SUPER_MAJORITY',
        'TWO_THIRDS',
      );
      const candidateValueThreshold = hasToken('VALUE', 'CANDIDATE_VALUE');
      const candidateConstraintApplied = candidatePercentThreshold || candidateValueThreshold;

      const quorumPercentThreshold = hasToken('QUORUM_PERCENT');
      const quorumValueThreshold = hasToken('QUORUM_VALUE');
      const quorumApplied = quorumPercentThreshold || quorumValueThreshold;

      const marginValueThreshold = hasToken('MARGIN_VALUE');
      const marginPercentThreshold = hasToken('MARGIN_PERCENT');
      const marginApplied = marginValueThreshold || marginPercentThreshold;

      const mapped = rawResults.map((r) => {
        const totalVotes = Number(r.totalVotes) || 0;
        const percentage =
          typeof r.percentage === 'number'
            ? r.percentage
            : sumVotes === 0
              ? 0
              : Number(((totalVotes / sumVotes) * 100).toFixed(2));

        let passed = true;
        if (candidatePercentThreshold && !Number.isNaN(thresholdValue)) {
          passed = percentage >= thresholdValue;
        } else if (candidateValueThreshold && !Number.isNaN(thresholdValue)) {
          passed = totalVotes >= thresholdValue;
        }

        return {
          _id: r._id,
          entityTitle: r.entityTitle,
          entityDescription: r.entityDescription,
          totalVotes,
          percentage,
          passed,
          raw: r,
        };
      });

      const candidateQualified = candidateConstraintApplied ? mapped.filter((m) => m.passed) : mapped;
      const candidateConstraintSatisfied =
        !candidateConstraintApplied || candidateQualified.length > 0;

      let quorumSatisfied = true;
      if (quorumPercentThreshold && !Number.isNaN(thresholdValue)) {
        quorumSatisfied = participationPercent >= thresholdValue;
      } else if (quorumValueThreshold && !Number.isNaN(thresholdValue)) {
        quorumSatisfied = castBallots >= thresholdValue;
      }

      const sortedByVotes = [...mapped].sort((a, b) => b.totalVotes - a.totalVotes);
      const topVotes = sortedByVotes[0]?.totalVotes ?? 0;
      const runnerUpVotes = sortedByVotes[1]?.totalVotes ?? 0;
      const marginVotes = Math.max(topVotes - runnerUpVotes, 0);
      const marginPercent = sumVotes === 0 ? 0 : Number(((marginVotes / sumVotes) * 100).toFixed(2));
      let marginSatisfied = true;
      if (marginValueThreshold && !Number.isNaN(thresholdValue)) {
        marginSatisfied = marginVotes >= thresholdValue;
      } else if (marginPercentThreshold && !Number.isNaN(thresholdValue)) {
        marginSatisfied = marginPercent >= thresholdValue;
      }

      const thresholdStatus =
        !threshold ||
        (candidateConstraintSatisfied && quorumSatisfied && marginSatisfied);

      const pool = candidateConstraintApplied ? candidateQualified : mapped;
      let winners: any[] = [];
      if (thresholdStatus && pool.length > 0) {
        const maxVotes = Math.max(...pool.map((p) => p.totalVotes), 0);
        if (maxVotes > 0) {
          winners = pool.filter((p) => p.totalVotes === maxVotes);
        }
      }

      return {
        electionId,
        votingMethodCode,
        threshold: threshold
          ? {
            id: threshold._id,
            name: threshold.thresholdName,
            code: threshold.thresholdCode,
            value: threshold.value,
          }
          : null,
        totalVotes: sumVotes,
        results: mapped,
        winners,
        thresholdStatus,
        participation: {
          totalBallots,
          castBallots,
          participationPercent,
          quorumSatisfied,
        },
        thresholdEvaluation: {
          candidate: candidateConstraintApplied
            ? {
              type: candidatePercentThreshold ? 'PERCENT' : 'VALUE',
              minimum: Number.isNaN(thresholdValue) ? null : thresholdValue,
              satisfied: candidateConstraintSatisfied,
            }
            : null,
          quorum: quorumApplied
            ? {
              type: quorumPercentThreshold ? 'PERCENT' : 'VALUE',
              totalBallots,
              castBallots,
              participationPercent,
              satisfied: quorumSatisfied,
            }
            : null,
          margin: marginApplied
            ? {
              type: marginPercentThreshold ? 'PERCENT' : 'VALUE',
              topVotes,
              runnerUpVotes,
              marginVotes,
              marginPercent,
              satisfied: marginSatisfied,
            }
            : null,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Tạo bản ghi result (không ký) dựa trên computeResultsWithThreshold
  async autoCreateResultRecord(electionId: string, createdBy?: string) {
    try {
      const computed = await this.computeResultsWithThreshold(electionId);
      if (!computed) throw new Error('Cannot compute results');

      // Idempotent: xóa bản ghi cũ (chưa ký) và tạo lại bộ kết quả đầy đủ
      const electionObjId = new Types.ObjectId(electionId);
      await this.resultsModel.deleteMany({ electionId: electionObjId });

      const winners = computed.winners || [];
      const winnerIds = new Set(winners.map((w: any) => String(w._id)));

      const docs =
        (computed.results || []).map((item: any) => ({
          electionId: electionObjId,
          entityId: item._id ? new Types.ObjectId(item._id) : null,
          votesCount: item.totalVotes || 0,
          isFinal: winnerIds.has(String(item._id)),
          status: STATUS.ACTIVE,
          createdBy: createdBy ? new Types.ObjectId(createdBy) : null,
        })) ?? [];

      if (docs.length === 0) {
        docs.push({
          electionId: electionObjId,
          entityId: null,
          votesCount: 0,
          isFinal: false,
          status: STATUS.ACTIVE,
          createdBy: createdBy ? new Types.ObjectId(createdBy) : null,
        });
      }

      const created = await this.resultsModel.insertMany(docs);
      return { created, computed };
    } catch (error) {
      throw error;
    }
  }

}
