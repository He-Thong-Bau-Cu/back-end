import { BadRequestException, Injectable } from '@nestjs/common';
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
import removeVietnameseTones, { isValidateTimeline } from 'src/common/utils/format';
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

    const electionIds = elections.map(e => e._id);

    // 2. Lấy tất cả participant trong các election này
    const electionParticipants = await this.electionParticipantsModel
      .find({
        electionId: { $in: electionIds },
      })
      .populate('userId')
      .exec();

    // 3. Lấy danh sách user bận
    const busyUserIds = electionParticipants.map(item => item.userId._id);

    // 4. Lấy role ADMIN và PRESIDE
    const roles = await this.rolesModel
      .find({
        $or: [{ roleCode: USER_ROLE.ADMIN }, { roleCode: USER_ROLE.PRESIDE }],
      })
      .exec();
    const roleIds = roles.map(role => role._id);

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
    const voterUserIds = voterUsers.map(v => String(v.userId));

    const voterParticipants = await this.electionParticipantsModel
      .find({ roleId: roleFilter._id }) // nếu roleId là ObjectId của role VOTER, sửa tương ứng
      .exec();
    const voterParticipantIds = voterParticipants.map(p => String(p.userId));

    availableUsers = availableUsers.filter(u =>
      !voterUserIds.includes(String(u._id)) &&
      !voterParticipantIds.includes(String(u._id))
    );

    return availableUsers;
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
      const { electionId, meetingInfo, electionEntities, electionDocuments, voters, participants, isSubmitForApproval } = dto;

      // 1. Sử dụng trực tiếp typeId và thresholdId
      const typeId = meetingInfo.type as string;
      const thresholdId = meetingInfo.threshold as string;

      // 2. Cập nhật Election
      const electionUpdate: any = {
        typeId: typeId ? new Types.ObjectId(typeId) : null,
        votingMethodId: meetingInfo.method ? new Types.ObjectId(meetingInfo.method) : null,
        thresholdId: thresholdId ? new Types.ObjectId(thresholdId) : null,
        delegationStart: meetingInfo.authorizationStart ? new Date(meetingInfo.authorizationStart) : null,
        delegationEnd: meetingInfo.authorizationEnd ? new Date(meetingInfo.authorizationEnd) : null,
      };

      if (isSubmitForApproval) {
        electionUpdate.statusData = 'WAIT_APROVAL';
      }

      const updatedElection = await this.electionsModel.findByIdAndUpdate(
        new Types.ObjectId(electionId),
        electionUpdate,
        { new: true }
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
              { new: true }
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
              { new: true }
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

          if (voter && voterItem.percentage !== undefined) {
            // Create or update voting right
            const existingVotingRight = await this.votingRightsModel.findOne({
              electionId: new Types.ObjectId(electionId),
              voterId: voter._id,
            });

            if (existingVotingRight) {
              await this.votingRightsModel.findByIdAndUpdate(
                existingVotingRight._id,
                {
                  shares: voterItem.percentage,
                  updatedBy: new Types.ObjectId(userId),
                }
              );
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
              { new: true }
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
              { new: true }
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
          { new: true }
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

      // 8. Xử lý MeetingAttendees cho participants có role voter
      if (participants && Array.isArray(participants) && meeting) {
        // Lấy role voter
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          // Lọc participants có role voter
          const voterParticipants = participants.filter(
            (p: any) => String(p.roleId) === String(voterRole._id)
          );

          // Xóa các meetingAttendees cũ của meeting này
          await this.meetingAttendeesModel.deleteMany({
            meetingId: meeting._id,
          });

          // Tạo meetingAttendees mới cho voter participants
          for (const voterParticipant of voterParticipants) {
            // Tìm participant record để lấy _id
            let participantRecord;
            if (voterParticipant._id) {
              participantRecord = await this.electionParticipantsModel.findById(
                new Types.ObjectId(voterParticipant._id)
              );
            } else {
              // Nếu chưa có _id, tìm participant vừa tạo
              participantRecord = await this.electionParticipantsModel.findOne({
                electionId: new Types.ObjectId(electionId),
                userId: new Types.ObjectId(voterParticipant.userId),
                roleId: new Types.ObjectId(voterParticipant.roleId),
              });
            }

            if (participantRecord) {
              await this.meetingAttendeesModel.create({
                meetingId: meeting._id,
                participantId: participantRecord._id,
                checkInTime: meeting.meetingDate || updatedElection.startDate,
                attended: false,
                createdBy: new Types.ObjectId(userId),
              });
            }
          }
        }
      }

      return { success: true, message: isSubmitForApproval ? 'Gửi duyệt thành công' : 'Lưu nháp thành công' };
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
      const typeId = election.typeId ? (election.typeId instanceof Types.ObjectId ? election.typeId : new Types.ObjectId(election.typeId)) : null;
      const methodId = election.votingMethodId ? (election.votingMethodId instanceof Types.ObjectId ? election.votingMethodId : new Types.ObjectId(election.votingMethodId)) : null;
      const thresholdId = election.thresholdId ? (election.thresholdId instanceof Types.ObjectId ? election.thresholdId : new Types.ObjectId(election.thresholdId)) : null;

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
        const votingRight = votingRights.find(
          (vr) => String(vr.voterId) === String(voter._id)
        );
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
          if (participant.userId && typeof participant.userId === 'object' && '_id' in participant.userId) {
            // Đã được populate, extract _id
            participantObj.userId = String(participant.userId._id);
            participantObj.user = participant.userId;
          } else {
            // Chưa được populate hoặc là string/ObjectId, convert sang string
            participantObj.userId = String(participant.userId);
          }
        }
        if (participant.roleId) {
          if (participant.roleId && typeof participant.roleId === 'object' && '_id' in participant.roleId) {
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
