import { Injectable } from '@nestjs/common';
import { CreateBallotDto } from './dto/create-ballot.dto';
import { UpdateBallotDto } from './dto/update-ballot.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { Users } from 'src/database/schemas/users.schema';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { paginate } from 'src/common/dto/paignation';
import { NotificationService } from '../notification/notification.service';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import * as os from 'os';
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import signer, { plainAddPlaceholder } from 'node-signpdf';
import { VerifyOtpDto } from 'src/common/dto/verify-otp.dto';
import { RedisService } from '../redis/redis.service';
import { getCurrentDateVN } from 'src/common/utils/format';

@ApiBearerAuth('access-token')
@Injectable()
export class BallotsService {
  constructor(
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(ElectionEntities.name)
    private readonly electionEntitiesModel: Model<ElectionEntities>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,
    @InjectModel(ElectionTypes.name)
    private readonly electionTypesModel: Model<ElectionTypes>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
    private readonly notificationService: NotificationService,
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
    private readonly signingService: SigningService,
    private readonly fileService: MinioService,
    private readonly redisService: RedisService,
  ) { }

  async getById(id: string) {
    try {
      //Check if the ballot is exist
      const ballotExist = await this.ballotsModel.exists({ _id: id });
      if (!ballotExist) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      const ballot = await this.ballotsModel
        .findById(new Types.ObjectId(id))
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: 'username fullName email position',
            },
          ],
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      return ballot;
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

