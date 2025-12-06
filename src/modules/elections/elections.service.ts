import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import removeVietnameseTones, {
  isValidateTimeline,
  formatDateDMYVN,
  getCurrentDateVN,
} from 'src/common/utils/format';
import {
  ElectionsParticipants,
  ElectionsParticipantsDocument,
} from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesDocument } from 'src/database/schemas/roles.schema';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { Voters, VotersDocument } from 'src/database/schemas/voters.schema';
import { Delegations, DelegationsDocument } from 'src/database/schemas/delegations.schema';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { BulkSaveDraftDto } from './dto/bulk-save-draft-dto';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { SystemConfig, SystemConfigDocument } from 'src/database/schemas/systemConfig.schema';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../mail/mail.service';
import { ResultsService } from '../results/results.service';

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
    @InjectModel(Voters.name)
    private readonly voterModel: Model<VotersDocument>,
    @InjectModel(Delegations.name)
    private readonly delegationModel: Model<DelegationsDocument>,
    @InjectModel(ElectionEntities.name)
    private readonly electionEntitiesModel: Model<ElectionEntities>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendees>,
    @InjectModel(SystemConfig.name)
    private readonly systemConfigModel: Model<SystemConfigDocument>,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    private readonly signatureService: SigningService,
    private readonly fileService: MinioService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly resultsService: ResultsService,
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

      //Kiểm tra xem số quyết định đã tồn tại hay Chưa
      if (createElection?.decisionNumber) {
        const decisionNumberExist = await this.electionsModel.exists({
          decisionNumber: createElection.decisionNumber,
        });
        if (decisionNumberExist) {
          throw new Error(MESSAGE.ELECTION_NUMBER_ALREADY_EXISTS);
        }
      }

      const createdAt = getCurrentDateVN();
      if (createElection?.endDate && createElection?.startDate) {
        //Kiểm tra ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày
        const endDate = new Date(createElection?.endDate);
        const minEnd = new Date(createdAt);
        minEnd.setDate(minEnd.getDate() + 20);

        if (endDate < minEnd) {
          throw new Error('Ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày');
        }

        //Kiểm tra ngày bắt đầu cuộc bầu cử và ngày kết thúc cuộc bầu cử phải nằm trong cùng 1 Ngày
        const startDate = new Date(createElection?.startDate);
        if (startDate.toDateString() !== endDate.toDateString()) {
          throw new Error('Ngày bắt đầu và ngày kết thúc cuộc bầu cử phải nằm trong cùng một ngày');
        }
        //  endDate > startDate (khác giờ)
        if (endDate <= startDate) {
          throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
        }
      }
      //Kiểm tra xem delegationEnd phải nhỏ hơn startDate ít nhất 10 Ngày
      if (createElection?.delegationEnd && createElection?.startDate) {
        const delegationEnd = new Date(createElection.delegationEnd);
        const startDate = new Date(createElection.startDate);
        const minStart = new Date(delegationEnd);
        minStart.setDate(minStart.getDate() + 10);
        if (startDate < minStart) {
          throw new Error(
            'Ngày kết thúc ủy quyền phải nhỏ hơn ngày bắt đầu cuộc bầu cử ít nhất 10 ngày',
          );
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
            throw new BadRequestException(
              'Thời gian ủy quyền phải trong khoảng thời gian của cuộc bầu cử',
            );
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
          _id: { $ne: new Types.ObjectId(id) },
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

      const createdAt = getCurrentDateVN();
      if (updateElection?.endDate && updateElection?.startDate) {
        //Kiểm tra ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày
        const endDate = new Date(updateElection?.endDate);
        const minEnd = new Date(createdAt);
        minEnd.setDate(minEnd.getDate() + 20);

        if (endDate < minEnd) {
          throw new Error('Ngày kết thúc phải lớn hơn ngày tạo ít nhất 20 ngày');
        }

        //Kiểm tra ngày bắt đầu cuộc bầu cử và ngày kết thúc cuộc bầu cử phải nằm trong cùng 1 Ngày
        const startDate = new Date(updateElection?.startDate);
        if (startDate.toDateString() !== endDate.toDateString()) {
          throw new Error('Ngày bắt đầu và ngày kết thúc cuộc bầu cử phải nằm trong cùng một ngày');
        }
        //  endDate > startDate (khác giờ)
        if (endDate <= startDate) {
          throw new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu');
        }
      }
      //Kiểm tra xem delegationEnd phải nhỏ hơn startDate ít nhất 10 Ngày
      if (updateElection?.delegationEnd && updateElection?.startDate) {
        const delegationEnd = new Date(updateElection.delegationEnd);
        const startDate = new Date(updateElection.startDate);
        const minStart = new Date(delegationEnd);
        minStart.setDate(minStart.getDate() + 10);
        if (startDate < minStart) {
          throw new Error(
            'Ngày kết thúc ủy quyền phải nhỏ hơn ngày bắt đầu cuộc bầu cử ít nhất 10 ngày',
          );
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
            throw new BadRequestException(
              'Thời gian ủy quyền phải trong khoảng thời gian của cuộc bầu cử',
            );
          }
        }
      }

      const election = await this.electionsModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          {
            ...updateElection,
            typeId: updateElection.typeId ? new Types.ObjectId(updateElection.typeId) : null,
            votingMethodId: updateElection.votingMethodId
              ? new Types.ObjectId(updateElection.votingMethodId)
              : null,
            thresholdId: updateElection.thresholdId
              ? new Types.ObjectId(updateElection.thresholdId)
              : null,
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
      // 1. Lấy các election trong khoảng thời gian
      const elections = await this.electionsModel
        .find({
          startDate: { $lt: endTime },
          endDate: { $gt: startTime },
        })
        .exec();

      const electionIds = elections.map((e) => e._id);

      // 2. Lấy tất cả participant trong các election này
      const electionParticipants = await this.electionParticipantsModel
        .find({
          electionId: { $in: electionIds },
        })
        .populate('userId')
        .exec();

      // 3. Lấy danh sách user bận
      const busyUserIds = electionParticipants.map((item) => item.userId._id);

      // 4. Lấy role ADMIN và PRESIDE
      const roles = await this.rolesModel
        .find({
          $or: [{ roleCode: USER_ROLE.ADMIN }, { roleCode: USER_ROLE.PRESIDE }],
        })
        .exec();
      const roleIds = roles.map((role) => role._id);

      // 5. Lấy user có sẵn
      let availableUsers = await this.userModel
        .find({
          _id: { $nin: busyUserIds },
          roleId: { $nin: roleIds },
        })
        .exec();

      const roleFilter = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER }).exec();
      if (!roleFilter) {
        throw new Error('Không tìm thấy role VOTER');
      }

      // 6. Lọc thêm user không có trong voters và không phải participant role VOTER
      const voterUsers = await this.voterModel.find({}).exec();
      const voterUserIds = voterUsers.map((v) => String(v.userId));

      const voterParticipants = await this.electionParticipantsModel
        .find({ roleId: roleFilter._id }) // nếu roleId là ObjectId của role VOTER, sửa tương ứng
        .exec();
      const voterParticipantIds = voterParticipants.map((p) => String(p.userId));

      availableUsers = availableUsers.filter(
        (u) =>
          !voterUserIds.includes(String(u._id)) && !voterParticipantIds.includes(String(u._id)),
      );

      return availableUsers;
    } catch (error) {
      throw error;
    }
  }

  async rejectElection(electionId: string, rejectReason: string) {
    try {
      // 1. Kiểm tra election có tồn tại không
      const election = await this.electionsModel.findById(new Types.ObjectId(electionId)).exec();

      if (!election) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Kiểm tra statusData phải là WAIT_APPROVAL
      if (election.statusData !== STATUS.WAIT_APPROVAL) {
        throw new BadRequestException('Chỉ có thể từ chối khi trạng thái là chờ duyệt chủ tọa!');
      }

      // 3. Cập nhật statusData thành REJECTED và lưu lý do từ chối
      election.statusData = STATUS.REJECTED;
      election.rejectReason = rejectReason;
      await election.save();

      // 4. Gửi thông báo cho người tạo election (nếu có)
      if (election.updatedBy) {
        // Có thể thêm notification service ở đây nếu cần
        await this.notificationService.notifyUser(
          String(election.updatedBy),
          `Cuộc bầu cử "${election.title}" đã bị từ chối. Lý do: ${rejectReason}`,
        );
      }

      return election;
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
      // 1. Kiểm tra election có tồn tại không
      const election = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId')
        .populate('createdBy', 'username fullName email position')
        .exec();

      if (!election) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Kiểm tra statusData phải là WAIT_APROVAL
      if (election.statusData !== STATUS.WAIT_APPROVAL) {
        throw new BadRequestException('Chỉ có thể ký duyệt khi trạng thái là chờ duyệt chủ tọa!');
      }

      // 3. Lấy tên công ty từ SystemConfig
      const companyConfig = await this.systemConfigModel
        .findOne({ configKey: 'COMPANY_NAME' })
        .exec();
      const companyName =
        companyConfig?.configValue?.name ||
        companyConfig?.configValue ||
        'CÔNG TY CỔ PHẦN PHÁT TRIỂN AVG';

      const title = election.title || 'Quyết định triệu tập và Chương trình họp Đại hội đồng cổ đông';

      // 4. Lấy thông tin meeting
      const meeting = await this.meetingsModel
        .findOne({ electionId: new Types.ObjectId(electionId) })
        .exec();

      // 5. Lấy danh sách participants để tạo chương trình họp
      const participants = await this.electionParticipantsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('userId', 'fullName position')
        .populate('roleId', 'roleName roleCode')
        .exec();

      // 6. Tạo PDF quyết định và chương trình họp
      const pdfFile = await this.generateElectionDecisionPdf(
        election,
        meeting,
        participants,
        companyName,
        title
      );

      // 7. Ký PDF
      const signFile = await this.signatureService.signPdfWithP12(
        pdfFile,
        p12File.buffer,
        password,
      );

      if (!signFile) {
        throw new NotFoundException('Ký file không thành công!');
      }

      // 8. Upload file đã ký
      const fileUpload = await this.fileService.uploadSignedPdf(
        FileType.SIGNED_DOCUMENT,
        userId,
        signFile,
      );

      // 9. Lưu document vào database
      const electionParticipant = await this.electionParticipantsModel
        .findOne({
          electionId: new Types.ObjectId(electionId),
          userId: new Types.ObjectId(userId),
        })
        .exec();

      let electionDocumentId: Types.ObjectId | null = null;
      if (fileUpload) {
        // Xóa document cũ nếu có
        const existingDocument = await this.electionDocumentsModel.findOne({
          electionId: new Types.ObjectId(electionId),
          type: FileType.SIGNED_DOCUMENT,
        });
        if (existingDocument) {
          await this.electionDocumentsModel.deleteOne({ _id: existingDocument._id }).exec();
        }

        // Tạo document mới
        const electionDocument = new this.electionDocumentsModel({
          electionId: new Types.ObjectId(electionId),
          preparedBy: electionParticipant?._id || null,
          title: 'Quyết định triệu tập và Chương trình họp Đại hội đồng cổ đông',
          type: FileType.SIGNED_DOCUMENT,
          fileUrl: fileUpload.key,
          status: STATUS.ACTIVE,
          createdBy: new Types.ObjectId(userId),
          createdAt: getCurrentDateVN(),
        });
        const savedDocument = await electionDocument.save();
        electionDocumentId = savedDocument._id as Types.ObjectId;
      }

      // 10. Cập nhật status election
      await this.electionsModel.updateOne(
        { _id: new Types.ObjectId(electionId) },
        { $set: { statusData: STATUS.APPROVED_SIGNED } },
      );

      // 11. Cập nhật status electionParticipants thành ACTIVE
      await this.electionParticipantsModel.updateMany(
        { electionId: new Types.ObjectId(electionId) },
        { $set: { status: STATUS.ACTIVE } },
      );

      // 12. Cập nhật status voters thành ACTIVE
      await this.voterModel.updateMany(
        { electionId: new Types.ObjectId(electionId) },
        { $set: { status: STATUS.ACTIVE } },
      );

      // 13. Cập nhật status votingRights thành ACTIVE
      await this.votingRightsModel.updateMany(
        { electionId: new Types.ObjectId(electionId) },
        { $set: { status: STATUS.ACTIVE } },
      );

      // 14. Cập nhật status electionEntities thành ACTIVE
      await this.electionEntitiesModel.updateMany(
        { electionId: new Types.ObjectId(electionId) },
        { $set: { status: STATUS.ACTIVE } },
      );

      // 15. Cập nhật status electionDocuments thành ACTIVE (trừ document vừa tạo)
      if (electionDocumentId) {
        await this.electionDocumentsModel.updateMany(
          {
            electionId: new Types.ObjectId(electionId),
            _id: { $ne: electionDocumentId },
          },
          { $set: { status: STATUS.ACTIVE } },
        );
      } else {
        await this.electionDocumentsModel.updateMany(
          { electionId: new Types.ObjectId(electionId) },
          { $set: { status: STATUS.ACTIVE } },
        );
      }

      if (election.updatedBy) {
        await this.notificationService.notifyUser(
          String(election.updatedBy),
          `Cuộc bầu cử "${election.title}" đã được duyệt và ký thành công!`,
        );
      }

      // 16. Gửi email thông báo cho tất cả participants
      try {
        const participantsWithDetails = await this.electionParticipantsModel
          .find({ electionId: new Types.ObjectId(electionId) })
          .populate('userId', 'email fullName')
          .populate('roleId', 'roleName')
          .exec();

        const meetingDate = election.startDate || null;
        const meetingLocation = meeting?.location || null;

        for (const participant of participantsWithDetails) {
          const user = participant.userId as any;
          const role = participant.roleId as any;

          if (user && user.email && role) {
            await this.mailService.sendElectionApprovalEmail(
              user.email,
              user.fullName || 'Thành viên',
              election.title,
              role.roleName || 'Thành viên',
              meetingDate || undefined,
              meetingLocation || undefined,
            );
          }
        }
      } catch (emailError) {
        // Log lỗi nhưng không throw để không ảnh hưởng đến quá trình duyệt
        console.error('Error sending approval emails:', emailError);
      }

      // 17. Gửi thông báo socket đến tất cả participants sau khi duyệt
      try {
        const participantsWithDetails = await this.electionParticipantsModel
          .find({ electionId: new Types.ObjectId(electionId) })
          .populate('userId', '_id email fullName')
          .populate('roleId', 'roleName')
          .exec();

        for (const participant of participantsWithDetails) {
          const user = participant.userId as any;
          if (user && user._id) {
            await this.notificationService.notifyUser(
              String(user._id),
              `Cuộc bầu cử "${election.title}" đã được chủ tọa duyệt và ký thành công!`,
            );
          }
        }
      } catch (socketError) {
        // Log lỗi nhưng không throw để không ảnh hưởng đến quá trình duyệt
        console.error('Error sending socket notifications:', socketError);
      }

      return fileUpload;
    } catch (error) {
      throw error;
    }
  }

  async previewElectionDecisionPdf(electionId: string) {
    try {
      // 1. Kiểm tra election có tồn tại không
      const election = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId')
        .populate('createdBy', 'username fullName email position')
        .exec();

      if (!election) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Lấy tên công ty từ SystemConfig
      const companyConfig = await this.systemConfigModel
        .findOne({ configKey: 'COMPANY_NAME' })
        .exec();
      const companyName =
        companyConfig?.configValue?.name ||
        companyConfig?.configValue ||
        'CÔNG TY CỔ PHẦN PHÁT TRIỂN AVG';

      const title = election.title || 'Quyết định triệu tập và Chương trình họp Đại hội đồng cổ đông';

      // 3. Lấy thông tin meeting
      const meeting = await this.meetingsModel
        .findOne({ electionId: new Types.ObjectId(electionId) })
        .exec();

      // 4. Lấy danh sách participants để tạo chương trình họp
      const participants = await this.electionParticipantsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('userId', 'fullName position')
        .populate('roleId', 'roleName roleCode')
        .exec();

      // 5. Tạo PDF quyết định và chương trình họp
      const pdfFile = await this.generateElectionDecisionPdf(
        election,
        meeting,
        participants,
        companyName,
          title
      );

      return pdfFile;
    } catch (error) {
      throw error;
    }
  }

  async generateElectionDecisionPdf(
    election: any,
    meeting: any,
    participants: any[],
    companyName: string,
    title?: string
  ): Promise<Buffer> {
    try {
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
        },
      };
      const printer = new PdfPrinter(fonts);

      const currentDate = getCurrentDateVN();
      const formattedDate = formatDateDMYVN(currentDate);
      const dateParts = formattedDate.split('/');
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];
      const monthNames = [
        'tháng 01',
        'tháng 02',
        'tháng 03',
        'tháng 04',
        'tháng 05',
        'tháng 06',
        'tháng 07',
        'tháng 08',
        'tháng 09',
        'tháng 10',
        'tháng 11',
        'tháng 12',
      ];
      const monthName = monthNames[parseInt(month) - 1];

      // Tạo số quyết định
      const decisionNumber = election.decisionNumber || `Số: ${currentDate.getFullYear()}/QĐ-HĐQT`;

      // Format ngày họp
      const meetingDate = election.startDate ? new Date(election.startDate) : currentDate;
      const meetingDateFormatted = formatDateDMYVN(meetingDate);
      const meetingDateParts = meetingDateFormatted.split('/');
      const meetingDay = meetingDateParts[0];
      const meetingMonth = meetingDateParts[1];
      const meetingYear = meetingDateParts[2];
      const meetingMonthName = monthNames[parseInt(meetingMonth) - 1];

      // Format giờ họp
      const meetingTime = meetingDate.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const meetingHour = meetingTime.split(':')[0];
      const meetingMinute = meetingTime.split(':')[1];

      // Lấy thứ trong tuần
      const dayNames = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayOfWeek = dayNames[meetingDate.getDay()];

      // Địa điểm
      const location = meeting?.location || election.location || 'Trụ sở Công ty';

      // Tạo chương trình họp từ timeline hoặc mặc định
      const timeline = election.timeline || {};
      const programItems: any[] = [];

      // Chương trình mặc định dựa trên template
      programItems.push({
        time: '7h30 - 8h30',
        content:
          'Đón tiếp đại biểu, cổ đông\nKiểm tra tư cách cổ đông, lập danh sách các cổ đông có mặt',
        presider: 'Ban tổ chức và Ban kiểm tra tư cách cổ đông',
      });
      programItems.push({
        time: '8h30 - 8h40',
        content: 'Ổn định tổ chức chuẩn bị Đại hội\nGiới thiệu đại biểu, cổ đông',
        presider: 'Ban tổ chức',
      });
      programItems.push({
        time: '8h40 - 8h50',
        content: 'Báo cáo kết quả kiểm tra tư cách cổ đông tham dự Đại hội',
        presider: 'Ban kiểm tra tư cách cổ đông',
      });
      programItems.push({
        time: '8h50 - 8h55',
        content: 'Giới thiệu Chủ tọa Đại hội. Chủ tọa Đại hội chỉ định Đoàn Chủ tịch, Đoàn thư ký',
        presider: 'Ban tổ chức',
      });
      programItems.push({
        time: '8h55 - 9h25',
        content:
          'Thông qua danh sách Ban kiểm phiếu; Chương trình đại hội; Quy chế tổ chức Đại hội đồng cổ đông bất thường năm 2023; Quy chế bầu cử bổ sung Thành viên Hội đồng quản trị',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '9h25 - 9h35',
        content: 'HĐQT báo cáo Tờ trình thay đổi ngành nghề đăng ký kinh doanh',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '9h35 - 9h40',
        content: 'HĐQT báo cáo Tờ trình miễn nhiệm thành viên HĐQT',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '9h40 - 9h45',
        content: 'HĐQT báo cáo Tờ trình bầu bổ sung thành viên HĐQT',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '9h45 - 10h15',
        content: 'Thảo luận và biểu quyết thông qua tờ trình tại Đại hội',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '10h15 - 10h25',
        content: 'Nghỉ giải lao',
        presider: '',
      });
      programItems.push({
        time: '10h25 - 10h35',
        content: 'Công bố kết quả kiểm phiếu biểu quyết các tờ trình',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '10h35 - 10h45',
        content: 'Đại hội tiến hành bầu cử thành viên HĐQT',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '10h45 - 10h50',
        content: 'Công bố kết quả bầu cử',
        presider: 'Ban Kiểm phiếu',
      });
      programItems.push({
        time: '10h50 - 11h00',
        content: 'Thông qua Biên bản và Nghị quyết Đại hội',
        presider: 'Đoàn chủ tịch',
      });
      programItems.push({
        time: '11h00',
        content: 'Tuyên bố bế mạc Đại hội',
        presider: 'Thư ký Đại hội và Đoàn chủ tịch',
      });

      const docDefinition: any = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [40, 60, 40, 60],
        content: [
          // Header hai cột
          {
            columns: [
              {
                stack: [
                  {
                    text: companyName.toUpperCase(),
                    bold: true,
                    fontSize: 12,
                    margin: [0, 5, 0, 0],
                    alignment: 'center',
                  },
                  { text: decisionNumber, fontSize: 10, margin: [0, 5, 0, 0], alignment: 'center' },
                ],
                width: '50%',
              },
              {
                stack: [
                  {
                    text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                    bold: true,
                    fontSize: 12,
                    alignment: 'center',
                    margin: [0, 5, 0, 0],
                  },
                  {
                    text: 'ĐỘC LẬP - TỰ DO - HẠNH PHÚC',
                    bold: true,
                    fontSize: 12,
                    alignment: 'center',
                    margin: [0, 5, 0, 0],
                  },
                ],
                width: '50%',
              },
            ],
            columnGap: 10,
            margin: [0, 0, 0, 20],
          },
          {
            text: `Hà Nội, ngày ${day} ${monthName} năm ${year}`,
            alignment: 'right',
            margin: [0, 0, 0, 20],
          },
          // Tiêu đề QUYẾT ĐỊNH
          {
            text: 'QUYẾT ĐỊNH',
            bold: true,
            fontSize: 16,
            alignment: 'center',
            margin: [0, 0, 0, 10],
          },
          {
            text: title || 'Về việc triệu tập Đại hội đồng cổ đông bất thường năm 2023',
            alignment: 'center',
            margin: [0, 0, 0, 10],
          },
          {
            text: 'HỘI ĐỒNG QUẢN TRỊ',
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 20],
          },
          {
            text: companyName.toUpperCase(),
            bold: true,
            alignment: 'center',
            margin: [0, 0, 0, 30],
          },
          // Căn cứ
          {
            text: 'Căn cứ Luật Doanh nghiệp số 59/2020/QH14;',
            margin: [0, 0, 0, 5],
          },
          {
            text: `Căn cứ Điều lệ ${companyName} được ban hành theo Quyết định số 727/QĐ-HĐQT ngày 10/5/2023;`,
            margin: [0, 0, 0, 5],
          },
          {
            text: 'Căn cứ Quy chế nội bộ về quản trị được ban hành theo Quyết định số 729/QĐ-HĐQT ngày 10/5/2023;',
            margin: [0, 0, 0, 5],
          },
          {
            text: `Căn cứ Nghị quyết số 1497/NQ-HĐQT ngày 10/10/2023 của Hội đồng quản trị Công ty về việc triệu tập Đại hội đồng cổ đông bất thường năm 2023;`,
            margin: [0, 0, 0, 5],
          },
          {
            text: 'Căn cứ danh sách cổ đông được Tổng công ty Lưu ký và Bù trừ chứng khoán Việt Nam chốt ngày 31/10/2023.',
            margin: [0, 0, 0, 20],
          },
          // QUYẾT ĐỊNH
          {
            text: 'QUYẾT ĐỊNH:',
            bold: true,
            margin: [0, 0, 0, 10],
          },
          {
            text: 'Điều 1. Triệu tập Đại hội đồng cổ đông bất thường 2023 của Công ty Cổ phần Phát triển Điện lực Việt Nam, chi tiết như sau:',
            margin: [0, 0, 0, 10],
          },
          {
            ol: [
              `Thời gian: ${meetingHour} giờ ${meetingMinute} phút, ngày ${meetingDay} ${meetingMonthName} năm ${meetingYear} (${dayOfWeek});`,
              `Địa điểm: ${location};`,
              'Hình thức tổ chức Đại hội: Đại hội trực tiếp',
              'Nội dung Đại hội: Được đính kèm theo Quyết định này;',
              'Thành phần và thời điểm chốt danh sách cổ đông: Tất cả các cổ đông sở hữu cổ phần của Công ty Cổ phần Phát triển Điện lực Việt Nam có tên trong danh sách do Tổng công ty Lưu ký và Bù trừ chứng khoán Việt Nam chốt ngày 31/10/2023 hoặc những người được ủy quyền hợp lệ.',
            ],
            margin: [20, 0, 0, 10],
          },
          {
            text: 'Điều 2. Các thành viên HĐQT, Tổng giám đốc Công ty, các đơn vị có liên quan và các cổ đông của Công ty cổ phần Phát triển Điện lực Việt Nam chịu trách nhiệm thi hành Quyết định này./.',
            margin: [0, 0, 0, 30],
          },
          // Nơi nhận
          {
            text: 'Nơi nhận:',
            bold: true,
            margin: [0, 0, 0, 5],
          },
          {
            text: '- Như điều 2;',
            margin: [0, 0, 0, 5],
          },
          {
            text: '- PTH (đăng Web Cty);',
            margin: [0, 0, 0, 5],
          },
          {
            text: '- Lưu: VT, VPHDQT.',
            margin: [0, 0, 0, 30],
          },
          // Chữ ký
          {
            columns: [
              { text: '' },
              {
                stack: [
                  {
                    text: 'TM. HỘI ĐỒNG QUẢN TRỊ',
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                  },
                  {
                    text: 'CHỦ TỊCH',
                    bold: true,
                    alignment: 'center',
                    margin: [0, 50, 0, 0],
                  },
                ],
                width: 'auto',
              },
            ],
            margin: [0, 0, 0, 30],
          },
          // Trang mới - Chương trình họp
          { text: '', pageBreak: 'before' },
          {
            text: 'CHƯƠNG TRÌNH HỌP ĐẠI HỘI CỔ ĐÔNG BẤT THƯỜNG NĂM 2023',
            bold: true,
            fontSize: 14,
            alignment: 'center',
            margin: [0, 0, 0, 5],
          },
          {
            text: companyName.toUpperCase(),
            bold: true,
            fontSize: 12,
            alignment: 'center',
            margin: [0, 0, 0, 20],
          },
          // Bảng chương trình
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto'],
              body: [
                [
                  { text: 'Thời gian', style: 'tableHeader', bold: true, alignment: 'center' },
                  { text: 'Nội dung', style: 'tableHeader', bold: true, alignment: 'center' },
                  { text: 'Chủ trì', style: 'tableHeader', bold: true, alignment: 'center' },
                ],
                ...programItems.map((item) => [
                  { text: item.time, alignment: 'center' },
                  { text: item.content },
                  { text: item.presider },
                ]),
              ],
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
            margin: [0, 0, 0, 20],
          },
        ],
        styles: {
          tableHeader: {
            bold: true,
            fontSize: 11,
            color: 'black',
          },
        },
        defaultStyle: {
          font: 'Roboto',
          fontSize: 11,
        },
      };

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

  async getUserIsVoter() {
    const now = getCurrentDateVN();

    const roleVoter = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
    if (!roleVoter) throw new Error('Không tìm thấy role VOTER');

    const roleFilter = await this.rolesModel.findOne({ roleCode: USER_ROLE.USER });
    if (!roleFilter) throw new Error('Không tìm thấy role USER');

    const users = await this.userModel.find({ roleId: roleFilter._id }).lean();

    // Kiểm tra xem có bất kỳ participant với role VOTER hoặc voter nào trong hệ thống không (khởi tạo lần đầu)
    // Chỉ kiểm tra participant có role VOTER, không phải tất cả participant (có thể có participant role thư ký)
    const hasAnyVoterParticipant = await this.electionParticipantsModel.exists({
      roleId: roleVoter._id,
    });
    const hasAnyVoter = await this.voterModel.exists({});

    // Nếu không có participant với role VOTER và không có voter nào (khởi tạo lần đầu), trả về tất cả users
    if (!hasAnyVoterParticipant && !hasAnyVoter) {
      return users.map((user) => ({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      }));
    }

    const result: any[] = [];

    for (const user of users) {
      const userId = user._id;

      // Lấy tất cả delegation liên quan
      const delegations = await this.delegationModel
        .find({
          delegationType: 'LONG_TERM',
          status: 'SIGNED',
          $or: [{ delegateId: userId }, { delegatorId: userId }],
        })
        .sort({ createdAt: -1 })
        .lean();

      const delegationsWithStatus = delegations.map((d) => ({
        ...d,
        isActive: d.endDate > now,
        hasExpired: d.endDate <= now,
      }));

      // --- Delegations còn hạn ---
      const activeDelegations = delegationsWithStatus.filter((d) => d.isActive);

      // User có đang là delegator còn hạn không?
      const isDelegatorActive = activeDelegations.some(
        (d) => String(d.delegatorId) === String(userId),
      );

      // Delegate hợp lệ nếu còn hạn
      const isDelegateValid = activeDelegations.some(
        (d) => String(d.delegateId) === String(userId),
      );

      // --- Delegations hết hạn: chỉ để loại delegateId cũ ---
      const expiredDelegations = delegationsWithStatus.filter((d) => d.hasExpired);
      const expiredDelegateIds = expiredDelegations.map((d) => String(d.delegateId));

      // Kiểm tra voter table
      let isVoterTable = false;
      if (!isDelegatorActive && !expiredDelegateIds.includes(String(userId))) {
        const voterRecord = await this.voterModel.findOne({
          userId,
          status: { $ne: 'AUTHORIZED' },
        });
        isVoterTable = !!voterRecord;
      }

      // Kiểm tra participant
      let isParticipant = false;
      if (!isDelegatorActive && !expiredDelegateIds.includes(String(userId))) {
        const participant = await this.electionParticipantsModel.findOne({
          userId,
          roleId: roleVoter._id,
        });
        isParticipant = !!participant;
      }

      // Nếu thỏa 1 trong 3 → push result
      if (isDelegateValid || isVoterTable || isParticipant) {
        result.push({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
        });
      }
    }

    return result;
  }

  async bulkSaveDraft(dto: BulkSaveDraftDto, userId: string) {
    // Track các records đã tạo mới để rollback nếu có lỗi
    let originalElection: any = null;
    const newRecords = {
      electionEntityIds: [] as Types.ObjectId[],
      voterIds: [] as Types.ObjectId[],
      votingRightIds: [] as Types.ObjectId[],
      participantIds: [] as Types.ObjectId[],
      documentIds: [] as Types.ObjectId[],
      meetingId: null as Types.ObjectId | null,
      attendeeIds: [] as Types.ObjectId[],
    };

    try {
      const {
        electionId,
        meetingInfo,
        electionEntities,
        electionDocuments,
        voters,
        participants,
        isSubmitForApproval,
      } = dto;

      if (isSubmitForApproval) {
        if (!electionEntities || !Array.isArray(electionEntities) || electionEntities.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một ứng viên/bầu chọn trước khi gửi duyệt');
        }

        // Kiểm tra nếu hình thức bầu cử là YES_NO_ABSTAIN thì chỉ cho phép 1 bản ghi
        if (meetingInfo.method) {
          const votingMethod = await this.votingMethodModel.findById(new Types.ObjectId(meetingInfo.method)).exec();
          if (votingMethod && votingMethod.methodCode === 'YES_NO_ABSTAIN') {
            if (electionEntities.length > 1) {
              throw new Error('Hình thức bầu cử YES-NO chỉ cho phép 1 nội dung bầu chọn. Vui lòng chỉ nhập 1 bản ghi.');
            }
          }
        }

        if (!electionDocuments || !Array.isArray(electionDocuments) || electionDocuments.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một tài liệu trước khi gửi duyệt');
        }
        if (!voters || !Array.isArray(voters) || voters.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một cử tri trước khi gửi duyệt');
        }
        if (!participants || !Array.isArray(participants) || participants.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một thành viên tổ chức trước khi gửi duyệt');
        }
      }

      // Lưu trạng thái ban đầu của election trước khi thay đổi
      originalElection = await this.electionsModel.findById(new Types.ObjectId(electionId)).lean();
      if (!originalElection) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const typeId = meetingInfo.type as string;
      const thresholdId = meetingInfo.threshold as string;

      const electionUpdate: any = {
        typeId: typeId ? new Types.ObjectId(typeId) : null,
        votingMethodId: meetingInfo.method ? new Types.ObjectId(meetingInfo.method) : null,
        thresholdId: thresholdId ? new Types.ObjectId(thresholdId) : null,
        delegationStart: meetingInfo.authorizationStart
          ? new Date(meetingInfo.authorizationStart)
          : null,
        delegationEnd: meetingInfo.authorizationEnd ? new Date(meetingInfo.authorizationEnd) : null,
      };

      if (isSubmitForApproval) {
        electionUpdate.statusData = STATUS.WAIT_APPROVAL;
        electionUpdate.updatedBy = new Types.ObjectId(userId);
      }

      const updatedElection = await this.electionsModel.findByIdAndUpdate(
        new Types.ObjectId(electionId),
        electionUpdate,
        { new: true },
      );

      if (!updatedElection) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // Gửi thông báo socket đến chủ tọa (createdBy) khi thư ký gửi duyệt
      if (isSubmitForApproval) {
        try {
          // Lấy lại election với populated createdBy để lấy thông tin chủ tọa
          const electionWithPreside = await this.electionsModel
            .findById(new Types.ObjectId(electionId))
            .populate('createdBy', '_id')
            .exec();

          if (electionWithPreside && electionWithPreside.createdBy) {
            const presideId = (electionWithPreside.createdBy as any)?._id || electionWithPreside.createdBy;
            if (presideId) {
              await this.notificationService.notifyUser(
                String(presideId),
                `Cuộc bầu cử "${updatedElection.title || updatedElection.decisionName}" đã được thư ký gửi duyệt. Vui lòng kiểm tra và duyệt.`,
              );
            }
          }
        } catch (notifyError) {
          // Log lỗi nhưng không throw để không ảnh hưởng đến quá trình gửi duyệt
          console.error('Error sending socket notification to preside:', notifyError);
        }
      }

      // Kiểm tra nếu hình thức bầu cử là YES_NO_ABSTAIN thì chỉ cho phép 1 bản ghi
      if (electionEntities && Array.isArray(electionEntities)) {
        // Lấy voting method để kiểm tra methodCode
        let votingMethodCode: string | null = null;
        if (electionUpdate.votingMethodId) {
          const votingMethod = await this.votingMethodModel.findById(electionUpdate.votingMethodId).exec();
          votingMethodCode = votingMethod?.methodCode || null;
        } else if (originalElection?.votingMethodId) {
          const votingMethod = await this.votingMethodModel.findById(originalElection.votingMethodId).exec();
          votingMethodCode = votingMethod?.methodCode || null;
        }

        // Nếu là YES_NO_ABSTAIN, chỉ cho phép 1 electionEntity
        if (votingMethodCode === 'YES_NO_ABSTAIN' && electionEntities.length > 1) {
          throw new Error('Hình thức bầu cử YES-NO chỉ cho phép 1 nội dung bầu chọn. Vui lòng chỉ nhập 1 bản ghi.');
        }

        const candidateIds = electionEntities
          .filter((c: any) => c._id)
          .map((c: any) => new Types.ObjectId(c._id));

        if (candidateIds.length > 0) {
          await this.electionEntitiesModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            _id: { $nin: candidateIds },
          });
        } else {
          await this.electionEntitiesModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
          });
        }

        for (const candidate of electionEntities) {

          if (candidate._id) {
            const updateData = {
              title: candidate.title,
              description: candidate.description,
              metaData: candidate.metaData,
              fileUrl: candidate.fileUrl || null,
              electionTypeId: new Types.ObjectId(typeId),
              updatedBy: new Types.ObjectId(userId),
            };
            await this.electionEntitiesModel.findByIdAndUpdate(
              new Types.ObjectId(candidate._id),
              updateData,
              { new: true },
            );
          } else {
            const createData = {
              electionId: new Types.ObjectId(electionId),
              electionTypeId: new Types.ObjectId(typeId),
              title: candidate.title,
              description: candidate.description,
              metaData: candidate.metaData,
              fileUrl: candidate.fileUrl || null,
              status: 'PENDING',
              createdBy: new Types.ObjectId(userId),
            };
            const createdEntity = await this.electionEntitiesModel.create(createData);
            newRecords.electionEntityIds.push(createdEntity._id as Types.ObjectId);
          }
        }
      } else {
        await this.electionEntitiesModel.deleteMany({
          electionId: new Types.ObjectId(electionId),
        });
      }

      if (voters && Array.isArray(voters)) {
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });

        const voterUserIds = voters.map((v: any) => new Types.ObjectId(v.userId));

        if (voterRole && voterUserIds.length > 0) {
          await this.votingRightsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            voterId: {
              $in: await this.voterModel
                .find({
                  electionId: new Types.ObjectId(electionId),
                  userId: { $nin: voterUserIds },
                })
                .distinct('_id'),
            },
          })
          await this.voterModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            userId: { $nin: voterUserIds },
          })
          await this.electionParticipantsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
            userId: { $nin: voterUserIds },
          });
        } else if (voterRole) {
          await this.electionParticipantsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
          });
        }

        for (const voterItem of voters) {
          let voter;
          if (voterItem._id) {
            voter = await this.voterModel.findByIdAndUpdate(
              new Types.ObjectId(voterItem._id),
              {
                userId: new Types.ObjectId(voterItem.userId),
                updatedBy: new Types.ObjectId(userId),
              },
              { new: true },
            );
          } else {
            // Kiểm tra xem đã có voter với userId này chưa (tránh duplicate)
            const existingVoter = await this.voterModel.findOne({
              electionId: new Types.ObjectId(electionId),
              userId: new Types.ObjectId(voterItem.userId),
            });

            if (existingVoter) {
              // Nếu đã có, dùng voter hiện có
              voter = existingVoter;
            } else {
              // Create new voter
              const createdVoter = await this.voterModel.create({
                electionId: new Types.ObjectId(electionId),
                userId: new Types.ObjectId(voterItem.userId),
                eligible: true,
                status: 'PENDING',
                createdBy: new Types.ObjectId(userId),
              });
              voter = createdVoter;
              newRecords.voterIds.push(voter._id as Types.ObjectId);
            }
          }

          if (voter && voterRole) {
            const existingParticipant = await this.electionParticipantsModel.findOne({
              electionId: new Types.ObjectId(electionId),
              userId: new Types.ObjectId(voterItem.userId),
              roleId: voterRole._id,
            });

            if (existingParticipant) {
              await this.electionParticipantsModel.findByIdAndUpdate(
                existingParticipant._id,
                {
                  position: (await this.userModel.findById(new Types.ObjectId(voterItem.userId)))?.position || 'Voter',
                  updatedBy: new Types.ObjectId(userId),
                  status: STATUS.PENDING,
                },
                { new: true },
              );
            } else {
              const userInfo = await this.userModel.findById(new Types.ObjectId(voterItem.userId));
              const createdParticipant = await this.electionParticipantsModel.create({
                electionId: new Types.ObjectId(electionId),
                userId: new Types.ObjectId(voterItem.userId),
                roleId: voterRole._id,
                position: userInfo?.position || 'Voter',
                status: STATUS.PENDING,
                createdBy: new Types.ObjectId(userId),
              });
              newRecords.participantIds.push(createdParticipant._id as Types.ObjectId);
            }
          }

          if (voter && voterItem.percentage !== undefined) {
            const existingVotingRight = await this.votingRightsModel.findOne({
              electionId: new Types.ObjectId(electionId),
              voterId: voter._id,
            });

            const votes = await this.calculateVotes(voterItem.percentage);

            if (existingVotingRight) {
              await this.votingRightsModel.findByIdAndUpdate(existingVotingRight._id, {
                shares: voterItem.percentage,
                votes: votes,
                updatedBy: new Types.ObjectId(userId),
              });
            } else {
              const createdVotingRight = await this.votingRightsModel.create({
                electionId: new Types.ObjectId(electionId),
                voterId: voter._id,
                shares: voterItem.percentage,
                votes: votes,
                status: 'PENDING',
                createdBy: new Types.ObjectId(userId),
              });
              newRecords.votingRightIds.push(createdVotingRight._id as Types.ObjectId);
            }
          }
        }
      } else {
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          await this.electionParticipantsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
          });
        }
      }

      if (participants && Array.isArray(participants)) {
        for (const participantItem of participants) {
          if (participantItem._id) {
            await this.electionParticipantsModel.findByIdAndUpdate(
              new Types.ObjectId(participantItem._id),
              {
                userId: new Types.ObjectId(participantItem.userId),
                roleId: new Types.ObjectId(participantItem.roleId),
                position: participantItem.position,
                updatedBy: new Types.ObjectId(userId),
              },
              { new: true },
            );
          } else {
            const createdParticipant = await this.electionParticipantsModel.create({
              electionId: new Types.ObjectId(electionId),
              userId: new Types.ObjectId(participantItem.userId),
              roleId: new Types.ObjectId(participantItem.roleId),
              position: participantItem.position,
              createdBy: new Types.ObjectId(userId),
            });
            newRecords.participantIds.push(createdParticipant._id as Types.ObjectId);
          }
        }
      }

      if (electionDocuments && Array.isArray(electionDocuments)) {
        for (const docItem of electionDocuments) {
          if (docItem._id) {
            await this.electionDocumentsModel.findByIdAndUpdate(
              new Types.ObjectId(docItem._id),
              {
                title: docItem.title,
                content: docItem.content,
                fileUrl: docItem.fileUrl,
                type: FileType.ELECTION_DOCUMENT_IMPORTANT,
                remarks: docItem.remarks,
                updatedBy: new Types.ObjectId(userId),
              },
              { new: true },
            );
          } else {
            // Create new
            const createdDocument = await this.electionDocumentsModel.create({
              electionId: new Types.ObjectId(electionId),
              preparedBy: new Types.ObjectId(userId),
              title: docItem.title,
              content: docItem.content,
              fileUrl: docItem.fileUrl,
              type: FileType.ELECTION_DOCUMENT_IMPORTANT,
              status: 'PENDING',
              remarks: docItem.remarks,
              createdBy: new Types.ObjectId(userId),
            });
            newRecords.documentIds.push(createdDocument._id as Types.ObjectId);
          }
        }
      }

      // 7. Xử lý Meeting
      let meeting;
      const existingMeeting = await this.meetingsModel.findOne({
        electionId: new Types.ObjectId(electionId),
      });

      if (existingMeeting) {
        meeting = await this.meetingsModel.findByIdAndUpdate(
          existingMeeting._id,
          {
            location: meetingInfo.location,
            updatedBy: new Types.ObjectId(userId),
          },
          { new: true },
        );
      } else {
        const createdMeeting = await this.meetingsModel.create({
          title: `Cuộc họp ${updatedElection.decisionName || updatedElection.title}`,
          electionId: new Types.ObjectId(electionId),
          location: meetingInfo.location,
          meetingDate: updatedElection.startDate,
          status: 'PENDING',
          createdBy: new Types.ObjectId(userId),
        });
        meeting = createdMeeting;
        newRecords.meetingId = meeting._id as Types.ObjectId;
      }

      if (meeting) {
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          const voterParticipants = await this.electionParticipantsModel.find({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
          }).exec();

          await this.meetingAttendeesModel.deleteMany({
            meetingId: meeting._id,
          });

          for (const voterParticipant of voterParticipants) {
            const existingAttendee = await this.meetingAttendeesModel.findOne({
              meetingId: meeting._id,
              participantId: voterParticipant._id,
            });

            if (!existingAttendee) {
              const createdAttendee = await this.meetingAttendeesModel.create({
                meetingId: meeting._id,
                participantId: voterParticipant._id,
                checkInTime: meeting.meetingDate || updatedElection.startDate,
                attended: false,
                createdBy: new Types.ObjectId(userId),
              });
              newRecords.attendeeIds.push(createdAttendee._id as Types.ObjectId);
            }
          }
        }
      }

      return {
        success: true,
        message: isSubmitForApproval ? 'Gửi duyệt thành công' : 'Lưu nháp thành công',
      };
    } catch (error) {
      // ROLLBACK: Nếu có lỗi, xóa các records đã tạo mới và restore lại trạng thái ban đầu
      console.error('❌ Lỗi xảy ra, bắt đầu rollback...', error);

      try {
        // 1. Xóa các meeting attendees đã tạo mới
        if (newRecords.attendeeIds.length > 0) {
          await this.meetingAttendeesModel.deleteMany({
            _id: { $in: newRecords.attendeeIds },
          });
          console.log(`✅ Đã xóa ${newRecords.attendeeIds.length} meeting attendees`);
        }

        // 2. Xóa meeting đã tạo mới
        if (newRecords.meetingId) {
          await this.meetingsModel.findByIdAndDelete(newRecords.meetingId);
          console.log(`✅ Đã xóa meeting ${newRecords.meetingId}`);
        }

        // 3. Xóa các documents đã tạo mới
        if (newRecords.documentIds.length > 0) {
          await this.electionDocumentsModel.deleteMany({
            _id: { $in: newRecords.documentIds },
          });
          console.log(`✅ Đã xóa ${newRecords.documentIds.length} documents`);
        }

        // 4. Xóa các participants đã tạo mới
        if (newRecords.participantIds.length > 0) {
          await this.electionParticipantsModel.deleteMany({
            _id: { $in: newRecords.participantIds },
          });
          console.log(`✅ Đã xóa ${newRecords.participantIds.length} participants`);
        }

        // 5. Xóa các voting rights đã tạo mới
        if (newRecords.votingRightIds.length > 0) {
          await this.votingRightsModel.deleteMany({
            _id: { $in: newRecords.votingRightIds },
          });
          console.log(`✅ Đã xóa ${newRecords.votingRightIds.length} voting rights`);
        }

        // 6. Xóa các voters đã tạo mới
        if (newRecords.voterIds.length > 0) {
          await this.voterModel.deleteMany({
            _id: { $in: newRecords.voterIds },
          });
          console.log(`✅ Đã xóa ${newRecords.voterIds.length} voters`);
        }

        // 7. Xóa các election entities đã tạo mới
        if (newRecords.electionEntityIds.length > 0) {
          await this.electionEntitiesModel.deleteMany({
            _id: { $in: newRecords.electionEntityIds },
          });
          console.log(`✅ Đã xóa ${newRecords.electionEntityIds.length} election entities`);
        }

        // 8. Restore lại trạng thái ban đầu của election
        if (originalElection) {
          await this.electionsModel.findByIdAndUpdate(
            new Types.ObjectId(dto.electionId),
            {
              typeId: originalElection.typeId,
              votingMethodId: originalElection.votingMethodId,
              thresholdId: originalElection.thresholdId,
              delegationStart: originalElection.delegationStart,
              delegationEnd: originalElection.delegationEnd,
              statusData: originalElection.statusData,
              updatedBy: originalElection.updatedBy,
            },
          );
          console.log(`✅ Đã rollback election ${dto.electionId} về trạng thái ban đầu`);
        }

        console.log('✅ Rollback hoàn tất');
      } catch (rollbackError) {
        console.error('❌ Lỗi khi rollback:', rollbackError);
        // Không throw rollback error để không che giấu error gốc
      }

      throw error;
    }
  }

  async getDraftData(electionId: string) {
    try {
      // Kiểm tra election có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 1. Lấy thông tin election với populated fields
      const election = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .lean()
        .exec();

      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Lấy meeting info từ election
      const typeId = election.typeId
        ? election.typeId instanceof Types.ObjectId
          ? election.typeId
          : new Types.ObjectId(election.typeId)
        : null;
      const methodId = election.votingMethodId
        ? election.votingMethodId instanceof Types.ObjectId
          ? election.votingMethodId
          : new Types.ObjectId(election.votingMethodId)
        : null;
      const thresholdId = election.thresholdId
        ? election.thresholdId instanceof Types.ObjectId
          ? election.thresholdId
          : new Types.ObjectId(election.thresholdId)
        : null;

      // Lấy type details
      let typeDetails: any = null;
      if (typeId) {
        typeDetails = await this.electionTypeModel.findById(typeId).lean().exec();
      }

      // Lấy method details
      let methodDetails: any = null;
      if (methodId) {
        methodDetails = await this.votingMethodModel.findById(methodId).lean().exec();
      }

      // Lấy threshold details
      let thresholdDetails: any = null;
      if (thresholdId) {
        thresholdDetails = await this.thresholdModel.findById(thresholdId).lean().exec();
      }

      // 3. Lấy meeting
      const meeting = await this.meetingsModel
        .findOne({ electionId: new Types.ObjectId(electionId) })
        .lean()
        .exec();

      // 4. Lấy election entities (candidates)
      const electionEntities = await this.electionEntitiesModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('createdBy', 'username fullName email')
        .lean()
        .exec();

      // 5. Lấy election documents
      const electionDocuments = await this.electionDocumentsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .lean()
        .exec();

      // 6. Lấy voters với user info và voting rights (percentage)
      const voters = await this.voterModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('userId', 'username fullName email phone position')
        .populate('createdBy', 'username fullName email')
        .lean()
        .exec();

      // Lấy voting rights để lấy percentage (shares)
      const votingRights = await this.votingRightsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .lean()
        .exec();

      // Map voters với percentage từ votingRights
      // Lọc bỏ duplicate voters (giữ lại voter có percentage, nếu không có thì giữ voter đầu tiên)
      const uniqueVotersMap = new Map<string, any>();

      voters.forEach((voter) => {
        const userId = voter.userId && typeof voter.userId === 'object' && '_id' in voter.userId
          ? String(voter.userId._id)
          : String(voter.userId);

        const votingRight = votingRights.find((vr) => String(vr.voterId) === String(voter._id));
        const percentage = votingRight ? votingRight.shares : null;

        // Nếu chưa có trong map, hoặc voter hiện tại có percentage mà voter trong map không có
        if (!uniqueVotersMap.has(userId) ||
          (percentage !== null && uniqueVotersMap.get(userId).percentage === null)) {
          const voterObj: any = { ...voter };
          // Khi populate với lean(), userId sẽ là object, cần extract _id
          if (voter.userId) {
            if (voter.userId && typeof voter.userId === 'object' && '_id' in voter.userId) {
              // Đã được populate, extract _id
              voterObj.userId = String(voter.userId._id);
              voterObj.user = voter.userId;
            } else {
              // Chưa được populate hoặc là string/ObjectId, convert sang string
              voterObj.userId = String(voter.userId);
            }
          }
          voterObj.percentage = percentage;
          uniqueVotersMap.set(userId, voterObj);
        }
      });

      // Chỉ trả về những voters có percentage (không null)
      const votersWithPercentage = Array.from(uniqueVotersMap.values()).filter(
        (v) => v.percentage !== null && v.percentage !== undefined
      );

      // 7. Lấy participants với user và role info
      const participantsRaw = await this.electionParticipantsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('userId', 'username fullName email phone position')
        .populate('roleId', 'roleName roleCode description')
        .populate('createdBy', 'username fullName email')
        .lean()
        .exec();

      // Map participants để có cả userId/roleId (string) và user/role (object)
      const participants = participantsRaw.map((participant) => {
        const participantObj: any = { ...participant };
        // Khi populate với lean(), userId và roleId sẽ là objects, cần extract _id
        if (participant.userId) {
          if (
            participant.userId &&
            typeof participant.userId === 'object' &&
            '_id' in participant.userId
          ) {
            // Đã được populate, extract _id
            participantObj.userId = String(participant.userId._id);
            participantObj.user = participant.userId;
          } else {
            // Chưa được populate hoặc là string/ObjectId, convert sang string
            participantObj.userId = String(participant.userId);
          }
        }
        if (participant.roleId) {
          if (
            participant.roleId &&
            typeof participant.roleId === 'object' &&
            '_id' in participant.roleId
          ) {
            // Đã được populate, extract _id
            participantObj.roleId = String(participant.roleId._id);
            participantObj.role = participant.roleId;
          } else {
            // Chưa được populate hoặc là string/ObjectId, convert sang string
            participantObj.roleId = String(participant.roleId);
          }
        }
        return participantObj;
      });

      // 8. Tạo meetingInfo object
      const meetingInfo = {
        type: typeId ? String(typeId) : null,
        typeDetails: typeDetails,
        method: methodId ? String(methodId) : null,
        methodDetails: methodDetails,
        threshold: thresholdId ? String(thresholdId) : null,
        thresholdDetails: thresholdDetails,
        authorizationStart: election.delegationStart || null,
        authorizationEnd: election.delegationEnd || null,
        location: meeting?.location || null,
      };

      // 9. Tạo election object (loại bỏ typeId, votingMethodId, thresholdId vì đã có trong meetingInfo)
      const { typeId: _, votingMethodId: __, thresholdId: ___, ...electionData } = election;

      // 10. Tạo response object
      const response = {
        electionId: electionId,
        meetingInfo: meetingInfo,
        electionEntities: electionEntities,
        electionDocuments: electionDocuments,
        voters: votersWithPercentage,
        participants: participants,
        election: electionData,
        meeting: meeting,
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  async endVotingStage(electionId: string, userId: string) {
    try {
      return await this.endStage(electionId, 'voting', userId);
    } catch (error) {
      throw error;
    }
  }

  async startStage(electionId: string, stage: string, userId: string) {
    try {
      const election = await this.electionsModel.findById(new Types.ObjectId(electionId)).exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const stageMap: Record<string, { timelineKey: string; statusData: string }> = {
        'checkin': { timelineKey: 'checkinAt', statusData: 'CHECKIN_STARTED' },
        'report': { timelineKey: 'reportAt', statusData: 'REPORT_STARTED' },
        'voting': { timelineKey: 'votingAt', statusData: 'VOTING_STARTED' },
        'result': { timelineKey: 'resultAnnouncedAt', statusData: 'RESULT_ANNOUNCED' },
        'closing': { timelineKey: 'closingAt', statusData: 'CLOSING_STARTED' },
      };

      const stageInfo = stageMap[stage.toLowerCase()];
      if (!stageInfo) {
        throw new Error('Giai đoạn không hợp lệ');
      }

      const timeline = election.timeline || {};
      timeline[stageInfo.timelineKey] = getCurrentDateVN();
      console.log('timeline[stageInfo.timelineKey]', timeline[stageInfo.timelineKey]);
      console.log('time now', getCurrentDateVN());

      // Cập nhật stages để lưu trạng thái giai đoạn
      const stages = election.stages || {};
      stages[stage.toLowerCase()] = 'STARTED';

      // Khi bắt đầu giai đoạn bỏ phiếu (stage = voting), cập nhật tất cả ballots thành ACTIVE
      // Thực hiện TRƯỚC khi update election để đảm bảo logic chạy đúng
      if (stage.toLowerCase() === 'voting') {
        try {
          const updateResult = await this.ballotsModel.updateMany(
            { electionId: new Types.ObjectId(electionId) },
            {
              $set: {
                status: STATUS.ACTIVE,
                updatedBy: userId ? new Types.ObjectId(userId) : null,
              }
            }
          );
          console.log(`[START VOTING STAGE] Đã cập nhật ${updateResult.modifiedCount} ballots của electionId ${electionId} thành ACTIVE`);
        } catch (error) {
          console.error('[START VOTING STAGE] Failed to update ballots status to ACTIVE:', error.message || error);
        }
      }

      // Chỉ cập nhật timeline và stages, không động vào statusData
      const updatedElection = await this.electionsModel
        .findByIdAndUpdate(
          new Types.ObjectId(electionId),
          {
            $set: {
              timeline: timeline,
              stages: stages,
              updatedBy: userId ? new Types.ObjectId(userId) : null,
            },
          },
          { new: true }
        )
        .exec();

      // Emit socket để thông báo realtime
      try {
        this.notificationService.transferDataRealTime(electionId, {
          type: 'stage-started',
          electionId: electionId,
          stage: stage,
          message: `Giai đoạn ${stage} đã bắt đầu`,
        });
      } catch (socketError) {
        console.error('Error emitting socket:', socketError);
      }

      return updatedElection;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentStage(electionId: string) {
    try {
      const election = await this.electionsModel.findById(new Types.ObjectId(electionId)).exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const timeline = election.timeline || {};
      const stages = election.stages || {};
      const now = getCurrentDateVN();

      // Xác định giai đoạn hiện tại
      let currentStage = 'not_started';
      let stageStartedAt: Date | null = null;
      let stageStatus = 'NOT_STARTED';

      // Kiểm tra từng giai đoạn theo thứ tự
      if (timeline.checkinAt && stages.checkin !== 'COMPLETED') {
        currentStage = 'checkin';
        stageStartedAt = timeline.checkinAt ?? null;
        stageStatus = 'STARTED';
      } else if (stages.checkin === 'COMPLETED' && timeline.reportAt && stages.report !== 'COMPLETED') {
        currentStage = 'report';
        stageStartedAt = timeline.reportAt ?? null;
        stageStatus = 'STARTED';
      } else if (stages.report === 'COMPLETED' && timeline.votingAt && stages.voting !== 'COMPLETED') {
        currentStage = 'voting';
        stageStartedAt = timeline.votingAt ?? null;
        stageStatus = 'STARTED';
      } else if (stages.voting === 'COMPLETED' && timeline.resultAnnouncedAt && stages.result !== 'COMPLETED') {
        currentStage = 'result';
        stageStartedAt = timeline.resultAnnouncedAt ?? null;
        stageStatus = 'STARTED';
      } else if (stages.result === 'COMPLETED' && timeline.closingAt && stages.closing !== 'COMPLETED') {
        currentStage = 'closing';
        stageStartedAt = timeline.closingAt ?? null;
        stageStatus = 'STARTED';
      } else if (stages.closing === 'COMPLETED') {
        currentStage = 'completed';
        stageStartedAt = timeline.closingAt ?? null;
        stageStatus = 'COMPLETED';
      } else if (timeline.checkinAt) {
        // Nếu đã có timeline nhưng không match với điều kiện nào, lấy giai đoạn cuối cùng đã completed
        if (stages.closing === 'COMPLETED') {
          currentStage = 'completed';
          stageStartedAt = timeline.closingAt ?? null;
          stageStatus = 'COMPLETED';
        } else if (stages.result === 'COMPLETED') {
          currentStage = 'result';
          stageStartedAt = timeline.resultAnnouncedAt ?? null;
          stageStatus = 'COMPLETED';
        } else if (stages.voting === 'COMPLETED') {
          currentStage = 'voting';
          stageStartedAt = timeline.votingAt ?? null;
          stageStatus = 'COMPLETED';
        } else if (stages.report === 'COMPLETED') {
          currentStage = 'report';
          stageStartedAt = timeline.reportAt ?? null;
          stageStatus = 'COMPLETED';
        } else if (stages.checkin === 'COMPLETED') {
          currentStage = 'checkin';
          stageStartedAt = timeline.checkinAt ?? null;
          stageStatus = 'COMPLETED';
        }
      }

      return {
        startDate: election.startDate,
        currentStage,
        stageStartedAt,
        stageStatus,
        timeline,
        stages,
      };
    } catch (error) {
      throw error;
    }
  }

  async endStage(electionId: string, stage: string, userId: string) {
    try {
      const election = await this.electionsModel.findById(new Types.ObjectId(electionId)).exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const stageMap: Record<string, { statusData: string }> = {
        'checkin': { statusData: 'CHECKIN_COMPLETED' },
        'report': { statusData: 'REPORT_COMPLETED' },
        'voting': { statusData: 'VOTING_COMPLETED' },
        'result': { statusData: 'RESULT_COMPLETED' },
        'closing': { statusData: 'CLOSING_COMPLETED' },
      };

      const stageInfo = stageMap[stage.toLowerCase()];
      if (!stageInfo) {
        throw new Error('Giai đoạn không hợp lệ');
      }

      const stages = election.stages || {};
      stages[stage.toLowerCase()] = 'COMPLETED';

      if (stage.toLowerCase() === 'voting') {
        try {
          const updateResult = await this.ballotsModel.updateMany(
            {
              electionId: new Types.ObjectId(electionId),
              status: STATUS.PENDING
            },
            {
              $set: {
                status: STATUS.LOCKED,
                updatedBy: userId ? new Types.ObjectId(userId) : null,
              }
            }
          );
          await this.resultsService.autoCreateResultRecord(electionId);
          console.log(`[END VOTING STAGE] Đã cập nhật ${updateResult.modifiedCount} ballots của electionId ${electionId} thành INACTIVE`);
        } catch (error) {
          console.error('[END VOTING STAGE] Failed to update ballots status to INACTIVE:', error.message || error);
        }
      }

      const updatedElection = await this.electionsModel
        .findByIdAndUpdate(
          new Types.ObjectId(electionId),
          {
            $set: {
              stages: stages,
              updatedBy: userId ? new Types.ObjectId(userId) : null,
            },
          },
          { new: true }
        )
        .exec();

      // Emit socket để thông báo realtime
      try {
        this.notificationService.transferDataRealTime(electionId, {
          type: 'stage-ended',
          electionId: electionId,
          stage: stage,
          message: `Giai đoạn ${stage} đã kết thúc`,
        });
      } catch (socketError) {
        console.error('Error emitting socket:', socketError);
      }

      return updatedElection;
    } catch (error) {
      throw error;
    }
  }

  private async getTotalCommonShares(): Promise<number> {
    try {
      const config = await this.systemConfigModel
        .findOne({ configKey: 'TOTAL_OF_COMMON_SHARES' })
        .exec();

      if (!config) {
        throw new Error('Không tìm thấy cấu hình TOTAL_OF_COMMON_SHARES');
      }

      let totalShares: number;
      if (typeof config.configValue === 'number') {
        totalShares = config.configValue;
      } else if (typeof config.configValue === 'object' && config.configValue !== null) {
        totalShares =
          config.configValue.value || config.configValue.amount || config.configValue.total || 0;
      } else if (typeof config.configValue === 'string') {
        totalShares = parseFloat(config.configValue) || 0;
      } else {
        throw new Error('Giá trị TOTAL_OF_COMMON_SHARES không hợp lệ');
      }

      if (!totalShares || totalShares <= 0) {
        throw new Error('Tổng số cổ phần phổ thông phải lớn hơn 0');
      }

      return totalShares;
    } catch (error) {
      throw error;
    }
  }

  async calculateVotes(shares: any): Promise<number> {
    try {
      const totalCommonShares = await this.getTotalCommonShares();
      const calculatedVotes = (shares / 100) * totalCommonShares;
      const votes = Math.round(calculatedVotes);
      return votes;
    } catch (error) {
      throw error;
    }
  }
}
