import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateElectionParticipantDto } from './dto/create-election-participant.dto';
import { UpdateElectionParticipantDto } from './dto/update-election-participant.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Model, StringExpressionOperator } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';
import { USER_ROLE } from 'src/common/enums/config.enum';
import {
  RolePermissions,
  RolePermissionsDocument,
} from 'src/database/schemas/rolePermissions.schema';
import { Voters, VotersDocument } from 'src/database/schemas/voters.schema';
import { Permissions, PermissionsDocument } from 'src/database/schemas/permissions.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { Meetings } from 'src/database/schemas/meetings.schema';

@Injectable()
export class ElectionParticipantsService {
  constructor(
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<Roles>,
    @InjectModel(RolePermissions.name)
    private readonly rolePermissionModel: Model<RolePermissionsDocument>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<VotersDocument>,
    @InjectModel(Permissions.name)
    private readonly permissionsModel: Model<PermissionsDocument>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
  ) { }
  async getParticipantsAsVoter(electionId: string) {
    try {
      //kiểm tra xem electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }
      // Tìm role có roleCode là VOTER
      const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
      if (!voterRole) {
        throw new NotFoundException('Không tìm thấy role VOTER trong hệ thống');
      }

      // Lấy danh sách participants có role là VOTER
      const participants = await this.electionParticipantsModel
        .find({
          electionId: new Types.ObjectId(electionId),
          roleId: voterRole._id,
        })
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'roleId', select: 'roleName roleCode description status' },
          { path: 'userId', select: 'fullName username email phone position department' },
          { path: 'createdBy', select: 'fullName username email phone position' },
          { path: 'updatedBy', select: 'fullName username email phone position' },
        ])
        .exec();

      return participants;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const electionParticipant = await this.electionParticipantsModel
        .findById(new Types.ObjectId(id))
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'roleId' },
          { path: 'userId', select: 'fullName username email phone position department' },
          { path: 'createdBy', select: 'fullName username email phone position' },
          { path: 'updatedBy', select: 'fullName username email phone position' },
        ])
        .exec();
      if (!electionParticipant) {
        throw new NotFoundException(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      return electionParticipant;
    } catch (error) {
      throw error;
    }
  }

  async getByElection(electionId: string) {
    try {
      //kiểm tra xem electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }
      const electionParticipant = await this.electionParticipantsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'roleId' },
          { path: 'userId', select: 'fullName username email phone position department' },
          { path: 'createdBy', select: 'fullName username email phone position' },
          { path: 'updatedBy', select: 'fullName username email phone position' },
        ])
        .exec();
      if (!electionParticipant) {
        throw new NotFoundException(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      return electionParticipant;
    } catch (error) {
      throw error;
    }
  }

  async getByUserId(userId: string) {
    try {
      //kiểm tra xem userId có tồn tại không
      const userExist = await this.usersModel.exists({ _id: userId });
      if (!userExist) {
        throw new NotFoundException(MESSAGE.USER_NOT_FOUND);
      }
      const electionParticipants = await this.electionParticipantsModel
        .find({
          userId: new Types.ObjectId(userId),
          status: STATUS.ACTIVE
        })
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'roleId' },
          { path: 'userId', select: 'fullName username email phone position department' },
          { path: 'createdBy', select: 'fullName username email phone position' },
          { path: 'updatedBy', select: 'fullName username email phone position' },
        ])
        .lean()
        .exec();
      if (!electionParticipants) {
        throw new NotFoundException(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      const mapData = await Promise.all(
        electionParticipants.map(async (item) => {
          const rolePermission = await this.rolePermissionModel
            .findOne({ roleId: item.roleId._id })
            .populate('permissionIds', 'url')
            .exec();

          console.log(item)
          const voters = await this.votersModel.findOne({
            electionId: item.electionId._id,
            userId: item.userId._id,
          });

          // Lấy meeting status cho election này
          let meetingStatus: string = 'UNDEFINED';
          try {
            const meeting = await this.meetingsModel
              .findOne({ electionId: item.electionId._id })
              .select('status')
              .lean()
              .exec();

            if (meeting && meeting.status) {
              meetingStatus = meeting.status;
            }
          } catch (error) {
            console.error(`Error fetching meeting status for election ${item.electionId._id}:`, error);
            // Giữ nguyên meetingStatus = 'UNDEFINED' nếu có lỗi
          }

          const permissionElections =
            (rolePermission?.permissionIds as any[])?.map((p) => p.url) || [];

          return {
            ...item,
            permissionElections: permissionElections || [],
            voter: voters?._id || null,
            meetingStatus: meetingStatus,
          };
        }),
      );
      return mapData;
    } catch (error) {
      throw error;
    }
  }

  async getParticipantsActive(electionId: string) {
    try {
      const participantsActive = await this.electionParticipantsModel
        .find({
          electionId: new Types.ObjectId(electionId),
          status: STATUS.ACTIVE,
        })
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'roleId' },
          { path: 'userId', select: 'fullName username email phone position department' },
          { path: 'createdBy', select: 'fullName username email phone position' },
          { path: 'updatedBy', select: 'fullName username email phone position' },
        ])
        .lean();
      return participantsActive;
    } catch (error) {
      throw error;
    }
  }

  async create(electionParticipants: CreateElectionParticipantDto, userId: string) {
    try {
      //Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.exists({
        _id: electionParticipants.electionId,
      });
      if (!electionExists) {
        throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Kiểm tra userId có tồn tại không
      const userExists = await this.usersModel.exists({ _id: electionParticipants.userId });
      if (!userExists) {
        throw new NotFoundException(MESSAGE.USER_NOT_FOUND);
      }

      //Kiểm tra user đã trong cuộc bầu cử chưa
      const participantsExist = await this.electionParticipantsModel.findOne({
        electionId: new Types.ObjectId(electionParticipants.electionId),
        userId: new Types.ObjectId(electionParticipants.userId),
      });
      if (participantsExist) {
        throw new Error(MESSAGE.ELECTION_PARTICIPANT_ALREADY_EXIST);
      }

      // 3. Kiểm tra roleId có tồn tại không
      const roleExists = await this.rolesModel.exists({ _id: electionParticipants.roleId });
      if (!roleExists) {
        throw new NotFoundException(MESSAGE.ROLE_NOT_FOUND);
      }

      // Chuyển đổi string IDs sang ObjectId
      const electionParticipant = await this.electionParticipantsModel.create({
        ...electionParticipants,
        electionId: new Types.ObjectId(electionParticipants.electionId),
        userId: new Types.ObjectId(electionParticipants.userId),
        roleId: new Types.ObjectId(electionParticipants.roleId),
        createdBy: new Types.ObjectId(userId) || null,
      });
      return electionParticipant;
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string) {
    try {

      const result = await this.electionParticipantsModel
        .findByIdAndUpdate(new Types.ObjectId(id), { status: STATUS.INACTIVE, }, { new: true }).exec();
      //Kiểm tra nếu không tìm thấy participant
      if (!result) {
        throw new NotFoundException(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateElectionParticipantDto: UpdateElectionParticipantDto, userId: string) {
    try {
      const { electionId, userId: participantUserId, roleId } = updateElectionParticipantDto;
      //Kiểm tra electionId có tồn tại không
      if (electionId) {
        const electionExists = await this.electionsModel.exists({
          _id: electionId,
        });
        if (!electionExists) {
          throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
        }
      }
      //Kiểm tra userId có tồn tại không
      if (participantUserId) {
        const userExists = await this.usersModel.exists({ _id: participantUserId });
        if (!userExists) {
          throw new NotFoundException(MESSAGE.USER_NOT_FOUND);
        }
      }
      //Kiểm tra roleId có tồn tại không
      if (roleId) {
        const roleExists = await this.rolesModel.exists({ _id: roleId });
        if (!roleExists) {
          throw new NotFoundException(MESSAGE.ROLE_NOT_FOUND);
        }
      }
      //Kiểm tra participant có tồn tại không
      const participantExist = await this.electionParticipantsModel.exists({ _id: id });
      if (!participantExist) {
        throw new NotFoundException(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      const updatedParticipant = await this.electionParticipantsModel
        .findByIdAndUpdate(
          new Types.ObjectId(id),
          {
            ...updateElectionParticipantDto,
            updatedBy: userId ? new Types.ObjectId(userId) : null
          },
          { new: true },
        )
        .populate([
          {
            path: 'electionId',
            select:
              'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          },
          { path: 'roleId' },
          { path: 'userId', select: 'fullName username email phone position department' },
          { path: 'createdBy', select: 'fullName username email phone position' },
          { path: 'updatedBy', select: 'fullName username email phone position' },
        ])
        .exec();
      return updatedParticipant;
    } catch (error) {
      throw error;
    }
  }



}
