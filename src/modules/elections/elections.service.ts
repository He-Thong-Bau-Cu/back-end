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
import { CreateElectionRequestDto } from './dto/create-election-request.dto';
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
import { DelegateCard, DelegateCardDocument } from 'src/database/schemas/delegateCard.schema';
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { SystemConfig, SystemConfigDocument } from 'src/database/schemas/systemConfig.schema';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../mail/mail.service';
import { ResultsService } from '../results/results.service';
import * as ExcelJS from 'exceljs';
import { VotersService } from '../voters/voters.service';
import { CreateVoterDto } from '../voters/dto/create-voter.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDto } from 'src/common/dto/user.dto';
import { UsersService } from '../users/users.service';

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
    @InjectModel(DelegateCard.name)
    private readonly delegateCardModel: Model<DelegateCardDocument>,
    private readonly signatureService: SigningService,
    private readonly fileService: MinioService,
    private readonly notificationService: NotificationService,
    private readonly mailService: MailService,
    private readonly resultsService: ResultsService,
    private readonly votersService: VotersService,
    private readonly usersService: UsersService,
  ) { }

  async searchElections(req: SearchDTO & { electionId?: string }) {
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
      // Nếu có electionId, chỉ lấy election đó và filter isUserBasicCreate = true
      if (req.electionId) {
        query._id = new Types.ObjectId(req.electionId);
        query.isUserBasicCreate = true;
      } else {
        // Nếu không có electionId (system preside), không lấy những cái có isUserBasicCreate = true
        query.isUserBasicCreate = { $ne: true };
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

      //Kiểm tra tiêu đề cuộc bầu cử đã tồn tại hay Không
      await this.checkElectionExists(createElection);
      //Kiểm tra các ID liên quan có tồn tại hay Không
      await this.checkRelatedIds(createElection);
      //Kiểm tra thời gian cuộc bầu cử có hợp lệ không
      await this.checkDate(createElection);

      // Kiểm tra trùng thông tin thư ký nếu có tempSecretaryInfo và statusData là WAIT_ENTER_DATA
      // (Trường hợp này xảy ra nếu frontend gửi tempSecretaryInfo lên thay vì tạo user trước)
      if (createElection.statusData === 'WAIT_ENTER_DATA' && createElection.tempSecretaryInfo) {
        const tempInfo = createElection.tempSecretaryInfo;
        const existingUser = await this.userModel
          .findOne({
            $or: [
              { email: tempInfo.email },
              { phone: tempInfo.phone },
              { citizenId: tempInfo.citizenId },
            ],
          })
          .exec();

        if (existingUser) {
          if (existingUser.email === tempInfo.email) {
            throw new BadRequestException('Email đã tồn tại trong hệ thống !');
          }
          if (existingUser.phone === tempInfo.phone) {
            throw new BadRequestException('Số điện thoại đã tồn tại trong hệ thống !');
          }
          if (existingUser.citizenId === tempInfo.citizenId) {
            throw new BadRequestException('Số căn cước công dân đã tồn tại trong hệ thống !');
          }
          throw new BadRequestException('Thông tin thư ký đã tồn tại trong hệ thống !');
        }
      }

      // Kiểm tra secretaryId có tồn tại không (nếu có)
      // Điều này đảm bảo rằng nếu frontend đã tạo user trước, user đó phải tồn tại
      if (createElection.statusData === 'WAIT_ENTER_DATA') {
        // Note: secretaryId sẽ được xử lý trong approveElectionRequest hoặc ở nơi khác
        // Nhưng nếu có trong createElection, cần check
        // (Hiện tại secretaryId không có trong CreateElectionDto, nên bỏ qua)
      }

      const createdAt = getCurrentDateVN();

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
        tempSecretaryInfo: createElection.tempSecretaryInfo || null,
        secretaryId: createElection.secretaryId ? new Types.ObjectId(createElection.secretaryId) : null,
        boardOfControlId: createElection.boardOfControlId ? new Types.ObjectId(createElection.boardOfControlId) : null,
      });

      // Xác định status cho participants: PENDING nếu DRAFT, ACTIVE nếu WAIT_ENTER_DATA
      const participantStatus = createElection.statusData === STATUS.DRAFT ? STATUS.PENDING : STATUS.ACTIVE;

      // Xử lý thư ký: chỉ tạo participant khi statusData = WAIT_ENTER_DATA
      // Khi DRAFT, chỉ lưu secretaryId vào election record, không tạo participant
      if (createElection.secretaryId && createElection.statusData === STATUS.WAIT_ENTER_DATA) {
        const secretaryRole = await this.rolesModel
          .findOne({ roleCode: USER_ROLE.PRESIDE_SECRETARY })
          .exec();

        if (secretaryRole) {
          await this.electionParticipantsModel.create({
            electionId: election._id,
            userId: new Types.ObjectId(createElection.secretaryId),
            roleId: secretaryRole._id,
            position: "Thư ký chủ tọa",
            status: STATUS.ACTIVE,
            createdBy: new Types.ObjectId(userId),
          });
        }
      }

      // Xử lý ban kiểm soát nếu có boardOfControlId
      if (createElection.boardOfControlId) {
        const boardOfControlRole = await this.rolesModel
          .findOne({ roleCode: USER_ROLE.BOARD_OF_CONTROL })
          .exec();

        if (boardOfControlRole) {
          await this.electionParticipantsModel.create({
            electionId: election._id,
            userId: new Types.ObjectId(createElection.boardOfControlId),
            roleId: boardOfControlRole._id,
            position: "Ban kiểm soát",
            status: participantStatus,
            createdBy: new Types.ObjectId(userId),
          });
        }
      }

      return election;
    } catch (error) {
      throw error;
    }
  }

  async createElectionRequest(createElectionRequest: CreateElectionRequestDto, userId: string) {
    try {

      //Kiểm tra xem số quyết định đã tồn tại hay Chưa
      if (createElectionRequest?.decisionNumber) {
        const decisionNumberExist = await this.electionsModel.exists({
          decisionNumber: createElectionRequest.decisionNumber,
        });
        if (decisionNumberExist) {
          throw new Error(MESSAGE.ELECTION_NUMBER_ALREADY_EXISTS);
        }
      }

      const createdAt = getCurrentDateVN();
      if (createElectionRequest?.endDate && createElectionRequest?.startDate) {
        // Kiểm tra ngày bắt đầu không được trong quá khứ
        const startDate = new Date(createElectionRequest?.startDate);
        if (startDate < createdAt) {
          throw new Error('Ngày bắt đầu không được trong quá khứ');
        }

        // Kiểm tra endDate phải sau startDate
        const endDate = new Date(createElectionRequest?.endDate);
        if (endDate <= startDate) {
          throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
        }
      } else if (createElectionRequest?.startDate) {
        // Nếu chỉ có startDate, kiểm tra không được trong quá khứ
        const startDate = new Date(createElectionRequest?.startDate);
        if (startDate < createdAt) {
          throw new Error('Ngày bắt đầu không được trong quá khứ');
        }
      }

      // Kiểm tra participants phải có ít nhất 1 người
      if (!createElectionRequest.participants || createElectionRequest.participants.length === 0) {
        throw new Error('Vui lòng chọn ít nhất một thành viên tổ chức (thư ký hoặc chủ tọa)');
      }

      // Tạo election với statusData = REQUEST_FROM_USER và isUserCreate = true
      // status = INACTIVE vì chưa được duyệt, chưa active
      const election = await this.electionsModel.create({
        title: createElectionRequest.title,
        decisionNumber: createElectionRequest.decisionNumber,
        decisionName: createElectionRequest.decisionName,
        startDate: createElectionRequest.startDate || null,
        endDate: createElectionRequest.endDate || null,
        status: STATUS.INACTIVE, // Chưa active vì chưa được duyệt
        statusData: STATUS.REQUEST_FROM_USER,
        isUserCreate: true,
        isUserBasicCreate: true,
        createdBy: userId ? new Types.ObjectId(userId) : null,
        createdAt: createdAt,
      });

      // Tạo electionParticipant
      for (const participant of createElectionRequest.participants) {
        // Kiểm tra userId có tồn tại không
        const userExists = await this.userModel.exists({ _id: participant.userId });
        if (!userExists) {
          throw new NotFoundException(MESSAGE.USER_NOT_FOUND);
        }

        // Kiểm tra roleId có tồn tại không
        const roleExists = await this.rolesModel.exists({ _id: participant.roleId });
        if (!roleExists) {
          throw new NotFoundException(MESSAGE.ROLE_NOT_FOUND);
        }

        // Kiểm tra user đã trong cuộc bầu cử chưa
        const participantsExist = await this.electionParticipantsModel.findOne({
          electionId: election._id,
          userId: new Types.ObjectId(participant.userId),
        });
        if (participantsExist) {
          throw new Error(MESSAGE.ELECTION_PARTICIPANT_ALREADY_EXIST);
        }

        // Tạo participant
        await this.electionParticipantsModel.create({
          electionId: election._id,
          userId: new Types.ObjectId(participant.userId),
          roleId: new Types.ObjectId(participant.roleId),
          position: participant.position,
          status: STATUS.PENDING,
          createdBy: userId ? new Types.ObjectId(userId) : null,
        });
      }

      return election;
    } catch (error) {
      throw error;
    }
  }

  async getMyElectionRequests(userId: string, req: SearchDTO) {
    try {
      const query: any = {
        createdBy: new Types.ObjectId(userId),
        isUserBasicCreate: true,
      };

      if (req.textSearch) {
        query.$or = [
          { title: { $regex: req.textSearch, $options: 'i' } },
          { decisionName: { $regex: req.textSearch, $options: 'i' } },
          { decisionNumber: { $regex: req.textSearch, $options: 'i' } },
        ];
      }

      if (req.statusData) {
        query.statusData = req.statusData;
      }

      const elections = await this.electionsModel
        .find(query)
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .sort({ createdAt: -1 })
        .exec();

      return paginate(elections, req.page, req.limit);
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
        .populate('secretaryId', 'fullName username email phone position')
        .populate('boardOfControlId', 'fullName username email phone position')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return election;
    } catch (error) {
      throw error;
    }
  }

  async updateElections(id: string, updateElection: UpdateElectionDto, userId: string) {
    try {
      //Kiểm tra nếu có timeline thì thời gian phải hợp lệ
      if (updateElection?.timeline) {
        isValidateTimeline(updateElection.timeline);
      }
      await this.checkElectionExistsInUpdate(updateElection, id);
      await this.checkRelatedIdsInUpdate(updateElection);
      await this.checkDateInUpdate(updateElection, id);

      const updatedAt = getCurrentDateVN();
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
            tempSecretaryInfo: updateElection.tempSecretaryInfo || null,
            secretaryId: updateElection.secretaryId ? new Types.ObjectId(updateElection.secretaryId) : null,
            boardOfControlId: updateElection.boardOfControlId ? new Types.ObjectId(updateElection.boardOfControlId) : null,
            updatedBy: userId ? new Types.ObjectId(userId) : null,
            updatedAt: updatedAt,
          },
          { new: true },
        )
        .exec();

      if (!election) {
        throw new Error('Không tìm thấy cuộc bầu cử');
      }

      const participantStatus = updateElection.statusData === STATUS.DRAFT ? STATUS.PENDING : STATUS.ACTIVE;

      if (updateElection.secretaryId) {
        election.secretaryId = new Types.ObjectId(updateElection.secretaryId);
        await election.save();

        if (updateElection.statusData === STATUS.WAIT_ENTER_DATA) {
          const secretaryRole = await this.rolesModel
            .findOne({ roleCode: USER_ROLE.PRESIDE_SECRETARY })
            .exec();

          if (secretaryRole) {
            const existingSecretary = await this.electionParticipantsModel
              .findOne({
                electionId: election._id,
                roleId: secretaryRole._id,
              })
              .exec();

            if (existingSecretary) {
              existingSecretary.userId = new Types.ObjectId(updateElection.secretaryId);
              existingSecretary.status = STATUS.ACTIVE;
              existingSecretary.updatedBy = new Types.ObjectId(userId);
              await existingSecretary.save();
            } else {
              await this.electionParticipantsModel.create({
                electionId: election._id,
                userId: new Types.ObjectId(updateElection.secretaryId),
                roleId: secretaryRole._id,
                position: "Thư ký chủ tọa",
                status: STATUS.ACTIVE,
                createdBy: new Types.ObjectId(userId),
              });
            }
          }
        } else if (updateElection.statusData === STATUS.DRAFT) {
          // Khi DRAFT, xóa participant nếu có (vì không cần participant khi DRAFT)
          const secretaryRole = await this.rolesModel
            .findOne({ roleCode: USER_ROLE.PRESIDE_SECRETARY })
            .exec();

          if (secretaryRole) {
            await this.electionParticipantsModel.deleteMany({
              electionId: election._id,
              roleId: secretaryRole._id,
            }).exec();
          }
        }
      }

      // Xử lý ban kiểm soát nếu có boardOfControlId
      if (updateElection.boardOfControlId) {
        const boardOfControlRole = await this.rolesModel
          .findOne({ roleCode: USER_ROLE.BOARD_OF_CONTROL })
          .exec();

        if (boardOfControlRole) {
          const existingBoardOfControl = await this.electionParticipantsModel
            .findOne({
              electionId: election._id,
              roleId: boardOfControlRole._id,
            })
            .exec();

          if (existingBoardOfControl) {
            existingBoardOfControl.userId = new Types.ObjectId(updateElection.boardOfControlId);
            existingBoardOfControl.status = participantStatus;
            existingBoardOfControl.updatedBy = new Types.ObjectId(userId);
            await existingBoardOfControl.save();
          } else {
            await this.electionParticipantsModel.create({
              electionId: election._id,
              userId: new Types.ObjectId(updateElection.boardOfControlId),
              roleId: boardOfControlRole._id,
              position: "Ban kiểm soát",
              status: participantStatus,
              createdBy: new Types.ObjectId(userId),
            });
          }
        }
      }

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

  async getElectionOrganizerByTime(startTime: Date, endTime: Date) {
    try {
      // 1. Lấy role ADMIN và PRESIDE để loại bỏ
      const roles = await this.rolesModel
        .find({
          $or: [{ roleCode: USER_ROLE.ADMIN }, { roleCode: USER_ROLE.PRESIDE }],
        })
        .exec();
      const roleIds = roles.map((role) => role._id);

      // 2. Lấy tất cả user trong bảng voter
      const voterUsers = await this.voterModel.find({}).exec();
      const voterUserIds = voterUsers.map((v) => String(v.userId));

      // 3. Lấy user không có trong bảng voter và không phải ADMIN/PRESIDE
      const availableUsers = await this.userModel
        .find({
          _id: { $nin: voterUserIds.map((id) => new Types.ObjectId(id)) },
          roleId: { $nin: roleIds },
        })
        .exec();

      // 4. Tính số lượng cuộc bầu cử đang tham gia hiện tại cho từng user
      // "Đang tham gia hiện tại" được hiểu là:
      //  - User đang là participant ACTIVE trong cuộc bầu cử
      //  - Và khoảng thời gian của cuộc bầu cử giao với khoảng [startTime, endTime]
      //      (!startDate || startDate <= endTime) && (!endDate || endDate >= startTime)
      const userIdMap = availableUsers.map((u) => u._id);

      if (userIdMap.length === 0) {
        return availableUsers;
      }

      const nowRangeStart = startTime;
      const nowRangeEnd = endTime;

      const participants = await this.electionParticipantsModel
        .find({
          userId: { $in: userIdMap },
          status: STATUS.ACTIVE,
        })
        .populate({
          path: 'electionId',
          select: 'startDate endDate status statusData',
        })
        .lean()
        .exec();

      const activeElectionCountMap = new Map<string, number>();

      for (const participant of participants as any[]) {
        const election = participant.electionId as {
          _id?: Types.ObjectId;
          startDate?: Date | null;
          endDate?: Date | null;
          status?: string | null;
          statusData?: string | null;
        } | null;

        if (!election) continue;

        // Chỉ đếm các election có status ACTIVE
        if (election.status !== STATUS.ACTIVE) continue;

        const startDate = election.startDate ? new Date(election.startDate) : null;
        const endDate = election.endDate ? new Date(election.endDate) : null;

        const overlapsTimeRange =
          (!startDate || startDate <= nowRangeEnd) &&
          (!endDate || endDate >= nowRangeStart);

        if (!overlapsTimeRange) continue;

        const userIdStr = String(participant.userId);
        const current = activeElectionCountMap.get(userIdStr) || 0;
        activeElectionCountMap.set(userIdStr, current + 1);
      }

      // 5. Trả về danh sách user kèm theo số lượng cuộc bầu cử đang tham gia hiện tại
      return availableUsers.map((user) => {
        const userObj = user.toObject ? user.toObject() : user;
        const count = activeElectionCountMap.get(String(user._id)) || 0;
        return {
          ...userObj,
          currentElectionCount: count,
        };
      });
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

      // 2. Kiểm tra statusData phải là WAIT_APPROVAL hoặc REQUEST_FROM_USER
      if (election.statusData !== STATUS.WAIT_APPROVAL && election.statusData !== STATUS.REQUEST_FROM_USER) {
        throw new BadRequestException('Chỉ có thể từ chối khi trạng thái là chờ duyệt chủ tọa hoặc yêu cầu từ user!');
      }

      // 3. Cập nhật statusData thành REJECTED và lưu lý do từ chối
      election.statusData = STATUS.REJECTED;
      election.rejectReason = rejectReason;
      await election.save();

      // 4. Gửi thông báo cho người tạo election (nếu có)
      if (election.createdBy) {
        await this.notificationService.notifyUser(
          String(election.createdBy),
          `Cuộc bầu cử "${election.title}" đã bị từ chối. Lý do: ${rejectReason}`,
        );
      }

      return election;
    } catch (error) {
      throw error;
    }
  }

  async rejectElectionByBKS(electionId: string, rejectReason: string, userId: string) {
    try {
      // 1. Kiểm tra election có tồn tại không
      const election = await this.electionsModel.findById(new Types.ObjectId(electionId)).exec();

      if (!election) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Kiểm tra statusData phải là WAIT_APPROVAL
      if (election.statusData !== STATUS.WAIT_BKS_CONFIRMED) {
        throw new BadRequestException('Chỉ có thể từ chối khi trạng thái là chờ duyệt bởi Ban Kiểm Soát!');
      }

      // 3. Cập nhật statusData thành REJECTED và lưu lý do từ chối
      election.statusData = STATUS.REJECTED;
      election.rejectReason = rejectReason;
      election.updatedBy = new Types.ObjectId(userId);
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

  async approveByBKS(
    electionId: string,
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
      if (election.statusData !== STATUS.WAIT_BKS_CONFIRMED) {
        throw new BadRequestException('Chỉ có thể ký duyệt khi trạng thái là chờ duyệt bởi Ban Kiểm Soát!');
      }


      // 10. Cập nhật status election
      const updateElection = await this.electionsModel.updateOne(
        { _id: new Types.ObjectId(electionId) },
        {
          $set: {
            statusData: STATUS.WAIT_APPROVAL
            , updatedBy: new Types.ObjectId(userId)
          }
        },
      );

      // 17. Gửi thông báo socket đến thư kí sau khi duyệt
      try {
        //Tìm role là thư kí
        const secretaryRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.PRESIDE_SECRETARY }).exec();
        if (secretaryRole) {
          const secretaryParticipant = await this.electionParticipantsModel
            .findOne({
              electionId: new Types.ObjectId(electionId),
              roleId: secretaryRole._id,
            })
            .exec();
          if (secretaryParticipant) {
            const secretary = secretaryParticipant.userId as any;
            if (secretary && secretary._id) {
              await this.notificationService.notifyUser(
                String(secretary._id),
                `Cuộc bầu cử "${election.title}" đã được Ban Kiểm Soát duyệt thành công!`,
              );
            }
          }
        }
      } catch (socketError) {
        // Log lỗi nhưng không throw để không ảnh hưởng đến quá trình duyệt
        console.error('Error sending socket notifications:', socketError);
      }

      return updateElection;
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

      //3.1.Tạo user, voter, electionParticipant và votingRight cho voter lấy từ excel
      const excelParticipantIds: Types.ObjectId[] = []; // Lưu danh sách participantIds từ Excel để tạo meetingAttendee
      try {
        const voterExcelResponse = await this.getVotersFromExcel(electionId);
        const voterExcel: any[] = voterExcelResponse?.voters || [];

        if (voterExcel && voterExcel.length > 0) {
          // Lấy role VOTER
          const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER }).exec();
          if (!voterRole || !voterRole._id) {
            console.warn('Không tìm thấy role VOTER, bỏ qua tạo voter từ Excel');
          } else {
            // Đảm bảo voterRoleId là ObjectId
            const voterRoleId = voterRole._id instanceof Types.ObjectId
              ? voterRole._id
              : new Types.ObjectId(String(voterRole._id));

            for (const v of voterExcel) {
              try {
                // Tìm user theo email
                let user: any = await this.userModel.findOne({ email: v.email }).exec();

                // Nếu chưa có user, tạo mới
                if (!user) {
                  const data: UserDto = {
                    email: v.email,
                    fullName: v.fullName,
                    phone: v.phone,
                    citizenId: v.citizenId,
                    roleId: '',
                  };
                  user = await this.usersService.create(data);
                } else {
                  // Cập nhật status nếu đã có
                  user.status = STATUS.ACTIVE;
                  await user.save();
                }

                if (user && user._id) {
                  const userIdObj = user._id instanceof Types.ObjectId
                    ? user._id
                    : new Types.ObjectId(user._id);

                  // Kiểm tra và tạo voter nếu chưa có
                  let voter = await this.voterModel.findOne({
                    userId: userIdObj,
                    electionId: new Types.ObjectId(electionId)
                  }).exec();

                  if (!voter) {

                    voter = await this.voterModel.create({
                      userId: userIdObj,
                      electionId: new Types.ObjectId(electionId),
                      status: STATUS.ACTIVE,
                      eligible: true,
                      createdBy: new Types.ObjectId(userId),
                      createdAt: getCurrentDateVN(),
                    });
                  }
                  if (voter && voter._id) {
                    // Tạo ElectionParticipant với role VOTER nếu chưa có
                    let participant = await this.electionParticipantsModel.findOne({
                      electionId: new Types.ObjectId(electionId),
                      userId: userIdObj,
                      roleId: voterRoleId,
                    }).exec();

                    if (!participant) {
                      participant = await this.electionParticipantsModel.create({
                        electionId: new Types.ObjectId(electionId),
                        userId: userIdObj,
                        roleId: voterRoleId,
                        position: 'Cử tri',
                        status: STATUS.ACTIVE,
                        createdBy: new Types.ObjectId(userId),
                        createdAt: getCurrentDateVN(),
                      });
                      // Lưu participantId để tạo meetingAttendee sau
                      if (participant && participant._id) {
                        excelParticipantIds.push(participant._id instanceof Types.ObjectId
                          ? participant._id
                          : new Types.ObjectId(String(participant._id)));
                      }
                    } else {
                      // Cập nhật status nếu đã có
                      participant.status = STATUS.ACTIVE;
                      await participant.save();
                      // Lưu participantId để tạo meetingAttendee sau
                      if (participant && participant._id) {
                        excelParticipantIds.push(participant._id instanceof Types.ObjectId
                          ? participant._id
                          : new Types.ObjectId(String(participant._id)));
                      }
                    }

                    // Tạo VotingRight nếu chưa có
                    const existingVotingRight = await this.votingRightsModel.findOne({
                      electionId: new Types.ObjectId(electionId),
                      voterId: voter._id,
                    }).exec();

                    if (!existingVotingRight) {
                      // Sử dụng percentage từ Excel (có thể là v.percentage hoặc v.shares)
                      const shares = v.percentage !== undefined ? v.percentage : (v.shares || 0);
                      const votes = await this.calculateVotes(shares);

                      await this.votingRightsModel.create({
                        electionId: new Types.ObjectId(electionId),
                        voterId: voter._id,
                        shares: shares,
                        votes: votes,
                        status: STATUS.ACTIVE,
                        createdBy: new Types.ObjectId(userId),
                        createdAt: getCurrentDateVN(),
                      });
                    } else {
                      // Cập nhật shares và votes nếu đã có (hoặc chỉ cập nhật status)
                      const shares = v.percentage !== undefined ? v.percentage : (v.shares || existingVotingRight.shares);
                      const votes = await this.calculateVotes(shares);

                      existingVotingRight.shares = shares;
                      existingVotingRight.votes = votes;
                      existingVotingRight.status = STATUS.ACTIVE;
                      await existingVotingRight.save();
                    }
                  }
                }
              } catch (voterError) {
                // Log lỗi cho từng voter nhưng tiếp tục xử lý các voter khác
                console.error(`Error processing voter ${v.email}:`, voterError);
              }
            }
          }
        }
      } catch (excelError) {
        // Log lỗi nhưng không throw để không ảnh hưởng đến quá trình duyệt
        console.error('Error getting voters from Excel:', excelError);
      }

      //3.2.1 cập nhật trạng thái file excel trong election documents
      await this.electionDocumentsModel.updateOne(
        { electionId: new Types.ObjectId(electionId), type: FileType.VOTERS_IMPORT_EXCEL },
        { $set: { status: STATUS.ACTIVE, updatedBy: new Types.ObjectId(userId), updatedAt: getCurrentDateVN() } },
      );



      // 4. Lấy thông tin meeting
      const meeting = await this.meetingsModel
        .findOne({ electionId: new Types.ObjectId(electionId) })
        .exec();

      // 4.1. Tạo meetingAttendee cho voters từ Excel (nếu có)
      if (meeting && excelParticipantIds.length > 0) {
        try {
          for (const participantId of excelParticipantIds) {
            // Kiểm tra xem đã có meetingAttendee chưa
            const existingAttendee = await this.meetingAttendeesModel.findOne({
              meetingId: meeting._id,
              participantId: participantId,
            }).exec();

            if (!existingAttendee) {
              await this.meetingAttendeesModel.create({
                meetingId: meeting._id,
                participantId: participantId,
                checkInTime: meeting.meetingDate || election.startDate,
                attended: false,
                createdBy: new Types.ObjectId(userId),
                createdAt: getCurrentDateVN(),
              });
            }
          }
        } catch (attendeeError) {
          // Log lỗi nhưng không throw để không ảnh hưởng đến quá trình duyệt
          console.error('Error creating meetingAttendees for Excel voters:', attendeeError);
        }
      }

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
          preparedBy: new Types.ObjectId(userId) || null,
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

      // Luôn thêm user vào result, bao gồm cả user mới chưa có trong các case
      // (user đã có delegation/voter/participant HOẶC user mới)
      result.push({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
      });
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
        hasDocuments,
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

        console.log('hasDocuments', hasDocuments);
        if (!hasDocuments) {
          if (!electionDocuments || !Array.isArray(electionDocuments) || electionDocuments.length === 0) {
            throw new Error('Vui lòng thêm ít nhất một tài liệu trước khi gửi duyệt');
          }

          // Kiểm tra xem có file Excel import voters không
          let hasExcelVoters = false;
          try {
            const excelDocument = await this.electionDocumentsModel
              .findOne({
                electionId: new Types.ObjectId(electionId),
                type: FileType.VOTERS_IMPORT_EXCEL,
              })
              .lean()
              .exec();

            if (excelDocument && excelDocument.fileUrl) {
              // Đọc file Excel và kiểm tra có voters không
              const voterExcelResponse = await this.getVotersFromExcel(electionId);
              const voterExcel: any[] = voterExcelResponse?.voters || [];
              if (voterExcel && voterExcel.length > 0) {
                hasExcelVoters = true;
              }
            }
          } catch (excelError) {
            // Nếu không đọc được file Excel, coi như không có
            console.log('Error checking Excel voters:', excelError);
            hasExcelVoters = false;
          }

          // Chỉ check voters array nếu không có voters từ Excel
          if (!hasExcelVoters) {
            if (!voters || !Array.isArray(voters) || voters.length === 0) {
              throw new Error('Vui lòng thêm ít nhất một cử tri trước khi gửi duyệt');
            }
          }
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
        electionUpdate.statusData = STATUS.WAIT_BKS_CONFIRMED;
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

  async getVotersFromExcel(electionId: string) {
    try {
      // 1. Kiểm tra election có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Tìm document có type "voters-import-excel" cho election này
      const excelDocument = await this.electionDocumentsModel
        .findOne({
          electionId: new Types.ObjectId(electionId),
          type: 'voters-import-excel',
        })
        .lean()
        .exec();

      if (!excelDocument || !excelDocument.fileUrl) {
        throw new NotFoundException('Không tìm thấy file Excel chứa danh sách cử tri import');
      }

      // 3. Download file Excel từ MinIO
      const fileBuffer = await this.fileService.getFileBufferByKey(excelDocument.fileUrl);

      if (!fileBuffer || fileBuffer.length === 0) {
        throw new BadRequestException('File Excel không tồn tại hoặc đã bị xóa');
      }

      // 4. Parse file Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer as unknown as ExcelJS.Buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new BadRequestException('File Excel không chứa dữ liệu');
      }

      // 5. Lấy header (dòng đầu tiên)
      const headerRow = worksheet.getRow(1);
      const headers: string[] = [];
      headerRow.eachCell({ includeEmpty: false }, (cell) => {
        headers.push(String(cell.value || '').toLowerCase().trim());
      });

      // Tìm index của các cột
      const fullnameIndex = headers.findIndex(
        (h) =>
          h.includes('fullname') ||
          h.includes('họ và tên') ||
          h.includes('họ tên') ||
          h.includes('tên'),
      );
      const emailIndex = headers.findIndex((h) => h.includes('email') || h.includes('mail'));
      const phoneIndex = headers.findIndex(
        (h) =>
          h.includes('phone') ||
          h.includes('sđt') ||
          h.includes('sdt') ||
          h.includes('điện thoại'),
      );
      const citizenIdIndex = headers.findIndex(
        (h) =>
          h.includes('citizenid') ||
          h.includes('citizen id') ||
          h.includes('cmnd') ||
          h.includes('cccd') ||
          h.includes('căn cước'),
      );
      const sharesIndex = headers.findIndex(
        (h) =>
          h.includes('shares') ||
          h.includes('cổ phần') ||
          h.includes('percentage') ||
          h.includes('% cổ phần') ||
          h.includes('%'),
      );

      if (fullnameIndex === -1 || emailIndex === -1 || sharesIndex === -1) {
        throw new BadRequestException(
          'File Excel thiếu các cột bắt buộc: FullName, Email, Shares',
        );
      }

      // 6. Parse dữ liệu từ dòng thứ 2 trở đi
      const voters: any[] = [];

      for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        // Kiểm tra dòng trống
        let isEmpty = true;
        row.eachCell({ includeEmpty: false }, () => {
          isEmpty = false;
        });
        if (isEmpty) continue;

        const fullname = String(row.getCell(fullnameIndex + 1).value || '').trim();
        const email = String(row.getCell(emailIndex + 1).value || '').trim();
        const phone =
          phoneIndex !== -1
            ? String(row.getCell(phoneIndex + 1).value || '').trim()
            : '';
        const citizenId =
          citizenIdIndex !== -1
            ? String(row.getCell(citizenIdIndex + 1).value || '').trim()
            : '';
        const sharesValue = row.getCell(sharesIndex + 1).value;
        const shares = sharesValue ? Number(sharesValue) : null;

        // Bỏ qua dòng không có đủ thông tin bắt buộc
        if (!fullname || !email || shares === null || isNaN(shares)) {
          continue;
        }

        voters.push({
          rowIndex: rowNumber,
          fullName: fullname,
          email: email,
          phone: phone || null,
          citizenId: citizenId || null,
          percentage: shares,
          isImportedFromExcel: true,
        });
      }

      if (voters.length === 0) {
        throw new BadRequestException('File Excel không có dữ liệu hợp lệ');
      }

      return {
        success: true,
        document: {
          _id: excelDocument._id,
          title: excelDocument.title,
          fileUrl: excelDocument.fileUrl,
          createdAt: excelDocument.createdAt,
        },
        voters: voters,
        total: voters.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error getting voters from Excel:', error);
      throw new BadRequestException(
        `Lỗi khi đọc file Excel: ${error.message || 'Unknown error'}`,
      );
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
          const updateBallotRecord = await this.ballotsModel.updateMany(
            {
              electionId: new Types.ObjectId(electionId),
              status: STATUS.ACTIVE
            },
            {
              $set: {
                status: STATUS.NOT_CAST,
                updatedBy: userId ? new Types.ObjectId(userId) : null,
              }
            }
          );
          await this.resultsService.autoCreateResultRecord(electionId);
          console.log(`[END VOTING STAGE] Đã cập nhật ${updateResult.modifiedCount} ballots của electionId ${electionId} thành INACTIVE`);
          console.log(`[END VOTING STAGE] Đã cập nhật ${updateBallotRecord.modifiedCount} ballots của electionId ${electionId} thành NOT_CAST`);
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

  // Lấy danh sách election requests cần phê duyệt (isUserBasicCreate = true)
  // Nếu có electionId thì chỉ lấy các election requests của cuộc bầu cử đó
  async getElectionRequestsForApproval(req: SearchDTO, electionId?: string) {
    try {
      const query: any = {
        isUserBasicCreate: true,
      };

      // Nếu có electionId, chỉ lấy các election requests của cuộc bầu cử đó
      if (electionId) {
        query._id = new Types.ObjectId(electionId);
      }

      if (req.textSearch) {
        query.$or = [
          { title: { $regex: req.textSearch, $options: 'i' } },
          { decisionName: { $regex: req.textSearch, $options: 'i' } },
          { decisionNumber: { $regex: req.textSearch, $options: 'i' } },
        ];
      }

      const elections = await this.electionsModel
        .find(query)
        .populate('typeId')
        .populate('votingMethodId')
        .populate('thresholdId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .sort({ createdAt: -1 })
        .exec();

      // Lấy thông tin participants cho mỗi election
      const electionsWithParticipants = await Promise.all(
        elections.map(async (election) => {
          const participants = await this.electionParticipantsModel
            .find({ electionId: election._id })
            .populate('userId', 'fullName email')
            .populate('roleId', 'roleName roleCode')
            .exec();

          return {
            ...election.toObject(),
            participants,
          };
        })
      );

      return paginate(electionsWithParticipants, req.page, req.limit);
    } catch (error) {
      throw error;
    }
  }

  // Duyệt election request (chuyển statusData thành WAIT_ENTER_DATA, có thể chỉ định thư ký/ban kiểm soát)
  async approveElectionRequest(
    electionId: string,
    userId: string,
    secretaryId?: string,
    boardOfControlId?: string,
  ) {
    try {
      // 1. Kiểm tra election có tồn tại không
      const election = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .exec();

      if (!election) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // 2. Kiểm tra statusData phải là REQUEST_FROM_USER hoặc REJECTED
      if (election.statusData !== STATUS.REQUEST_FROM_USER && election.statusData !== STATUS.REJECTED) {
        throw new BadRequestException('Chỉ có thể duyệt khi trạng thái là yêu cầu từ user hoặc đã từ chối!');
      }

      // 3. Lấy roleId cho thư ký và ban kiểm soát
      const secretaryRole = await this.rolesModel
        .findOne({ roleCode: USER_ROLE.PRESIDE_SECRETARY })
        .exec();
      const boardOfControlRole = await this.rolesModel
        .findOne({ roleCode: USER_ROLE.BOARD_OF_CONTROL })
        .exec();
      const presideRole = await this.rolesModel
        .findOne({ roleCode: USER_ROLE.PRESIDE })
        .exec();

      if (!secretaryRole || !boardOfControlRole || !presideRole) {
        throw new BadRequestException('Không tìm thấy role cần thiết!');
      }

      // 4. Kiểm tra và tạo/cập nhật participants nếu được chỉ định
      if (secretaryId) {
        const existingSecretary = await this.electionParticipantsModel
          .findOne({
            electionId: new Types.ObjectId(electionId),
            roleId: secretaryRole._id,
          })
          .exec();

        if (existingSecretary) {
          // Cập nhật participant thư ký
          existingSecretary.userId = new Types.ObjectId(secretaryId);
          existingSecretary.status = STATUS.ACTIVE;
          await existingSecretary.save();
        } else {
          // Tạo mới participant thư ký
          await this.electionParticipantsModel.create({
            electionId: new Types.ObjectId(electionId),
            userId: new Types.ObjectId(secretaryId),
            roleId: secretaryRole._id,
            position: 'Thư ký chủ tọa',
            status: STATUS.ACTIVE,
            createdBy: new Types.ObjectId(userId),
          });
        }
      }

      if (boardOfControlId) {
        const existingBoardOfControl = await this.electionParticipantsModel
          .findOne({
            electionId: new Types.ObjectId(electionId),
            roleId: boardOfControlRole._id,
          })
          .exec();

        if (existingBoardOfControl) {
          // Cập nhật participant ban kiểm soát
          existingBoardOfControl.userId = new Types.ObjectId(boardOfControlId);
          existingBoardOfControl.status = STATUS.ACTIVE;
          await existingBoardOfControl.save();
        } else {
          // Tạo mới participant ban kiểm soát
          await this.electionParticipantsModel.create({
            electionId: new Types.ObjectId(electionId),
            userId: new Types.ObjectId(boardOfControlId),
            roleId: boardOfControlRole._id,
            position: 'Ban kiểm soát',
            status: STATUS.ACTIVE,
            createdBy: new Types.ObjectId(userId),
          });
        }
      }

      // 5. Tạo participant cho người tạo (chủ tọa) nếu chưa có
      const existingCreator = await this.electionParticipantsModel
        .findOne({
          electionId: new Types.ObjectId(electionId),
          userId: election.createdBy,
          roleId: presideRole._id,
        })
        .exec();

      if (!existingCreator && election.createdBy) {
        await this.electionParticipantsModel.create({
          electionId: new Types.ObjectId(electionId),
          userId: election.createdBy,
          roleId: presideRole._id,
          position: 'Chủ tọa',
          status: STATUS.ACTIVE,
          createdBy: new Types.ObjectId(userId),
        });
      }

      // 6. Cập nhật tất cả participants thành ACTIVE
      await this.electionParticipantsModel.updateMany(
        { electionId: new Types.ObjectId(electionId) },
        { $set: { status: STATUS.ACTIVE } },
      );

      // 7. Cập nhật statusData thành WAIT_ENTER_DATA
      election.statusData = STATUS.WAIT_ENTER_DATA;
      election.updatedBy = new Types.ObjectId(userId);
      await election.save();

      // 8. Gửi thông báo cho người tạo election
      if (election.createdBy) {
        await this.notificationService.notifyUser(
          String(election.createdBy),
          `Cuộc bầu cử "${election.title}" đã được duyệt và chuyển sang giai đoạn nhập dữ liệu!`,
        );
      }

      // 9. Gửi email thông báo cho tất cả participants
      try {
        const participantsWithDetails = await this.electionParticipantsModel
          .find({ electionId: new Types.ObjectId(electionId) })
          .populate('userId', 'email fullName')
          .populate('roleId', 'roleName')
          .exec();

        for (const participant of participantsWithDetails) {
          const user = participant.userId as any;
          const role = participant.roleId as any;

          if (user && user.email && role) {
            await this.mailService.sendElectionApprovalEmail(
              user.email,
              user.fullName || 'Thành viên',
              election.title,
              role.roleName || 'Thành viên',
              election.startDate || undefined,
              undefined,
            );
          }
        }
      } catch (emailError) {
        console.error('Error sending approval emails:', emailError);
      }

      return election;
    } catch (error) {
      throw error;
    }
  }

  private async checkElectionExists(createElection: CreateElectionDto) {
    const { title, decisionNumber, decisionName } = createElection;
    const titleExist = await this.electionsModel.exists({
      title: title,
    });
    if (titleExist) {
      throw new Error(MESSAGE.ELECTION_TITLE_ALREADY_EXISTS);
    }
    const decisionNumberExist = await this.electionsModel.exists({
      decisionNumber: decisionNumber,
    });
    if (decisionNumberExist) {
      throw new Error(MESSAGE.ELECTION_NUMBER_ALREADY_EXISTS);
    }
    const decisionNameExist = await this.electionsModel.exists({
      decisionName: decisionName,
    });
    if (decisionNameExist) {
      throw new Error(MESSAGE.ELECTION_NAME_ALREADY_EXISTS);
    }
    return true;
  }

  private async checkRelatedIds(createElection: CreateElectionDto) {
    const { typeId, votingMethodId, thresholdId } = createElection;
    //Kiểm tra electionType có tồn tại hay Không
    if (typeId) {
      const electionTypeExist = await this.electionTypeModel.exists({
        _id: new Types.ObjectId(typeId),
      });
      if (!electionTypeExist) {
        throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
      }
    }

    //Kiểm tra voting method có tồn tại hay Không
    if (votingMethodId) {
      const votingMethodExist = await this.votingMethodModel.exists({
        _id: new Types.ObjectId(votingMethodId),
      });
      if (!votingMethodExist) {
        throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
      }
    }

    //Kiểm tra threshold có tồn tại hay Không
    if (thresholdId) {
      const thresholdExist = await this.thresholdModel.exists({
        _id: new Types.ObjectId(thresholdId),
      });
      if (!thresholdExist) {
        throw new Error(MESSAGE.THRESHOLD_NOT_FOUND);
      }
    }
    return true;
  }

  private async checkDate(createElection: CreateElectionDto) {
    const { startDate, endDate, delegationStart, delegationEnd } = createElection;

    // 2. Ngày bắt đầu ≥ ngày tạo + 20 ngày
    if (startDate) {
      const createdAt = getCurrentDateVN();
      const start = new Date(startDate);

      const minStart = new Date(createdAt);
      minStart.setDate(minStart.getDate() + 20);

      if (start < minStart) {
        throw new Error("Ngày bắt đầu cuộc bầu cử phải lớn hơn ngày tạo ít nhất 20 ngày");
      }
    }


    // 3. Delegation: delEnd > delStart
    if (delegationStart && delegationEnd) {
      const delStart = new Date(delegationStart);
      const delEnd = new Date(delegationEnd);

      if (delEnd <= delStart) {
        throw new BadRequestException(
          "Ngày kết thúc ủy quyền phải sau ngày bắt đầu ủy quyền"
        );
      }
    }

    // 4. DelegationEnd ≤ startDate - 10 ngày
    if (delegationEnd && startDate) {
      const delEnd = new Date(delegationEnd);
      const start = new Date(startDate);

      const minStart = new Date(delEnd);
      minStart.setDate(minStart.getDate() + 10);

      if (start < minStart) {
        throw new Error(
          "Ngày kết thúc ủy quyền phải nhỏ hơn ngày bắt đầu bầu cử ít nhất 10 ngày"
        );
      }
    }

    // 5. DelegationStart phải trước startDate
    if (delegationStart && startDate) {
      if (new Date(delegationStart) >= new Date(startDate)) {
        throw new Error("Ngày bắt đầu ủy quyền phải nhỏ hơn ngày bắt đầu cuộc bầu cử");
      }
    }
  }
  private async checkElectionExistsInUpdate(updateElection: UpdateElectionDto, id: string) {
    const { title, decisionNumber, decisionName } = updateElection;

    //kiểm tra electionId có tồn tại không
    const electionExist = await this.electionsModel.exists({ _id: id });
    if (!electionExist) {
      throw new Error(MESSAGE.ELECTION_NOT_FOUND);
    }

    if (title) {
      const exist = await this.electionsModel.exists({
        title,
        _id: { $ne: id },
      });
      if (exist) throw new Error(MESSAGE.ELECTION_TITLE_ALREADY_EXISTS);
    }

    if (decisionNumber) {
      const exist = await this.electionsModel.exists({
        decisionNumber,
        _id: { $ne: id },
      });
      if (exist) throw new Error(MESSAGE.ELECTION_NUMBER_ALREADY_EXISTS);
    }

    if (decisionName) {
      const exist = await this.electionsModel.exists({
        decisionName,
        _id: { $ne: id },
      });
      if (exist) throw new Error(MESSAGE.ELECTION_NAME_ALREADY_EXISTS);
    }
  }
  private async checkDateInUpdate(updateElection: UpdateElectionDto, id: string) {
    const { startDate, endDate, delegationStart, delegationEnd } = updateElection;


    // 3. Delegation: delEnd > delStart
    if (delegationStart && delegationEnd) {
      const delStart = new Date(delegationStart);
      const delEnd = new Date(delegationEnd);
      if (delEnd <= delStart) {
        throw new BadRequestException("Ngày kết thúc ủy quyền phải sau ngày bắt đầu ủy quyền");
      }
    }

    // 4. DelegationEnd ≤ startDate - 10 ngày
    if (delegationEnd && startDate) {
      const delEnd = new Date(delegationEnd);
      const start = new Date(startDate);

      const minStart = new Date(delEnd);
      minStart.setDate(minStart.getDate() + 10);

      if (start < minStart) {
        throw new Error("Ngày kết thúc ủy quyền phải nhỏ hơn ngày bắt đầu bầu cử ít nhất 10 ngày");
      }
    }

    // 5. DelegationStart < startDate
    if (delegationStart && startDate) {
      if (new Date(delegationStart) >= new Date(startDate)) {
        throw new Error("Ngày bắt đầu ủy quyền phải nhỏ hơn ngày bắt đầu cuộc bầu cử");
      }
    }
  }
  private async checkRelatedIdsInUpdate(updateElection: UpdateElectionDto) {
    const { typeId, votingMethodId, thresholdId } = updateElection;
    //Kiểm tra electionType có tồn tại hay Không
    if (typeId) {
      const electionTypeExist = await this.electionTypeModel.exists({
        _id: new Types.ObjectId(typeId),
      });
      if (!electionTypeExist) {
        throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
      }
    }

    //Kiểm tra voting method có tồn tại hay Không
    if (votingMethodId) {
      const votingMethodExist = await this.votingMethodModel.exists({
        _id: new Types.ObjectId(votingMethodId),
      });
      if (!votingMethodExist) {
        throw new Error(MESSAGE.VOTING_METHOD_NOT_FOUND);
      }
    }

    //Kiểm tra threshold có tồn tại hay Không
    if (thresholdId) {
      const thresholdExist = await this.thresholdModel.exists({
        _id: new Types.ObjectId(thresholdId),
      });
      if (!thresholdExist) {
        throw new Error(MESSAGE.THRESHOLD_NOT_FOUND);
      }
    }
    return true;
  }

  async cloneElectionForReelection(
    originalElectionId: string,
    newStartDate: Date,
    newEndDate: Date,
    startStage: string,
    userId: string,
  ) {
    try {
      const originalElection = await this.electionsModel
        .findById(originalElectionId)
        .lean()
        .exec();

      if (!originalElection) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      // Mặc định startStage = 'voting' nếu không có
      const finalStartStage = startStage || 'voting';

      // Xác định các stage cần clone dựa trên startStage
      const stageOrder = ['checkin', 'report', 'voting', 'result', 'closing'];
      const startStageIndex = finalStartStage ? stageOrder.indexOf(finalStartStage) : -1;
      const stagesToClone = startStageIndex >= 0 ? stageOrder.slice(0, startStageIndex + 1) : [];

      // Clone timeline và stages từ election cũ
      const clonedTimeline: any = {};
      const clonedStages: any = {};

      if (originalElection.timeline) {
        stagesToClone.forEach((stage) => {
          // Không clone timeline của voting khi startStage = 'voting'
          if (stage === 'voting' && finalStartStage === 'voting') {
            return;
          }
          const timelineField = this.getTimelineFieldForStage(stage);
          if (timelineField && originalElection.timeline[timelineField]) {
            clonedTimeline[timelineField] = originalElection.timeline[timelineField];
          }
        });
      }

      if (originalElection.stages) {
        stagesToClone.forEach((stage) => {
          if (originalElection.stages[stage]) {
            // Nếu là stage hiện tại (voting) thì để null, các stage trước set COMPLETED
            if (stage === finalStartStage && finalStartStage === 'voting') {
              clonedStages[stage] = null; // voting để null
            } else if (stage === finalStartStage) {
              clonedStages[stage] = 'STARTED';
            } else {
              clonedStages[stage] = 'COMPLETED';
            }
          }
        });
      }

      // Set timeline và stage cho stage hiện tại nếu chưa có (trừ voting)
      if (finalStartStage && finalStartStage !== 'voting') {
        const timelineField = this.getTimelineFieldForStage(finalStartStage);
        if (timelineField && !clonedTimeline[timelineField]) {
          clonedTimeline[timelineField] = new Date();
        }
        if (!clonedStages[finalStartStage]) {
          clonedStages[finalStartStage] = 'STARTED';
        }
      }

      // Tạo election mới (clone từ election cũ)
      const newElectionData: any = {
        title: `${originalElection.title} (Bầu cử lại)`,
        typeId: originalElection.typeId,
        votingMethodId: originalElection.votingMethodId,
        thresholdId: originalElection.thresholdId,
        startDate: newStartDate,
        endDate: newEndDate,
        delegationStart: originalElection.delegationStart,
        delegationEnd: originalElection.delegationEnd,
        decisionNumber: originalElection.decisionNumber,
        decisionName: originalElection.decisionName,
        status: STATUS.ACTIVE,
        statusData: 'REMAKE',
        createByUser: originalElection.createByUser,
        createdBy: new Types.ObjectId(userId),
        timeline: Object.keys(clonedTimeline).length > 0 ? clonedTimeline : null,
        stages: Object.keys(clonedStages).length > 0 ? clonedStages : null,
      };

      const newElection = await this.electionsModel.create(newElectionData);
      const newElectionId = newElection._id;

      // Clone Voters
      const originalVoters = await this.voterModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalVoters.length > 0) {
        const newVoters = originalVoters.map((voter) => ({
          ...voter,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.voterModel.insertMany(newVoters);
      }

      // Clone VotingRights
      const originalVotingRights = await this.votingRightsModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalVotingRights.length > 0) {
        // Lấy danh sách voter mới để map voterId
        const newVotersMap = new Map();
        const newVotersList = await this.voterModel
          .find({ electionId: newElectionId })
          .lean()
          .exec();

        // Map voter cũ sang voter mới dựa trên userId
        for (const oldVoter of originalVoters) {
          const newVoter = newVotersList.find(
            (nv) => String(nv.userId) === String(oldVoter.userId),
          );
          if (newVoter) {
            newVotersMap.set(String(oldVoter._id), String(newVoter._id));
          }
        }

        const newVotingRights = originalVotingRights
          .map((vr) => {
            const newVoterId = newVotersMap.get(String(vr.voterId));
            if (!newVoterId) return null;
            return {
              ...vr,
              _id: new Types.ObjectId(),
              electionId: newElectionId,
              voterId: new Types.ObjectId(newVoterId),
              createdAt: getCurrentDateVN(),
              updatedAt: getCurrentDateVN(),
            };
          })
          .filter((vr) => vr !== null);

        if (newVotingRights.length > 0) {
          await this.votingRightsModel.insertMany(newVotingRights);
        }
      }

      // Clone ElectionParticipants
      const originalParticipants = await this.electionParticipantsModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalParticipants.length > 0) {
        const newParticipants = originalParticipants.map((participant) => ({
          ...participant,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          status: STATUS.ACTIVE, // Participants mới phải luôn là ACTIVE
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.electionParticipantsModel.insertMany(newParticipants);
      }

      // Clone ElectionEntities
      const originalEntities = await this.electionEntitiesModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalEntities.length > 0) {
        // Map participant cũ sang participant mới
        const participantsMap = new Map();
        const newParticipantsList = await this.electionParticipantsModel
          .find({ electionId: newElectionId })
          .lean()
          .exec();

        for (const oldParticipant of originalParticipants) {
          const newParticipant = newParticipantsList.find(
            (np) => String(np.userId) === String(oldParticipant.userId),
          );
          if (newParticipant) {
            participantsMap.set(String(oldParticipant._id), String(newParticipant._id));
          }
        }

        const newEntities = originalEntities
          .map((entity) => {
            const newProposerId = entity.proposerId
              ? participantsMap.get(String(entity.proposerId))
              : null;
            return {
              ...entity,
              _id: new Types.ObjectId(),
              electionId: newElectionId,
              proposerId: newProposerId ? new Types.ObjectId(newProposerId) : null,
              createdAt: getCurrentDateVN(),
              updatedAt: getCurrentDateVN(),
            };
          })
          .filter((e) => e !== null);

        if (newEntities.length > 0) {
          await this.electionEntitiesModel.insertMany(newEntities);
        }
      }

      // Clone Delegations (nếu có)
      const originalDelegations = await this.delegationModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalDelegations.length > 0) {
        const newDelegations = originalDelegations.map((delegation) => ({
          ...delegation,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          status: STATUS.PENDING,
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.delegationModel.insertMany(newDelegations);
      }

      // Clone ElectionDocuments (trừ results)
      const originalDocuments = await this.electionDocumentsModel
        .find({
          electionId: new Types.ObjectId(originalElectionId),
          type: { $ne: FileType.ELECTION_RESULT },
        })
        .lean()
        .exec();

      if (originalDocuments.length > 0) {
        const newDocuments = originalDocuments.map((doc) => ({
          ...doc,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.electionDocumentsModel.insertMany(newDocuments);
      }

      // Clone Meeting
      const originalMeeting = await this.meetingsModel
        .findOne({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      let newMeetingId: Types.ObjectId | null = null;
      if (originalMeeting) {
        const { _id, ...meetingDataWithoutId } = originalMeeting;
        const newMeeting = await this.meetingsModel.create({
          ...meetingDataWithoutId,
          electionId: newElectionId,
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        });
        if (newMeeting && newMeeting._id) {
          newMeetingId = typeof newMeeting._id === 'string'
            ? new Types.ObjectId(newMeeting._id)
            : (newMeeting._id as Types.ObjectId);
        }
      }

      // Clone MeetingAttendees
      const originalMeetingAttendees = await this.meetingAttendeesModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalMeetingAttendees.length > 0) {
        const newMeetingAttendees = originalMeetingAttendees.map((attendee) => ({
          ...attendee,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          meetingId: newMeetingId || attendee.meetingId,
          // Nếu startStage là checkin thì set attended = false
          attended: startStage === 'checkin' ? false : attendee.attended,
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.meetingAttendeesModel.insertMany(newMeetingAttendees);
      }

      // Clone DelegateCard
      const originalDelegateCards = await this.delegateCardModel
        .find({ electionId: new Types.ObjectId(originalElectionId) })
        .lean()
        .exec();

      if (originalDelegateCards.length > 0) {
        const newDelegateCards = originalDelegateCards.map((card) => ({
          ...card,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.delegateCardModel.insertMany(newDelegateCards);
      }

      // Clone Ballots - clone tất cả ballots với status mặc định và allocations = null
      const originalBallots = await this.ballotsModel
        .find({
          electionId: new Types.ObjectId(originalElectionId),
        })
        .lean()
        .exec();

      if (originalBallots.length > 0) {
        const newBallots = originalBallots.map((ballot) => ({
          ...ballot,
          _id: new Types.ObjectId(),
          electionId: newElectionId,
          status: STATUS.DRAFT, // Status mặc định từ schema
          allocations: null, // Set allocations thành null
          attempts: 0, // Set attempts về 0
          statusData: null, // Reset statusData
          issuedAt: null, // Reset issuedAt
          castAt: null, // Reset castAt
          createdAt: getCurrentDateVN(),
          updatedAt: getCurrentDateVN(),
        }));
        await this.ballotsModel.insertMany(newBallots);
      }

      // Update election cũ:
      // - status = INACTIVE
      // - statusData = 'REMAKE'
      // - stages: các stage chưa có giá trị → 'STOPED', các stage đã có → giữ nguyên nếu đã COMPLETED, nếu đang STARTED/khác thì cũng chuyển về 'STOPED'
      const originalStages = (originalElection as any).stages || {};
      const normalizedOldStages: any = {
        checkin: originalStages.checkin || null,
        report: originalStages.report || null,
        voting: originalStages.voting || null,
        result: originalStages.result || null,
        closing: originalStages.closing || null,
      };

      const updatedOldStages: any = {};
      (['checkin', 'report', 'voting', 'result', 'closing'] as const).forEach(
        (stage) => {
          const value = normalizedOldStages[stage];
          if (!value || value === 'STARTED') {
            updatedOldStages[stage] = 'STOPED';
          } else {
            updatedOldStages[stage] = value;
          }
        },
      );

      await this.electionsModel.findByIdAndUpdate(
        new Types.ObjectId(originalElectionId),
        {
          status: STATUS.INACTIVE,
          statusData: 'ABNORMAL_REMAKE',
          stages: updatedOldStages,
          updatedBy: new Types.ObjectId(userId),
        },
        { new: true },
      );

      // Disable tất cả participants là VOTER trong cuộc bầu cử cũ (voter không còn thấy election cũ nữa)
      const voterRole = await this.rolesModel
        .findOne({ roleCode: USER_ROLE.VOTER })
        .exec();
      if (voterRole) {
        await this.electionParticipantsModel.updateMany(
          {
            electionId: new Types.ObjectId(originalElectionId),
            roleId: voterRole._id,
          },
          {
            status: STATUS.INACTIVE,
            updatedAt: getCurrentDateVN(),
            updatedBy: new Types.ObjectId(userId),
          },
        );
      }

      // Cập nhật Meeting cũ (nếu có) sang trạng thái kết thúc
      await this.meetingsModel.updateMany(
        { electionId: new Types.ObjectId(originalElectionId) },
        {
          status: STATUS.COMPLETED,
          updatedAt: getCurrentDateVN(),
        },
      );

      return {
        newElectionId: newElection._id,
        election: newElection,
      };
    } catch (error) {
      throw error;
    }
  }

  private getTimelineFieldForStage(stage: string): string | null {
    const stageMap: { [key: string]: string } = {
      checkin: 'checkinAt',
      report: 'reportAt',
      voting: 'votingAt',
      result: 'resultAnnouncedAt',
      closing: 'closingAt',
    };
    return stageMap[stage] || null;
  }

}
