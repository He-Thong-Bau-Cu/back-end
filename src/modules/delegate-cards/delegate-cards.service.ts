import { Injectable } from '@nestjs/common';
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
        createdDelegateCard._id,
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
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth" },
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
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth" },
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
            { path: "userId", select: "username fullName email position citizenId address image department dateOfBirth" },
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
      pageMargins: [20, 20, 20, 20],
      content: [
        {
          columns: [
            {
              stack: [
                { text: "THẺ ĐẠI BIỂU", style: "title" },
                { text: "Hệ thống bầu cử online", style: "sub" }
              ]
            },
            hasAvatar
              ? {
                image: avatarBase64Final,
                width: 90,
                height: 110,
                alignment: "right",
                margin: [0, 0, 0, 10],
                objectFit: "cover"
              }
              : { text: "" }
          ]
        },
        { text: "\n" },
        {
          table: {
            widths: ["auto", "*"],
            body: [
              ["Họ tên đại biểu:", fullName],
              ["Số CMND:", citizenId],
              ["Ngày phát hành thẻ:", issuedAt],
              ["Địa chỉ đại biểu:", location],
              ["Số cổ phần đại diện:", shares]
            ]
          },
          layout: "noBorders"
        },
        { text: "\n" },
        { text: `Mã đại biểu: ${delegateCode}`, bold: true },
        { text: "\n" },
        {
          image: qrBase64,
          width: 320,
          alignment: "center"
        }
      ],
      styles: {
        title: {
          fontSize: 20,
          bold: true
        },
        sub: {
          fontSize: 12,
          color: "#555"
        }
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



}
