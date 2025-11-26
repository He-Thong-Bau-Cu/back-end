import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CreateDelegateCardDto } from './dto/create-delegate-card.dto';
import { UpdateDelegateCardDto } from './dto/update-delegate-card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DelegateCard } from 'src/database/schemas/delegateCard.schema';
import { Model, Types } from 'mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { Users } from 'src/database/schemas/users.schema';
import PdfPrinter from "pdfmake";
import * as fs from "fs";
import * as os from "os";
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { formatDateDMY } from 'src/common/utils/format';
import { MinioService } from '../minio/minio.service';
import console from 'console';
import path from 'path';
import { STATUS } from 'src/common/enums/status.enum';
import axios from 'axios';


@Injectable()
export class DelegateCardsService {
  private readonly logger = new Logger(DelegateCardsService.name);

  constructor(
    @InjectModel(DelegateCard.name)
    private readonly delegateCardModel: Model<DelegateCard>,
    @InjectModel(Delegations.name)
    private readonly delegationModel: Model<Delegations>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(VotingRights.name)
    private readonly votingRightsModel: Model<VotingRights>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
    private readonly minioService: MinioService,
    private readonly mailService: MailService,
  ) { }

  private generateToken(electionId: string, voterId: string): string {
    const payload = { electionId, voterId };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' });
    return token;
  }
  private async urlToBase64(imageUrl: string): Promise<string | null> {
    try {
      if (!imageUrl || !imageUrl.startsWith("http")) {
        console.log("Hình thức của đường dẫn không hợp lệ:", imageUrl);
        return null;
      }

      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

      const mimeType = response.headers["content-type"] || "";
      if (!mimeType.startsWith("image/")) {
        console.log("Avatar không phải là một hình ảnh:", mimeType, imageUrl);
        return null;
      }

      const base64 = Buffer.from(response.data, "binary").toString("base64");
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.log("Không thể truy cập URL ảnh:", imageUrl);
      console.log("Lỗi Axios:", error?.response?.status, error?.response?.data);
      return null;
    }
  }


  async generateDelegateCardQRCode(delegateCardId: string) {
    try {
      // Check if the delegate card exists
      const delegateCard = await this.delegateCardModel.findById(new Types.ObjectId(delegateCardId)).exec();
      if (!delegateCard) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      const qrCode = await this.authService.generateQRCode(delegateCard.token);
      return qrCode;
    } catch (error) {
      throw error;
    }
  }

  async create(createDelegateCardDto: CreateDelegateCardDto, userId: string) {
    try {

      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel
        .findById(new Types.ObjectId(createDelegateCardDto.electionId))
        .exec();
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      // Check if the voterId exists in the database

      const voterExists = await this.votersModel
        .findById(new Types.ObjectId(createDelegateCardDto.voterId))
        .populate<{ userId: Users }>(
          'userId',
          '_id email fullName username citizenId address image'
        )
        .exec();
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      const votingRight = await this.votingRightsModel.findOne({
        voterId: new Types.ObjectId(createDelegateCardDto.voterId),
        electionId: new Types.ObjectId(createDelegateCardDto.electionId),
      }).exec();

      if (!votingRight) {
        console.log('votingRight not found');
      }

      //check delegateCard is exist
      const existsQuery: any = {
        electionId: new Types.ObjectId(createDelegateCardDto.electionId),
        voterId: new Types.ObjectId(createDelegateCardDto.voterId),
      };
      if (createDelegateCardDto.delegationId) {
        existsQuery.delegationId = new Types.ObjectId(createDelegateCardDto.delegationId);
      }
      const delegateCardExists = await this.delegateCardModel.exists(existsQuery);
      if (delegateCardExists) {
        throw new Error(MESSAGE.DELEGATE_CARD_ALREADY_EXISTS);
      }
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

      const token = this.generateToken(createDelegateCardDto.electionId, createDelegateCardDto.voterId);
      const { qrCode } = await this.authService.generateQRCode(token);
      const userIdObj = voterExists.userId as Users & { _id: string };
      const avatar: any = await this.minioService.getProfileImageUrl(userIdObj._id.toString(), userIdObj.image);




      const createdDelegateCard: any = await this.delegateCardModel.create({
        token: token,
        electionId: new Types.ObjectId(createDelegateCardDto.electionId),
        voterId: new Types.ObjectId(createDelegateCardDto.voterId),
        ...(createDelegateCardDto.delegationId
          ? { delegationId: new Types.ObjectId(createDelegateCardDto.delegationId) }
          : {}),
        issuedAt,
        expiresAt,
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });

      const delegateCardPDF = await this.generateDelegateCardPDF(
        voterExists?.userId?.fullName,
        voterExists?.userId?.citizenId,
        formatDateDMY(issuedAt),
        voterExists?.userId?.address,
        votingRight ? votingRight.shares : 0,
        createdDelegateCard._id.toString(),
        avatar,
        qrCode
      );

      //send mail with PDF attachment (non-fatal)
      try {
        await this.mailService.sendMailDelegateCard(
          voterExists.userId.email,
          voterExists.userId.fullName,
          electionExists.title,
          delegateCardPDF,
        );
      } catch (mailErr) {
        console.error('Send delegate card mail failed:', mailErr);
      }

      return createdDelegateCard;
    } catch (error) {
      throw error;
    }
  }