      const ballots = await this.ballotsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: 'username fullName email position',
            },
          ],
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the ballots is exist
      if (!ballots) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }
      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterId(voterId: string) {
    try {
      //Check if the voter is exist
      const voterExist = await this.votersModel.exists({ _id: voterId });
      if (!voterExist) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      const ballots = await this.ballotsModel
        .find({ voterId: new Types.ObjectId(voterId) })
        .populate({
          path: 'electionId',
          populate: [
            { path: 'typeId', select: 'typeName typeCode description status' },
            { path: 'votingMethodId', select: 'methodName methodCode description status' },
            { path: 'thresholdId', select: 'thresholdName thresholdCode value description status' },
          ],
          select:
            'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        })
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: 'username fullName email position',
            },
          ],
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the ballots is exist
      if (!ballots) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterAndCast(voterId: string) {
    try {
      //Check if the voter is exist
      const voterExist = await this.votersModel.exists({ _id: voterId });
      if (!voterExist) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      const ballots = await this.ballotsModel
        .find({ voterId: new Types.ObjectId(voterId), status: { $in: [STATUS.CAST, STATUS.BLANK] } })
        .populate({
          path: 'electionId',
          select:
            'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          populate: [
            { path: 'typeId', select: 'typeName typeCode description status' },
            { path: 'votingMethodId', select: 'methodName methodCode description status' },
            { path: 'thresholdId', select: 'thresholdName thresholdCode value description status' },
          ],
        })
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: 'username fullName email position',
            },
          ],
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //Check if the ballots is exist
      if (!ballots) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      return ballots;
    } catch (error) {
      throw error;
    }
  }

  async create(createBallot: CreateBallotDto, userId: string) {
    try {
      //Check election exists
      const electionExists = await this.electionsModel.findOne({
        _id: new Types.ObjectId(createBallot.electionId),
      });
      if (electionExists) {
        if (electionExists.status && electionExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check voter exists
      const voterExists = await this.votersModel.findOne({
        _id: new Types.ObjectId(createBallot.voterId),
      });
      if (voterExists) {
        if (voterExists.status && voterExists.status !== STATUS.ACTIVE) {
          throw new Error(MESSAGE.VOTER_IS_NOT_ACTIVE);
        }
      } else {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      //Check ballots is exist
      const ballotExists = await this.ballotsModel.findOne({
        electionId: new Types.ObjectId(createBallot.electionId),
        voterId: new Types.ObjectId(createBallot.voterId),
      });
      if (ballotExists) {
        throw new Error(MESSAGE.BALLOT_ALREADY_EXISTS);
      }

      //Check election voting method
      const electionType = await this.electionTypesModel.findById(
        new Types.ObjectId(electionExists.typeId),
      );
      if (!electionType) {
        throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
      }
      if (electionType.typeCode === 'YES_NO_ABSTAIN') {
        if (createBallot.allocations.length !== 1) {
          throw new Error('This election allows only one choice.');
        }

        if (createBallot.allocations[0].voteValue !== 1) {
          throw new Error('You can only cast exactly 1 vote.');
        }
      }

      if (electionType.typeCode === 'CUMULATIVE') {
        for (const allocation of createBallot.allocations) {
          if (allocation.entityId == null || allocation.entityId === '') {
            throw new Error('Entity ID is required');
          } else {
            // Check if entityId exists in ElectionEntities
            const entityExists = await this.electionEntitiesModel.findById(
              new Types.ObjectId(allocation.entityId),
            );
            if (!entityExists) {
              throw new Error(`Entity with ID ${allocation.entityId} does not exist.`);
            }
          }
          if (allocation.voteValue < 0) {
            throw new Error(MESSAGE.BALLOT_VOTE_VALUE_GREATER_THAN_ZERO);
          }
        }
      }

      //Check votingRight shares and count > 0
      const votingRight = await this.votingRightsModel.findOne({
        voterId: new Types.ObjectId(createBallot.voterId),
        electionId: new Types.ObjectId(createBallot.electionId),
      });
      if (votingRight) {
        if (votingRight.shares <= 0 || votingRight.votes <= 0) {
          throw new Error(MESSAGE.VOTING_RIGHT_NOT_ELIGIBLE);
        }
        // Validate total allocated votes <= votingRight.votes
        const totalVotes = createBallot.allocations.reduce(
          (sum, item) => sum + Number(item.voteValue || 0),
          0,
        );
        if (totalVotes > votingRight.votes) {
          throw new Error(MESSAGE.BALLOT_VOTE_VALUE_INVALID);
        }

        if (totalVotes < 0 || isNaN(totalVotes)) {
          throw new Error(MESSAGE.BALLOT_VOTE_VALUE_GREATER_THAN_ZERO);
        }
      } else if (!votingRight) {
        throw new Error(MESSAGE.VOTING_RIGHT_NOT_FOUND);
      }

      const ballot = await this.ballotsModel.create({
        ...createBallot,
        electionId: new Types.ObjectId(createBallot.electionId),
        voterId: new Types.ObjectId(createBallot.voterId),
        createdBy: new Types.ObjectId(userId) ? new Types.ObjectId(userId) : null,
      });
      return ballot;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateBalllot: UpdateBallotDto, userId: string) {
    try {
      //Check if the ballot is exist
      const ballot = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballot) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      const wasCast = ballot.status === STATUS.CAST;
      const updateData: any = {
        ...updateBalllot,
      };

      if (updateBalllot.electionId) {
        updateData.electionId = new Types.ObjectId(updateBalllot.electionId);
      }

      if (updateBalllot.voterId) {
        updateData.voterId = new Types.ObjectId(updateBalllot.voterId);
      }

      if (userId) {
        updateData.updatedBy = new Types.ObjectId(userId);
      }

      if (updateBalllot.status === STATUS.CAST && !wasCast) {
        updateData.castAt = getCurrentDateVN();
      }

      const updatedBallot = await this.ballotsModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateData, { new: true })
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: 'username fullName email position',
            },
          ],
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .exec();

      // if (updatedBallot) {
      //   // Phát socket cho quản lý cuộc họp và voter list
      //   await this.emitBallotCastRealtime(updatedBallot.electionId as Types.ObjectId);
      // }

      return updatedBallot;
    } catch (error) {
      throw error;
    }
  }

  //Cập nhật trạng thái phiếu bầu thành active
  async updateStatus(id: string, userId: string) {
    try {
      //Check if the ballot is exist
      const ballotExist = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballotExist) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      //Check if the election is valid
      const electionExist = await this.electionsModel.findById(
        new Types.ObjectId(ballotExist.electionId),
      );
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      if (electionExist.status && electionExist.status !== STATUS.ACTIVE) {
        throw new Error(MESSAGE.ELECTION_IS_NOT_ACTIVE);
      }

      //Check if the voter is valid
      const voterExist = await this.votersModel.findById(new Types.ObjectId(ballotExist.voterId));
      if (!voterExist) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      if (voterExist.status && voterExist.status !== STATUS.ACTIVE) {
        throw new Error(MESSAGE.VOTER_IS_NOT_ACTIVE);
      }

      //Check the status of ballots is valid
      if (ballotExist.status === STATUS.ACTIVE) {
        throw new Error('Ballot is already active');
      }
      if (ballotExist.status === STATUS.LOCKED || ballotExist.status === STATUS.INVALID) {
        throw new Error('Ballot cannot be activated');
      }

      const updateBallots = await this.ballotsModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        {
          status: STATUS.ACTIVE,
          issuedAt: getCurrentDateVN(),
          updatedBy: new Types.ObjectId(userId) ? new Types.ObjectId(userId) : null,
        },
        { new: true },
      );
      return updateBallots;
    } catch (error) {
      throw error;
    }
  }

  // async getStatistics(electionId: string) {
  //   try {
  //     //Lấy tổng số phiếu của cuộc bầu cử
  //     const ballots = await this.ballotsModel.countDocuments({
  //       electionId: new Types.ObjectId(electionId),
  //     });

  //     //Lấy tổng số phiếu đã bình chọn và chưa bình chonk => pending và active
  //     const ballotStatus = await this.ballotsModel.aggregate([
  //       {
  //         $match: {
  //           electionId: new Types.ObjectId(electionId),
  //           status: { $in: [STATUS.PENDING, STATUS.CAST, STATUS.BLANK] },
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: '$status',
  //           totalBallots: { $sum: 1 },
  //         },
  //       },
  //     ]);

  //     let data = {
  //       total: ballots,
  //       ballotStatus,
  //     };
  //     await this.notificationService.transferDataRealTime(electionId, data);

  //     return {
  //       total: ballots,
  //       ballotStatus,
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
  async getStatistics(electionId: string) {
    try {
      const ballots = await this.ballotsModel.countDocuments({
        electionId: new Types.ObjectId(electionId),
      });

      const ballotStatusRaw = await this.ballotsModel.aggregate([
        {
          $match: {
            electionId: new Types.ObjectId(electionId),
            status: { $in: [STATUS.PENDING, STATUS.CAST, STATUS.BLANK] },
          },
        },
        {
          $group: {
            _id: '$status',
            totalBallots: { $sum: 1 },
          },
        },
      ]);

      // XỬ LÝ LOGIC BLANK + CAST
      let cast = 0;
      let pending = 0;

      ballotStatusRaw.forEach(item => {
        if (item._id === STATUS.CAST || item._id === STATUS.BLANK) {
          cast += item.totalBallots;
        }
        if (item._id === STATUS.PENDING) {
          pending = item.totalBallots;
        }
      });

      const ballotStatus = [
        { _id: STATUS.CAST, totalBallots: cast },
        { _id: STATUS.PENDING, totalBallots: pending },
      ];

      const data = {
        total: ballots,
        ballotStatus,
      };

      await this.notificationService.transferDataRealTime(electionId, data);

      return data;
    } catch (error) {
      throw error;
    }
  }


  async searchBallots(req: BaseSearchDTO) {
    try {
      const keyword = req.keyword || '';
      const page = req.page || 1;
      const limit = req.limit || 10;

      //search elections theo keyword tiếng Việt
      const matchedElections = await this.electionsModel
        .find({
          title: { $regex: keyword, $options: 'i' },
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();

      // lấy danh sách electionId match
      const electionIds = matchedElections.map((e) => e._id);

      // search voter info
      const matchedUsers = await this.usersModel
        .find({
          $or: [
            { fullName: { $regex: keyword, $options: 'i' } },
            { username: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } },
          ],
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();

      const userIds = matchedUsers.map((u) => u._id);

      // tìm voterId thuộc những user đó
      const matchedVoters = await this.votersModel.find({ userId: { $in: userIds } }).lean();

      const voterIds = matchedVoters.map((v) => v._id);

      // STEP 3: build query conditions
      const query: any = {};

      if (electionIds.length > 0) {
        query.electionId = { $in: electionIds };
      }

      if (voterIds.length > 0) {
        query.voterId = { $in: voterIds };
      }

      // tìm kiếm theo các trường khác nếu cần
      const matchedBallots = await this.ballotsModel
        .find({
          $or: [
            { status: { $regex: keyword, $options: 'i' } },
            { otpCode: { $regex: keyword, $options: 'i' } },
            { signature: { $regex: keyword, $options: 'i' } },
          ],
        })
        .collation({ locale: 'vi', strength: 1 })
        .lean();

      const matchedBallotIds = matchedBallots.map((b) => b._id);

      if (matchedBallotIds.length > 0) {
        query._id = { $in: matchedBallotIds };
      }

      // tìm ballots matching
      const ballots = await this.ballotsModel
        .find(query)
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate({
          path: 'voterId',
          populate: {
            path: 'userId',
            select: 'username fullName email position',
          },
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .sort({ createdAt: -1 })
        .lean();

      return paginate(ballots, page, limit);
    } catch (error) {
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const ballot = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballot) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      ballot.status = STATUS.INACTIVE;
      await ballot.save();

      return ballot;
    } catch (error) {
      throw error;
    }
  }

  async signBallot(p12File: Express.Multer.File, id: string, password: string, userId: string) {
    try {
      //Kiểm tra phiếu bầu tồn tại
      const ballot = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballot) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }
      if (ballot.status === STATUS.LOCKED) {
        throw new Error('Phiếu bầu đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ');
      }
      const wasCast = ballot.status === STATUS.CAST;

      //Tạo file pdf của phiếu bầu
      const pdfPath = await this.generateBallotPDF(id);
      //Tạo file kí
      const signFile = await this.signingService.signPdfWithP12(pdfPath, p12File.buffer, password);
      if (signFile) {
        ballot.castAt = getCurrentDateVN();
        ballot.status = STATUS.CAST;
        await ballot.save();

        const fileUpload = await this.fileService.uploadSignedPdf(
          FileType.VOTER_SIGNED_BALLOT,
          userId,
          signFile,
        );
        if (fileUpload) {
          await this.electionDocumentsModel.create({
            electionId: new Types.ObjectId(ballot.electionId),
            preparedBy: new Types.ObjectId(ballot.voterId),
            title: `File phiếu bầu - ${ballot._id}`,
            type: FileType.VOTER_SIGNED_BALLOT,
            fileUrl: fileUpload.url,
            status: STATUS.SIGNED,
            createdBy: userId && Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null,
          });
        }
        this.notificationService.voterSign(ballot.voterId.toString(), ballot);
        if (!wasCast) {
          await this.emitBallotCastRealtime(ballot.electionId as Types.ObjectId);
        }
        return fileUpload;
      } else {
        // 1. Nếu quá 5 lần → khóa phiếu
        if (ballot.attempts >= 5) {
          ballot.status = STATUS.LOCKED;
          await ballot.save();
          throw new Error('Phiếu bầu đã bị khóa do nhập sai quá 5 lần!');
        }
        ballot.attempts += 1;
        throw new Error('Ký phiếu bầu thất bại');
      }
    } catch (error) {
      throw error;
    }
  }

  private async emitBallotCastRealtime(electionId: Types.ObjectId) {
    try {
      const [totalBallots, castBallots] = await Promise.all([
        this.ballotsModel.countDocuments({ electionId }),
        this.ballotsModel.countDocuments({ electionId, status: STATUS.CAST }),
      ]);

      this.notificationService.transferDataRealTime(electionId.toString(), {
        type: 'ballot-cast',
        electionId: electionId.toString(),
        summary: {
          totalBallots,
          castBallots,
          pendingBallots: Math.max(totalBallots - castBallots, 0),
        },
        timestamp: getCurrentDateVN().toISOString(),
      });
    } catch (error) {
      console.error('Error emitting ballot-cast realtime:', error?.message || error);
    }
  }

  async generateBallotPDF(ballotId: string): Promise<Buffer> {
    try {
      //Kiểm tra phiếu bầu tồn tại
      const ballot: any = await this.ballotsModel
        .findById(new Types.ObjectId(ballotId))
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate({
          path: 'voterId',
          populate: [
            {
              path: 'userId',
              select: 'username fullName email position',
            },
          ],
        })
        .populate({
          path: 'allocations.entityId',
          populate: [{ path: 'electionTypeId', select: 'typeCode typeName description status' }],
          select: 'title description metaData fileUrl status proposerId',
        })
        .lean();

      if (!ballot) throw new Error(MESSAGE.BALLOT_NOT_FOUND);

      const election = ballot.electionId;
      const voter = ballot.voterId?.userId;
      const allocations = ballot.allocations;

      const votingRight = await this.votingRightsModel.findOne({
        voterId: new Types.ObjectId(ballot.voterId._id),
        electionId: new Types.ObjectId(ballot.electionId._id),
      });
      if (!votingRight) console.log('Không tìm thấy quyền bầu cử của cử tri');

      // ----------------------------------------
      const fonts = {
        Roboto: {
          normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
          bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
        },
      };

      const printer = new PdfPrinter(fonts);
      const allocationTable = {
        table: {
          widths: ['*', '*', 'auto'],
          body: [
            // HEADER
            [
              { text: 'Đối tượng', bold: true, alignment: 'center' },
              { text: 'Mô tả', bold: true, alignment: 'center' },
              { text: 'Số phiếu bầu', bold: true, alignment: 'center' },
            ],

            // ROWS
            ...allocations.map((a) => {
              const entity = a.entityId;
              return [
                entity?.title ?? '---',
                entity?.description ?? '---',
                String(a.voteValue ?? 0),
              ];
            }),
          ],
        },
        layout: {
          fillColor: (rowIndex) => (rowIndex === 0 ? '#eeeeee' : null), // màu nền header
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8,
        },
        margin: [0, 5, 0, 15],
      };

      const docDefinition: any = {
        pageMargins: [20, 20, 20, 20],
        content: [
          { text: 'PHIẾU BẦU CỬ', style: 'title', alignment: 'center' },
          { text: election?.title, style: 'subTitle', alignment: 'center' },
          { text: '\n\n' },

          // ELECTION INFO
          { text: 'Thông tin cuộc bầu cử', style: 'section' },
          {
            table: {
              widths: ['auto', '*'],
              body: [
                ['Tên cuộc bầu cử:', election?.title ?? '---'],
                [
                  'Thời gian bắt đầu:',
                  election?.startDate ? new Date(election?.startDate).toLocaleString() : '---',
                ],
                [
                  'Thời gian kết thúc:',
                  election?.endDate ? new Date(election?.endDate).toLocaleString() : '---',
                ],
                ['Số quyết định:', election?.decisionNumber ?? '---'],
                ['Tên quyết định:', election?.decisionName ?? '---'],
              ],
            },
            layout: 'noBorders',
            margin: [0, 5, 0, 15],
          },

          // VOTER INFO
          { text: 'Thông tin cử tri', style: 'section' },
          {
            table: {
              widths: ['auto', '*'],
              body: [
                ['Họ tên:', voter?.fullName ?? '---'],
                ['Số cổ phần:', votingRight?.shares ?? '---'],
                ['Tổng số phiếu tương ứng: ', votingRight?.votes ?? '---'],
                ['Email:', voter?.email ?? '---'],
                ['Số điện thoại:', voter?.phone ?? '---'],
                ['Chức vụ:', voter?.position ?? '---'],
                ['Phòng ban:', voter?.department ?? '---'],
              ],
            },
            layout: 'noBorders',
            margin: [0, 5, 0, 15],
          },

          // VOTE LIST
          { text: 'Chi tiết phiếu bầu', style: 'section' },
          allocationTable,
        ],

        styles: {
          title: { fontSize: 22, bold: true },
          subTitle: { fontSize: 14, color: '#555' },
          section: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
        },
      };

      //Footer Sign
      docDefinition.content.push({
        columns: [
          { text: '' },
          {
            text: `CỬ TRI`,
            alignment: 'center',
            margin: [0, 50, 0, 0],
          },
        ],
      });

      // CREATE PDF
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

  async verifyOtp(id: string, req: VerifyOtpDto) {
    try {
      //Kiểm tra phiếu bầu tồn tại
      const ballot = await this.ballotsModel.findById(new Types.ObjectId(id));
      if (!ballot) {
        throw new Error(MESSAGE.BALLOT_NOT_FOUND);
      }

      //Kiểm tra email tồn tại và active
      const user = await this.usersModel.findOne({ email: req.email }).exec();
      if (!user) {
        throw new Error('Email không tồn tại trong hệ thống!');
      }
      if (user.status !== STATUS.ACTIVE) {
        throw new Error('Tài khoản của bạn đã bị vô hiệu hóa!');
      }

      const otpKey = `otp:${req.email}`;
      const storedOtp = await this.redisService.get(otpKey);

      // Kiểm tra OTP có tồn tại không
      if (!storedOtp) {
        ballot.attempts += 1;
        await ballot.save();
        throw new Error('Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã OTP mới!');
      }

      // Kiểm tra OTP có đúng không
      if (storedOtp !== req.otp) {
        ballot.attempts += 1;
        await ballot.save();
        throw new Error('Mã OTP không đúng!');
      }

      //Kiểm tra số lần nhập otp
      if (ballot.attempts >= 5) {
        throw new Error('Bạn đã nhập sai OTP quá 5 lần. Vui lòng liên hệ quản trị viên để được hỗ trợ!');
      }

      // Đánh dấu OTP đã được verify bằng cách lưu flag vào Redis
      const verifiedKey = `otp:verified:${req.email}`;
      await this.redisService.set(verifiedKey, 'true', 5 * 60); // Giữ flag 5 phút

      // Xóa OTP sau khi verify thành công
      await this.redisService.del(otpKey);

      return { message: 'Xác thực OTP thành công!', verified: true };
    } catch (error) {
      throw error;
    }
  }
}
