import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateElectionParticipantDto } from './dto/create-election-participant.dto';
import { UpdateElectionParticipantDto } from './dto/update-election-participant.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Model } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';

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
                private readonly rolesModel: Model<Roles>
        ) { }

        async getById(id: string) {
                try {
                        const electionParticipant = await this.electionParticipantsModel
                                .findById(new Types.ObjectId(id))
                                .populate([
                                        { path: "electionId", select: "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName" },
                                        { path: "roleId" },
                                        { path: 'userId', select: "fullName username email phone position department" }]
                                ).exec();
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
                                        { path: "electionId", select: "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName" },
                                        { path: "roleId" },
                                        { path: 'userId', select: "fullName username email phone position department" }]
                                ).exec();
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
                                .find({ userId: new Types.ObjectId(userId) })
                                .populate([
                                        { path: "electionId", select: "title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName" },
                                        { path: "roleId" },
                                        { path: 'userId', select: "fullName username email phone position department" }]
                                ).exec();
                        if (!electionParticipants) {
                                throw new NotFoundException(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
                        }
                        return electionParticipants;
                } catch (error) {
                        throw error;
                }
        }


        async create(electionParticipants: CreateElectionParticipantDto) {
                try {
                        //Kiểm tra electionId có tồn tại không
                        const electionExists = await this.electionsModel.exists({ _id: electionParticipants.electionId });
                        if (!electionExists) {
                                throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
                        }

                        //Kiểm tra userId có tồn tại không
                        const userExists = await this.usersModel.exists({ _id: electionParticipants.userId });
                        if (!userExists) {
                                throw new NotFoundException(MESSAGE.USER_NOT_FOUND);
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
                        });
                        return electionParticipant;
                } catch (error) {
                        throw error;
                }
        }
}
