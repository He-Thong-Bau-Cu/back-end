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
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { SystemConfig, SystemConfigDocument } from 'src/database/schemas/systemConfig.schema';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../mail/mail.service';

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
    private readonly signatureService: SigningService,
    private readonly fileService: MinioService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
  ) {}

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

      const createdAt = new Date();
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

      const createdAt = new Date();
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
          createdAt: new Date(),
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
  ): Promise<Buffer> {
    try {
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
        },
      };
      const printer = new PdfPrinter(fonts);

      const currentDate = new Date();
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
            text: 'Về việc triệu tập Đại hội đồng cổ đông bất thường năm 2023',
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
    const now = new Date();

    const roleVoter = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
    if (!roleVoter) throw new Error('Không tìm thấy role VOTER');

    const roleFilter = await this.rolesModel.findOne({ roleCode: USER_ROLE.USER });
    if (!roleFilter) throw new Error('Không tìm thấy role USER');

    const users = await this.userModel.find({ roleId: roleFilter._id }).lean();

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

      // Validation khi gửi duyệt: kiểm tra các trường bắt buộc
      if (isSubmitForApproval) {
        if (!electionEntities || !Array.isArray(electionEntities) || electionEntities.length === 0) {
          throw new Error('Vui lòng thêm ít nhất một ứng viên/bầu chọn trước khi gửi duyệt');
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

      // 1. Sử dụng trực tiếp typeId và thresholdId
      const typeId = meetingInfo.type as string;
      const thresholdId = meetingInfo.threshold as string;

      // 2. Cập nhật Election
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

      // 3. Xử lý Candidates/ElectionEntities
      if (electionEntities && Array.isArray(electionEntities)) {
        // Lấy danh sách IDs từ request
        const candidateIds = electionEntities
          .filter((c: any) => c._id)
          .map((c: any) => new Types.ObjectId(c._id));

        // Xóa các entities không còn trong danh sách
        if (candidateIds.length > 0) {
          await this.electionEntitiesModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            _id: { $nin: candidateIds },
          });
        } else {
          // Nếu không có candidate nào có _id, xóa tất cả entities cũ
          await this.electionEntitiesModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
          });
        }

        // Tạo hoặc cập nhật các candidates
        for (const candidate of electionEntities) {
          if (candidate._id) {
            // Update existing
            await this.electionEntitiesModel.findByIdAndUpdate(
              new Types.ObjectId(candidate._id),
              {
                title: candidate.title,
                description: candidate.description,
                metaData: candidate.metaData,
                fileUrl: candidate.fileUrl,
                electionTypeId: new Types.ObjectId(typeId),
                updatedBy: new Types.ObjectId(userId),
              },
              { new: true },
            );
          } else {
            // Create new
            await this.electionEntitiesModel.create({
              electionId: new Types.ObjectId(electionId),
              electionTypeId: new Types.ObjectId(typeId),
              title: candidate.title,
              description: candidate.description,
              metaData: candidate.metaData,
              fileUrl: candidate.fileUrl,
              status: 'PENDING',
              createdBy: new Types.ObjectId(userId),
            });
          }
        }
      } else {
        // Nếu không có candidates trong request, xóa tất cả entities cũ
        await this.electionEntitiesModel.deleteMany({
          electionId: new Types.ObjectId(electionId),
        });
      }

      // 4. Xử lý Voters và VotingRights
      if (voters && Array.isArray(voters)) {
        // Lấy role VOTER từ database (chỉ lấy 1 lần)
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });

        // Lấy danh sách userIds từ list voters mới
        const voterUserIds = voters.map((v: any) => new Types.ObjectId(v.userId));

        // Xóa các election participants có role VOTER nhưng userId không còn trong list mới
        if (voterRole && voterUserIds.length > 0) {
          await this.electionParticipantsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
            userId: { $nin: voterUserIds },
          });
        } else if (voterRole) {
          // Nếu không có voters trong request, xóa tất cả election participants có role VOTER
          await this.electionParticipantsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
          });
        }

        for (const voterItem of voters) {
          let voter;
          if (voterItem._id) {
            // Update existing voter
            voter = await this.voterModel.findByIdAndUpdate(
              new Types.ObjectId(voterItem._id),
              {
                userId: new Types.ObjectId(voterItem.userId),
                updatedBy: new Types.ObjectId(userId),
              },
              { new: true },
            );
          } else {
            // Create new voter
            voter = await this.voterModel.create({
              electionId: new Types.ObjectId(electionId),
              userId: new Types.ObjectId(voterItem.userId),
              eligible: true,
              status: 'PENDING',
              createdBy: new Types.ObjectId(userId),
            });
          }

          // Tự động tạo/cập nhật election participant cho voter
          if (voter && voterRole) {
            const existingParticipant = await this.electionParticipantsModel.findOne({
              electionId: new Types.ObjectId(electionId),
              userId: new Types.ObjectId(voterItem.userId),
              roleId: voterRole._id,
            });

            if (existingParticipant) {
              // Update existing participant
              await this.electionParticipantsModel.findByIdAndUpdate(
                existingParticipant._id,
                {
                  position: (await this.userModel.findById(new Types.ObjectId(voterItem.userId)))?.position || 'Voter',
                  updatedBy: new Types.ObjectId(userId),
                },
                { new: true },
              );
            } else {
              // Create new participant
              const userInfo = await this.userModel.findById(new Types.ObjectId(voterItem.userId));
              await this.electionParticipantsModel.create({
                electionId: new Types.ObjectId(electionId),
                userId: new Types.ObjectId(voterItem.userId),
                roleId: voterRole._id,
                position: userInfo?.position || 'Voter',
                status: STATUS.ACTIVE,
                createdBy: new Types.ObjectId(userId),
              });
            }
          }

          if (voter && voterItem.percentage !== undefined) {
            // Create or update voting right
            const existingVotingRight = await this.votingRightsModel.findOne({
              electionId: new Types.ObjectId(electionId),
              voterId: voter._id,
            });

            if (existingVotingRight) {
              await this.votingRightsModel.findByIdAndUpdate(existingVotingRight._id, {
                shares: voterItem.percentage,
                updatedBy: new Types.ObjectId(userId),
              });
            } else {
              await this.votingRightsModel.create({
                electionId: new Types.ObjectId(electionId),
                voterId: voter._id,
                shares: voterItem.percentage,
                votes: 0,
                status: 'PENDING',
                createdBy: new Types.ObjectId(userId),
              });
            }
          }
        }
      } else {
        // Nếu không có voters trong request, xóa tất cả election participants có role VOTER
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          await this.electionParticipantsModel.deleteMany({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
          });
        }
      }

      // 5. Xử lý Participants
      if (participants && Array.isArray(participants)) {
        for (const participantItem of participants) {
          if (participantItem._id) {
            // Update existing
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
            // Create new
            await this.electionParticipantsModel.create({
              electionId: new Types.ObjectId(electionId),
              userId: new Types.ObjectId(participantItem.userId),
              roleId: new Types.ObjectId(participantItem.roleId),
              position: participantItem.position,
              createdBy: new Types.ObjectId(userId),
            });
          }
        }
      }

      // 6. Xử lý ElectionDocuments
      if (electionDocuments && Array.isArray(electionDocuments)) {
        for (const docItem of electionDocuments) {
          if (docItem._id) {
            // Update existing
            await this.electionDocumentsModel.findByIdAndUpdate(
              new Types.ObjectId(docItem._id),
              {
                title: docItem.title,
                content: docItem.content,
                fileUrl: docItem.fileUrl,
                remarks: docItem.remarks,
                updatedBy: new Types.ObjectId(userId),
              },
              { new: true },
            );
          } else {
            // Create new
            await this.electionDocumentsModel.create({
              electionId: new Types.ObjectId(electionId),
              preparedBy: new Types.ObjectId(userId),
              title: docItem.title,
              content: docItem.content,
              fileUrl: docItem.fileUrl,
              status: 'PENDING',
              remarks: docItem.remarks,
              createdBy: new Types.ObjectId(userId),
            });
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
        meeting = await this.meetingsModel.create({
          title: `Cuộc họp ${updatedElection.decisionName || updatedElection.title}`,
          electionId: new Types.ObjectId(electionId),
          location: meetingInfo.location,
          meetingDate: updatedElection.startDate,
          status: 'PENDING',
          createdBy: new Types.ObjectId(userId),
        });
      }

      // 8. Xử lý MeetingAttendees cho participants có role voter (chỉ từ danh sách voters)
      if (meeting) {
        // Lấy role voter
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          // Lấy danh sách election participants có role VOTER từ database (dựa trên voters đã được tạo/cập nhật)
          const voterParticipants = await this.electionParticipantsModel.find({
            electionId: new Types.ObjectId(electionId),
            roleId: voterRole._id,
          }).exec();

          // Xóa tất cả meetingAttendees cũ của meeting này (logic ghi đè)
          await this.meetingAttendeesModel.deleteMany({
            meetingId: meeting._id,
          });

          // Tạo meetingAttendees mới cho các participants có role VOTER
          for (const voterParticipant of voterParticipants) {
            // Kiểm tra xem đã có meetingAttendee chưa (tránh duplicate)
            const existingAttendee = await this.meetingAttendeesModel.findOne({
              meetingId: meeting._id,
              participantId: voterParticipant._id,
            });

            if (!existingAttendee) {
              await this.meetingAttendeesModel.create({
                meetingId: meeting._id,
                participantId: voterParticipant._id,
                checkInTime: meeting.meetingDate || updatedElection.startDate,
                attended: false,
                createdBy: new Types.ObjectId(userId),
              });
            }
          }
        }
      }

      return {
        success: true,
        message: isSubmitForApproval ? 'Gửi duyệt thành công' : 'Lưu nháp thành công',
      };
    } catch (error) {
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
      const votersWithPercentage = voters.map((voter) => {
        const votingRight = votingRights.find((vr) => String(vr.voterId) === String(voter._id));
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
        voterObj.percentage = votingRight ? votingRight.shares : null;
        return voterObj;
      });

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
}