  async getByToken(token: string) {
    try {

      const delegateCard = await this.delegateCardModel
        .findOne({ token: token })
        .populate('electionId', "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName")
        .populate({
          path: 'voterId',
          populate: [
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth phone" },
          ],

        })
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCard) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCard;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const delegateCard = await this.delegateCardModel
        .findById(new Types.ObjectId(id))
        .populate('electionId', "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName")
        .populate({
          path: 'voterId',
          populate: [
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth phone" },
          ],

        })
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCard) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCard;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      //Check if the election exists
      const election = await this.electionsModel.exists({ _id: electionId });
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const delegateCards = await this.delegateCardModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId', "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName")
        .populate({
          path: 'voterId',
          populate: [
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth phone" },
          ],

        })
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCards) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCards;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterId(voterId: string) {
    try {
      const voter = await this.votersModel.exists({ _id: voterId });
      if (!voter) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const delegateCards = await this.delegateCardModel
        .find({ voterId: new Types.ObjectId(voterId) })
        .populate('electionId', "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName")
        .populate({
          path: 'voterId',
          populate: [
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth phone" },
          ],

        })
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCards) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCards;
    } catch (error) {
      throw error;
    }
  }

  async checkDelegateCardExists(electionId: string, voterId: string, delegationId?: string): Promise<boolean> {
    try {
      const existsQuery: any = {
        electionId: new Types.ObjectId(electionId),
        voterId: new Types.ObjectId(voterId),
      };
      if (delegationId) {
        existsQuery.delegationId = new Types.ObjectId(delegationId);
      }
      const delegateCardExists = await this.delegateCardModel.exists(existsQuery);
      return !!delegateCardExists;
    } catch (error) {
      throw error;
    }
  }

  async getDelegateCardsActive() {
    try {
      const now = new Date();
      const delegateCards = await this.delegateCardModel.find({
        status: STATUS.ACTIVE,
        expiresAt: { $gte: now }
      })
        .populate({
          path: 'delegationId',
          populate: [
            { path: "electionId", select: "name" },
            { path: "delegatorId", select: "username fullName email position" },
            { path: "delegateId", select: "username fullName email position" },
            { path: "documentId", select: "title file_url status" },
            { path: "confirmedBy", select: "username fullName email position" },
            { path: "createdBy", select: "username fullName email position" },
            { path: "updatedBy", select: "username fullName email position" },
          ],
          select: "delegatorId delegateId confirmedBy"
        })

        .exec();
      return delegateCards;
    } catch (error) {
      throw error;
    }
  }



  async generateDelegateCardPDF(
    fullName: string,
    citizenId: string,
    issuedAt: string,
    location: string,
    shares: number,
    delegateCode: string,
    avatarBase64: string,
    qrBase64: string
  ) {
    const fonts = {
      Roboto: {
        normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
      }
    };

    const printer = new PdfPrinter(fonts);

    let avatarBase64Final = "";

    if (avatarBase64?.startsWith("http")) {
      avatarBase64Final = await this.urlToBase64(avatarBase64) || "";
    } else if (avatarBase64 && avatarBase64.startsWith("data:")) {
      avatarBase64Final = avatarBase64;
    }

    const hasAvatar = !!avatarBase64Final;

    const docDefinition = {
      pageSize: 'A5',
      pageOrientation: 'landscape',
      pageMargins: [18, 18, 18, 18],
      background: function(currentPage, pageSize) {
        return [
          {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: pageSize.width,
                h: pageSize.height,
                r: 0,
                color: '#f8f9fa'
              }
            ]
          }
        ];
      },
      content: [
        // Header section với background màu xanh đẹp
        {
          stack: [
            {
              canvas: [
                {
                  type: 'rect',
                  x: 0,
                  y: 0,
                  w: 559.28,
                  h: 60,
                  r: 8,
                  color: '#34d399'
                }
              ]
            },
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    {
                      text: 'THẺ ĐẠI BIỂU',
                      style: 'headerTitle',
                      margin: [20, 12, 0, 4]
                    },
                    {
                      text: 'Hệ thống bầu cử trực tuyến',
                      style: 'headerSubtitle',
                      margin: [20, 0, 0, 0]
                    }
                  ]
                },
                hasAvatar
                  ? {
                    width: 70,
                    stack: [
                      {
                        canvas: [
                          {
                            type: 'rect',
                            x: 0,
                            y: 0,
                            w: 60,
                            h: 65,
                            r: 6,
                            color: '#ffffff',
                            lineColor: '#ffffff',
                            lineWidth: 2
                          }
                        ],
                        margin: [5, 5, 0, 0]
                      },
                      {
                        image: avatarBase64Final,
                        width: 50,
                        height: 55,
                        fit: [50, 55],
                        margin: [5, -60, 5, 0]
                      }
                    ]
                  }
                  : { width: 0, text: '' }
              ],
              margin: [0, -60, 0, 0]
            }
          ],
          margin: [0, 0, 0, 12]
        },
        // Body với 2 cột: Thông tin bên trái, QR code bên phải
        {
          columns: [
            // Cột trái: Thông tin và mã đại biểu
            {
              width: 330,
              stack: [
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: 0,
                      y: 0,
                      w: 330,
                      h: 320,
                      r: 10,
                      color: '#ffffff',
                      lineColor: '#d1d5db',
                      lineWidth: 1.5
                    }
                  ]
                },
                {
                  stack: [
                    {
                      table: {
                        widths: [110, '*'],
                        body: [
                          [
                            { text: 'Họ và tên:', style: 'label', fillColor: '#f9fafb' },
                            { text: fullName || 'N/A', style: 'value' }
                          ],
                          [
                            { text: 'Số CMND/CCCD:', style: 'label', fillColor: '#f9fafb' },
                            { text: citizenId || 'N/A', style: 'value' }
                          ],
                          [
                            { text: 'Ngày phát hành:', style: 'label', fillColor: '#f9fafb' },
                            { text: issuedAt || 'N/A', style: 'value' }
                          ],
                          [
                            { text: 'Địa chỉ:', style: 'label', fillColor: '#f9fafb' },
                            { text: location || 'N/A', style: 'value' }
                          ],
                          [
                            { text: 'Số cổ phần đại diện:', style: 'label', fillColor: '#f9fafb' },
                            { text: shares?.toString() || '0', style: 'value' }
                          ]
                        ]
                      },
                      layout: {
                        paddingLeft: () => 12,
                        paddingRight: () => 12,
                        paddingTop: () => 8,
                        paddingBottom: () => 8,
                        hLineWidth: (i, node) => {
                          if (i === 0 || i === node.table.body.length) return 0;
                          return 0.5;
                        },
                        vLineWidth: () => 0,
                        hLineColor: () => '#e5e7eb',
                        vLineColor: () => '#e5e7eb'
                      },
                      margin: [15, 15, 15, 0]
                    },
                    // Divider line - Sửa lại để hiển thị rõ ràng
                    {
                      canvas: [
                        {
                          type: 'line',
                          x1: 15,
                          y1: 0,
                          x2: 315,
                          y2: 0,
                          lineWidth: 1.5,
                          lineColor: '#d1d5db',
                          dash: { length: 6, space: 3 }
                        }
                      ],
                      margin: [0, 15, 0, 15]
                    },
                    // Mã đại biểu section
                    {
                      stack: [
                        {
                          text: 'MÃ ĐẠI BIỂU',
                          style: 'codeLabel',
                          alignment: 'center',
                          margin: [0, 0, 0, 10]
                        },
                        {
                          canvas: [
                            {
                              type: 'rect',
                              x: 0,
                              y: 0,
                              w: 300,
                              h: 45,
                              r: 6,
                              color: '#d1fae5',
                              lineColor: '#34d399',
                              lineWidth: 2
                            }
                          ]
                        },
                        {
                          text: delegateCode || 'N/A',
                          style: 'codeValue',
                          alignment: 'center',
                          margin: [15, -38, 15, 0]
                        }
                      ],
                      margin: [15, 0, 15, 15]
                    }
                  ],
                  margin: [0, -320, 0, 0]
                }
              ]
            },
            // Cột phải: QR Code
            {
              width: 195,
              stack: [
                {
                  canvas: [
                    {
                      type: 'rect',
                      x: 0,
                      y: 0,
                      w: 195,
                      h: 320,
                      r: 10,
                      color: '#ffffff',
                      lineColor: '#d1d5db',
                      lineWidth: 1.5
                    }
                  ]
                },
                {
                  stack: [
                    {
                      text: 'MÃ QR XÁC THỰC',
                      style: 'qrLabel',
                      alignment: 'center',
                      margin: [0, 25, 0, 20]
                    },
                    {
                      columns: [
                        { width: '*', text: '' },
                        {
                          width: 150,
                          stack: [
                            {
                              canvas: [
                                {
                                  type: 'rect',
                                  x: 0,
                                  y: 0,
                                  w: 150,
                                  h: 150,
                                  r: 10,
                                  color: '#ffffff',
                                  lineColor: '#d1d5db',
                                  lineWidth: 1.5
                                }
                              ]
                            },
                            {
                              image: qrBase64,
                              width: 135,
                              height: 135,
                              fit: [135, 135],
                              margin: [7.5, -142.5, 7.5, 0]
                            }
                          ]
                        },
                        { width: '*', text: '' }
                      ]
                    }
                  ],
                  margin: [0, -320, 0, 0]
                }
              ]
            }
          ],
          columnGap: 15,
          margin: [0, 0, 0, 0]
        },
      ],
      styles: {
        headerTitle: {
          fontSize: 24,
          bold: true,
          color: '#ffffff',
          letterSpacing: 1.2
        },
        headerSubtitle: {
          fontSize: 11,
          color: '#d1fae5'
        },
        label: {
          fontSize: 10,
          color: '#6b7280',
          bold: false
        },
        value: {
          fontSize: 11,
          color: '#111827',
          bold: true
        },
        codeLabel: {
          fontSize: 9,
          color: '#6b7280',
          bold: false,
          letterSpacing: 0.8
        },
        codeValue: {
          fontSize: 14,
          color: '#059669',
          bold: true,
          letterSpacing: 2
        },
        qrLabel: {
          fontSize: 10,
          color: '#6b7280',
          bold: false,
          letterSpacing: 0.6
        },
        footerText: {
          fontSize: 8,
          color: '#9ca3af'
        }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    const outputPath = path.join(os.tmpdir(), `delegate-card-${String(delegateCode)}.pdf`);
    const writeStream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
    });

    return outputPath;
  }

  /**
   * Tự động tạo thẻ đại biểu cho user nếu đủ điều kiện
   * Điều kiện:
   * 1. User chưa có thẻ đại biểu cho election này
   * 2. User là eligible voter
   * 3. User không đang ủy quyền (không phải delegator active)
   * 4. Đã hết hạn ủy quyền (delegationEnd < now) - authorization còn valid
   */
  async autoCreateDelegateCardForUser(userId: string, electionId: string): Promise<any> {
    try {
      // 1. Kiểm tra election có tồn tại và đã hết hạn ủy quyền chưa
      const election = await this.electionsModel.findById(new Types.ObjectId(electionId)).exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const now = new Date();

      // 2. Kiểm tra user đã có thẻ đại biểu cho election này chưa
      const existingVoter = await this.votersModel
        .findOne({
          electionId: new Types.ObjectId(electionId),
          userId: new Types.ObjectId(userId),
        })
        .exec();

      if (!existingVoter) {
        return {
          created: false,
          reason: 'User chưa là cử tri trong cuộc bầu cử này.'
        };
      }

      // Kiểm tra đã có thẻ đại biểu chưa
      const existingCard = await this.delegateCardModel
        .findOne({
          electionId: new Types.ObjectId(electionId),
          voterId: existingVoter._id,
        })
        .exec();

      if (existingCard) {
        return {
          created: false,
          reason: 'User đã có thẻ đại biểu cho cuộc bầu cử này.',
          delegateCard: existingCard
        };
      }

      // 3. Kiểm tra user có đang ủy quyền không (không phải delegator active)
      const activeDelegation = await this.delegationModel
        .findOne({
          electionId: new Types.ObjectId(electionId),
          delegatorId: new Types.ObjectId(userId),
          status: { $in: [STATUS.ACTIVE, STATUS.CONFIRMED, STATUS.SIGNED] },
          endDate: { $gt: now },
        })
        .exec();

      if (activeDelegation) {
        return {
          created: false,
          reason: 'User đang có ủy quyền còn hiệu lực. Không thể tạo thẻ đại biểu.'
        };
      }

      // 4. Kiểm tra user có eligible không
      if (!existingVoter.eligible) {
        return {
          created: false,
          reason: 'User không đủ điều kiện để tạo thẻ đại biểu.'
        };
      }

      // 5. Tạo thẻ đại biểu
      const createDto = {
        electionId: electionId,
        voterId: (existingVoter._id as Types.ObjectId).toString(),
        status: STATUS.ACTIVE,
      } as CreateDelegateCardDto;
      const createdCard = await this.create(createDto, userId);

      return {
        created: true,
        delegateCard: createdCard,
        message: 'Thẻ đại biểu đã được tạo thành công.'
      };
    } catch (error) {
      console.error('Error auto creating delegate card:', error);
      return {
        created: false,
        reason: error.message || 'Có lỗi xảy ra khi tạo thẻ đại biểu.'
      };
    }
  }

  /**
   * Cron job tự động tạo thẻ đại biểu cho tất cả eligible voters
   * Chạy mỗi ngày lúc 2:00 AM
   * Tìm tất cả elections đã hết hạn ủy quyền và tạo thẻ cho eligible voters chưa có thẻ
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoCreateDelegateCardsForEligibleVoters() {
    const startTime = Date.now();
    this.logger.log('=== BẮT ĐẦU CRON JOB TỰ ĐỘNG TẠO THẺ ĐẠI BIỂU ===');

    try {
      const now = new Date();
      this.logger.log(`Thời gian hiện tại: ${now.toISOString()}`);

      // 1. Tìm tất cả elections đã hết hạn ủy quyền (delegationEnd < now)
      this.logger.log('Bước 1: Tìm kiếm elections đã hết hạn ủy quyền...');
      const elections = await this.electionsModel
        .find({
          delegationEnd: { $lte: now },
          status: STATUS.ACTIVE,
        })
        .exec();

      this.logger.log(`Bước 1 hoàn thành: Tìm thấy ${elections.length} cuộc bầu cử đã hết hạn ủy quyền`);
      if (elections.length > 0) {
        elections.forEach((election, index) => {
          this.logger.log(`  [${index + 1}] ${election.title} (ID: ${election._id}, delegationEnd: ${election.delegationEnd})`);
        });
      }

      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (const election of elections) {
        try {
          this.logger.log(`\n--- Xử lý election: ${election.title} (${election._id}) ---`);

          // 2. Tìm tất cả eligible voters trong election này
          this.logger.log(`Bước 2: Tìm kiếm eligible voters cho election ${election._id}...`);
          const eligibleVoters = await this.votersModel
            .find({
              electionId: election._id,
              status: { $in: [STATUS.ACTIVE, STATUS.AUTHORIZED] },
            })
            .populate('userId', '_id')
            .exec();

          this.logger.log(`Bước 2 hoàn thành: Tìm thấy ${eligibleVoters.length} eligible voters`);

          for (const voter of eligibleVoters) {
            try {
              this.logger.log(`\n  -> Xử lý voter: ${voter._id}`);

              const userId = (voter.userId as any)?._id || voter.userId;
              this.logger.log(`    UserId: ${userId}, Status: ${voter.status}`);

              if (!userId) {
                this.logger.warn(`    ⚠️ Voter ${voter._id} không có userId - BỎ QUA`);
                totalSkipped++;
                continue;
              }

              // 3. Kiểm tra đã có thẻ đại biểu chưa
              this.logger.log(`    Bước 3: Kiểm tra thẻ đại biểu đã tồn tại...`);
              const existingCard = await this.delegateCardModel
                .findOne({
                  electionId: election._id,
                  voterId: voter._id,
                })
                .exec();

              if (existingCard) {
                this.logger.log(`    ⏭️ Đã có thẻ đại biểu (ID: ${existingCard._id}) - BỎ QUA`);
                totalSkipped++;
                continue;
              }
              this.logger.log(`    ✓ Chưa có thẻ đại biểu, tiếp tục...`);

              // 4. Kiểm tra user có đang ủy quyền không
              this.logger.log(`    Bước 4: Kiểm tra ủy quyền đang hoạt động...`);
              const activeDelegation = await this.delegationModel
                .findOne({
                  electionId: election._id,
                  delegatorId: userId,
                  status: { $in: [STATUS.ACTIVE, STATUS.CONFIRMED, STATUS.SIGNED] },
                  endDate: { $gt: now },
                })
                .exec();

              if (activeDelegation) {
                this.logger.log(`    ⏭️ User ${userId} đang có ủy quyền còn hiệu lực (ID: ${activeDelegation._id}, endDate: ${activeDelegation.endDate}) - BỎ QUA`);
                totalSkipped++;
                continue;
              }
              this.logger.log(`    ✓ Không có ủy quyền đang hoạt động, tiếp tục...`);

              // 5. Tạo thẻ đại biểu
              this.logger.log(`    Bước 5: Tạo thẻ đại biểu...`);
              const createDto = {
                electionId: (election._id as Types.ObjectId).toString(),
                voterId: (voter._id as Types.ObjectId).toString(),
                status: STATUS.ACTIVE,
              } as CreateDelegateCardDto;

              // Sử dụng system user hoặc userId của voter
              const createdBy = userId.toString();
              this.logger.log(`    Dữ liệu tạo: electionId=${createDto.electionId}, voterId=${createDto.voterId}, createdBy=${createdBy}`);

              await this.create(createDto, createdBy);
              totalCreated++;
              this.logger.log(`    ✅ Đã tạo thẻ đại biểu thành công cho voter ${voter._id}`);
            } catch (error) {
              this.logger.error(`    ❌ LỖI khi tạo thẻ đại biểu cho voter ${voter._id}:`);
              this.logger.error(`       Message: ${error.message}`);
              this.logger.error(`       Stack: ${error.stack}`);
              totalErrors++;
            }
          }
        } catch (error) {
          this.logger.error(`❌ LỖI khi xử lý election ${election._id}:`);
          this.logger.error(`   Message: ${error.message}`);
          this.logger.error(`   Stack: ${error.stack}`);
          totalErrors++;
        }
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      this.logger.log(`\n=== HOÀN THÀNH CRON JOB (Thời gian: ${duration}s) ===`);
      this.logger.log(`📊 Kết quả: Đã tạo: ${totalCreated}, Bỏ qua: ${totalSkipped}, Lỗi: ${totalErrors}`);
    } catch (error) {
      this.logger.error(`\n❌❌❌ LỖI NGHIÊM TRỌNG trong cron job tự động tạo thẻ đại biểu ❌❌❌`);
      this.logger.error(`Message: ${error.message}`);
      this.logger.error(`Stack: ${error.stack}`);
    }
  }

}
