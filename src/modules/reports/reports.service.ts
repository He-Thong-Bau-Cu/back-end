import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reports, ReportsDocument } from 'src/database/schemas/reports.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import path from 'path/win32';
import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import * as os from 'os';
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { REPORT_TYPE, STATUS } from 'src/common/enums/status.enum';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { MailService } from '../mail/mail.service';
import { Users } from 'src/database/schemas/users.schema';
import { getCurrentDateVN } from 'src/common/utils/format';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Reports.name)
    private readonly reportModel: Model<Reports>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>,
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
    private readonly signingService: SigningService,
    private readonly minioService: MinioService,
    private readonly mailService: MailService,
  ) { }

  async create(createReport: CreateReportDto, userId: string) {
    try {
      //Check if elctions is exists
      const eletionExist = await this.electionsModel.exists({ _id: createReport.electionId });
      if (!eletionExist)
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);

      const report = await this.reportModel.create({
        ...createReport,
        electionId: new Types.ObjectId(createReport.electionId),
        reviewedBy: createReport.reviewedBy ? new Types.ObjectId(createReport.reviewedBy) : null,
        documentId: createReport.documentId ? new Types.ObjectId(createReport.documentId) : null,
        createdBy: userId ? new Types.ObjectId(userId) : null,
      });
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
        .populate('documentId', 'title type content fileUrl status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
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
        .populate('documentId', 'title type content fileUrl status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
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

  async update(id: string, updateReport: UpdateReportDto, userId: string) {
    try {
      //Check if the report is exist
      const reportExist = await this.reportModel.exists({ _id: id });
      if (!reportExist) {
        throw new Error(MESSAGE.REPORT_NOT_FOUND);
      }
      return await this.reportModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateReport,
          electionId: updateReport.electionId ? new Types.ObjectId(updateReport.electionId) : null,
          reviewedBy: updateReport.reviewedBy ? new Types.ObjectId(updateReport.reviewedBy) : null,
          documentId: updateReport.documentId ? new Types.ObjectId(updateReport.documentId) : null,
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        }, { new: true })
        .populate('electionId')
        .populate('reviewedBy', 'username fullName email position')
        .populate('documentId', 'title type content fileUrl status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async signReport(
    p12File: Express.Multer.File,
    password: string,
    reportId: string,
    userId: string,
  ) {
    try {
      //Kiểm tra báo cáo có tồn tại không
      const report: any = await this.reportModel.findById(new Types.ObjectId(reportId)).populate('electionId', 'title').exec();
      if (!report) throw new Error(MESSAGE.REPORT_NOT_FOUND);

      //Lấy thông tin của người kí
      const user = await this.usersModel.findById(new Types.ObjectId(userId));
      if (!user) throw new Error(MESSAGE.USER_NOT_FOUND);



      // Tạo file PDF từ báo cáo
      const filePdf = await this.generateReportPDF(reportId);

      // Ký số file PDF
      const signingFile = await this.signingService.signPdfWithP12(
        filePdf,
        p12File.buffer,
        password,
      );
      if (signingFile) {
        //Lưu file đã ký vào MinIO
        const fileUpload = await this.minioService.uploadSignedPdf(
          FileType.SIGNED_REPORT,
          userId,
          signingFile,
        )
        //Lưu file vào ElectionDocuments
        if (fileUpload) {
          const document: any = await this.electionDocumentsModel.create({
            electionId: report.electionId,
            preparedBy: new Types.ObjectId(userId),
            title: `File báo cáo đã ký - ${report._id}`,
            type: FileType.SIGNED_REPORT,
            fileUrl: fileUpload.url,
            status: STATUS.SIGNED,
            createdBy: userId ? new Types.ObjectId(userId) : null,
          })

          //Cập nhật trạng thái đã ký cho báo cáo
          report.documentId = new Types.ObjectId(document._id);
          report.status = STATUS.SIGNED;
          report.reviewedBy = new Types.ObjectId(userId);
          report.reviewedAt = getCurrentDateVN();
          report.status = STATUS.SIGNED;
          report.updatedBy = new Types.ObjectId(userId);
          await report.save();

          //Gửi mail thông báo
          await this.mailService.sendMailSignedReport(
            user.email,
            user.fullName,
            user.position,
            report.description,
            report.electionId.title,
            report.reviewedAt,
            filePdf
          )

          return fileUpload;
        } else {
          throw new Error(MESSAGE.FILE_UPLOAD_FAILED);
        }
      } else {
        throw new Error("Kí số không thành công")
      }

    } catch (error) {
      throw error;
    }
  }

  async generateReportPDF(reportId: string): Promise<Buffer> {
    try {
      // 1. Lấy dữ liệu report
      const report: any = await this.reportModel
        .findById(new Types.ObjectId(reportId))
        .populate(
          'electionId',
          'title startDate endDate decisionNumber decisionName status'
        )
        .populate('createdBy', 'fullName email phone position department username')
        .lean();

      if (!report) throw new Error('Không tìm thấy báo cáo');

      const election = report.electionId;
      const creater = report.createdBy;

      // -----------------------------------------
      // SETUP FONTS
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
        },
      };

      const printer = new PdfPrinter(fonts);

      // -----------------------------------------
      // 2. DOC DEFINITION
      const docDefinition: any = {
        pageMargins: [20, 20, 20, 20],
        content: [
          { text: 'BÁO CÁO CUỘC BẦU CỬ', style: 'title', alignment: 'center' },
          { text: report?.type?.toUpperCase() ?? '', style: 'subTitle', alignment: 'center' },
          { text: '\n' },

          // REPORT INFO
          { text: 'Thông tin báo cáo', style: 'section' },
          {
            table: {
              widths: ['auto', '*'],
              body: [
                ['Loại báo cáo:', report.type ? this.translateReportType(report.type) : '---'],
                ['Mức độ (Severity):', report.severity ? this.translateSeverity(report.severity) : '---'],
                [
                  'Ngày duyệt:',
                  report.reviewedAt
                    ? new Date(report.reviewedAt).toLocaleString()
                    : 'Chưa duyệt',
                ],
                ['Tóm tắt:', report.summary ?? '---'],
              ],
            },
            layout: 'noBorders',
            margin: [0, 5, 0, 15],
          },

          // ELECTION INFO
          { text: 'Thông tin cuộc bầu cử', style: 'section' },
          {
            table: {
              widths: ['auto', '*'],
              body: [
                ['Tên cuộc bầu cử:', election?.title ?? '---'],
                [
                  'Thời gian bắt đầu:',
                  election?.startDate
                    ? new Date(election.startDate).toLocaleString()
                    : '---',
                ],
                [
                  'Thời gian kết thúc:',
                  election?.endDate
                    ? new Date(election.endDate).toLocaleString()
                    : '---',
                ],
                ['Số quyết định:', election?.decisionNumber ?? '---'],
                ['Tên quyết định:', election?.decisionName ?? '---'],
              ],
            },
            layout: 'noBorders',
            margin: [0, 5, 0, 15],
          },

          // REVIEWER INFO
          { text: 'Thông tin người tạo', style: 'section' },
          {
            table: {
              widths: ['auto', '*'],
              body: [
                ['Họ tên:', creater?.fullName ?? '---'],
                ['Email:', creater?.email ?? '---'],
                ['Số điện thoại:', creater?.phone ?? '---'],
                ['Chức vụ:', creater?.position ?? '---'],
                ['Phòng ban:', creater?.department ?? '---'],

              ],
            },
            layout: 'noBorders',
            margin: [0, 5, 0, 15],
          },

          // DESCRIPTION
          { text: 'Nội dung báo cáo', style: 'section' },
          {
            text: report.description ?? '---',
            margin: [0, 0, 0, 20],
          },
        ],

        styles: {
          title: { fontSize: 22, bold: true },
          subTitle: { fontSize: 14, color: '#555' },
          section: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        },
      };

      // Chân ký của người duyệt
      docDefinition.content.push({
        columns: [
          { text: '' },
          {
            text: `NGƯỜI DUYỆT BÁO CÁO\n\n\n\n( Ký và ghi rõ họ tên )`,
            alignment: 'center',
          },
        ],
        margin: [0, 50, 0, 0],
      });

      // -----------------------------------------
      // 3. GENERATE PDF BUFFER
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: any = [];
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


  private translateReportType(type: string): string {
    switch (type) {
      case REPORT_TYPE.NORMAL:
        return 'Bình thường';
      case REPORT_TYPE.ABNORMAL:
        return 'Bất thường';
      case REPORT_TYPE.FINAL:
        return 'Cuối cùng';
      default:
        return 'Khác';
    }
  }

  private translateSeverity(severity: string): string {
    switch (severity) {
      case 'LOW':
        return 'Thấp';
      case 'MEDIUM':
        return 'Trung bình';
      case 'HIGH':
        return 'Cao';
      default:
        return 'Khác';
    }
  }



}
