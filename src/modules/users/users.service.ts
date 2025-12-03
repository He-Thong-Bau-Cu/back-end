import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from 'src/database/schemas/users.schema';
import { FilterQuery, Model, Types } from 'mongoose';
import { Roles, RolesDocument } from 'src/database/schemas/roles.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { STATUS } from '../../common/enums/status.enum';
import { UserDto } from '../../common/dto/user.dto';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { USER_ROLE } from '../../common/enums/config.enum';
import { MinioService } from '../minio/minio.service';
import { isValidateCitizenId, isValidEmail, isValidPhone, getCurrentDateVN } from 'src/common/utils/format';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import * as ExcelJS from 'exceljs';
import { Express } from 'express';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class UsersService implements OnModuleInit {
  bucketName = process.env.MINIO_BUCKET_NAME;
  private readonly logger = new Logger(UsersService.name);
  private readonly usersIndex = process.env.ELASTICSEARCH_USERS_INDEX || 'users';
  private isElasticsearchReady = false;
  constructor(
    @InjectModel(Users.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Roles.name)
    private roleModel: Model<RolesDocument>,
    @InjectModel(ElectionsParticipants.name)
    private electionParticipantModel: Model<ElectionsParticipants>,
    @InjectModel(Elections.name)
    private electionsModel: Model<Elections>,
    private mailService: MailService,
    private fileService: MinioService,
    private readonly elasticsearchService: ElasticsearchService,
  ) { }

  async onModuleInit() {
    await this.initializeElasticsearch();
  }

  async getAll() {
    try {
      const users = await this.userModel.find().populate('roleId').exec();
      return users;
    } catch (error) {
      throw error;
    }
  }

  // async getNonVoterUsers() {
  //   try {
  //     // Find the VOTER role
  //     const voterRole = await this.roleModel.findOne({ roleCode: USER_ROLE.VOTER });

  //     if (!voterRole) {
  //       console.log('Voter role not found');
  //       return [];
  //     }

  //     // Find users who don't have the VOTER role
  //     const users = await this.userModel
  //       .find({
  //         roleId: { $ne: voterRole._id }
  //       })
  //       .populate('roleId')
  //       .exec();

  //     return users;
  //   } catch (error) {
  //     throw error;
  //   }
  // }





  async getById(id: string) {
    try {
      const user = await this.userModel.findById(new Types.ObjectId(id)).populate('roleId').exec();

      if (!user) {
        throw new Error(MESSAGE.USER_NOT_FOUND);
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async search(req: UserDto) {
    try {
      const page = req.page ?? 1;
      const limit = req.limit ?? 10;

      if (req.fullName && this.isElasticsearchReady && process.env.ELASTICSEARCH_NODE) {
        return this.searchUsersInElasticsearch(req.fullName, req.status, page, limit);
      }

      return this.searchUsersInMongo(req, page, limit);
    } catch (error) {
      throw error;
    }
  }

  private async searchUsersInMongo(req: UserDto, page: number, limit: number) {
    const filters: FilterQuery<UserDocument>[] = [];
    if (req.fullName) {
      filters.push({ fullName: { $regex: req.fullName, $options: 'i' } });
    }
    if (req.email) {
      filters.push({ email: { $regex: req.email, $options: 'i' } });
    }
    if (req.status) {
      filters.push({ status: req.status });
    }

    const query: FilterQuery<UserDocument> = filters.length ? { $and: filters } : {};
    const skip = (page - 1) * limit;

    // Optimize: use lean() for better performance and only populate necessary fields
    const [users, totalItems] = await Promise.all([
      this.userModel
        .find(query)
        .populate('roleId', 'roleName roleCode') // Only select needed fields
        .select('-password -twoFaSecret') // Exclude sensitive fields
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(query),
    ]);

    return {
      content: users,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  private async searchUsersInElasticsearch(fullName: string, status: string | undefined, page: number, limit: number) {
    try {
      const from = (page - 1) * limit;
      const filters: any[] = [];
      if (status) {
        filters.push({ term: { status } });
      }

      // Optimize: use match instead of match_phrase_prefix for better performance
      const esResult = await this.elasticsearchService.search(
        this.usersIndex,
        {
          query: {
            bool: {
              must: [
                {
                  match: {
                    fullName: {
                      query: fullName,
                      operator: 'and', // All words must match
                      fuzziness: 'AUTO', // Allow typos
                    },
                  },
                },
              ],
              filter: filters,
            },
          },
          sort: [{ createdAt: { order: 'desc' } }],
        },
        from,
        limit,
      );

      const hits = esResult?.hits?.hits ?? [];
      if (!hits.length) {
        return this.searchUsersInMongo({ fullName, status } as UserDto, page, limit);
      }

      const ids = hits.map((hit: any) => hit._id);
      // Optimize: use lean() and only populate necessary fields
      const users = await this.userModel
        .find({ _id: { $in: ids } })
        .populate('roleId', 'roleName roleCode')
        .select('-password -twoFaSecret')
        .lean()
        .exec();
      const userMap = new Map(
        users.map((user: any) => [user._id ? user._id.toString() : '', user] as [string, any]),
      );
      const orderedUsers = ids.map((id) => userMap.get(id)).filter(Boolean);

      const total =
        typeof esResult.hits.total === 'number'
          ? esResult.hits.total
          : esResult.hits.total?.value ?? orderedUsers.length;

      return {
        content: orderedUsers,
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil((total || 0) / limit),
      };
    } catch (error) {
      this.logger.warn(`Elasticsearch search failed, fallback to Mongo: ${error.message}`);
      this.isElasticsearchReady = false;
      return this.searchUsersInMongo({ fullName, status } as UserDto, page, limit);
    }
  }

  async create(req: UserDto) {
    try {
      if (!req.fullName) {
        throw new Error('Họ và tên không được để trống !');
      }
      if (!req.email) {
        throw new Error('Gmail không được để trống !');
      }
      if (!req.phone) {
        throw new Error('Số điện thoại không được để trống !');
      }
      if (!req.citizenId) {
        throw new Error('Số căn cước công dân không được để trống !');
      }
      if (!isValidEmail(req.email)) {
        throw new Error('Gmail không hợp lệ !');
      }
      if (!isValidPhone(req.phone)) {
        throw new Error('Số điện thoại không hợp lệ !');
      }
      if (!isValidateCitizenId(req.citizenId)) {
        throw new Error('Số căn cước công dân không hợp lệ !');
      }
      const checkValidUser = await this.userModel
        .findOne({
          $or: [{ email: req.email }, { phone: req.phone }],
        })
        .exec();

      if (checkValidUser) {
        throw new Error('Gmail hoặc số điện thoại đã tồn tại !');
      }

      const username = await this.generateUserName(req.fullName);
      const password = this.generateRandomPassword(8);
      const passwordHash = await bcrypt.hash(password, 10);

      let roleData = await this.roleModel.findOne({ roleCode: USER_ROLE.USER }).exec();
      if (!roleData) {
        throw new Error(
          'Vai trò người dùng không tồn tại trong hệ thống. Vui lòng tạo vai trò trước khi thêm người dùng.',
        );
      }

      const newUser = new this.userModel({
        username: username,
        password: passwordHash,
        fullName: req.fullName,
        dateOfBirth: req.dateOfBirth,
        citizenId: req.citizenId,
        email: req.email,
        phone: req.phone,
        address: req.address,
        roleId: req.roleId !== null ? new Types.ObjectId(req.roleId) : roleData._id,
        position: req.position,
        department: req.department,
        isTempPassword: true,
        status: STATUS.ACTIVE,
        image: req.image,
      });
      await newUser.save();
      await this.mailService.sendMail(req.email, req.fullName, username, password);
      await this.indexUserDocument(newUser);
      return newUser;
    } catch (e) {
      throw e;
    }
  }

  async createByInfoDelegate(req: UserDto) {
    try {
      if (!req.fullName) {
        throw new Error('Họ và tên không được để trống !');
      }
      if (!req.email) {
        throw new Error('Gmail không được để trống !');
      }
      if (!req.phone) {
        throw new Error('Số điện thoại không được để trống !');
      }
      if (!req.citizenId) {
        throw new Error('Số căn cước công dân không được để trống !');
      }
      if (!isValidEmail(req.email)) {
        throw new Error('Gmail không hợp lệ !');
      }
      if (!isValidPhone(req.phone)) {
        throw new Error('Số điện thoại không hợp lệ !');
      }
      if (!isValidateCitizenId(req.citizenId)) {
        throw new Error('Số căn cước công dân không hợp lệ !');
      }
      const checkValidUser = await this.userModel
        .findOne({
          $or: [{ email: req.email }, { phone: req.phone }],
        })
        .exec();

      if (checkValidUser) {
        throw new Error('Gmail hoặc số điện thoại đã tồn tại !');
      }

      const username = await this.generateUserName(req.fullName);
      const password = this.generateRandomPassword(8);
      const passwordHash = await bcrypt.hash(password, 10);

      let roleData = await this.roleModel.findOne({ roleCode: USER_ROLE.USER }).exec();
      if (!roleData) {
        throw new Error(
          'Vai trò người dùng không tồn tại trong hệ thống. Vui lòng tạo vai trò trước khi thêm người dùng.',
        );
      }

      const newUser = new this.userModel({
        username: username,
        password: passwordHash,
        fullName: req.fullName,
        citizenId: req.citizenId,
        email: req.email,
        phone: req.phone,
        address: req.address,
        roleId: roleData._id,
        isTempPassword: true,
        status: STATUS.ACTIVE,
      });
      await newUser.save();
      await this.mailService.sendMailDelegatge(req.email, req.fullName, username, password);
      await this.indexUserDocument(newUser);
      return newUser;
    } catch (e) {
      throw e;
    }
  }



  async updateUser(userId: string, req: UserDto) {
    try {
      const userData = await this.userModel.findById(new Types.ObjectId(userId)).exec();
      if (!userData) {
        throw new Error('Người dùng không tồn tại !');
      }
      const checkEmail = await this.userModel
        .find({
          $or: [{ email: req.email }],
          _id: { $ne: new Types.ObjectId(userId) },
        })
        .exec();
      if (checkEmail.length > 0) {
        throw new Error('Gmail đã tồn tại !');
      }
      const checkPhone = await this.userModel
        .find({
          $or: [{ phone: req.phone }],
          _id: { $ne: new Types.ObjectId(userId) },
        })
        .exec();
      if (checkPhone.length > 0) {
        throw new Error('Số điện thoại đã tồn tại !');
      }
      const checkCitizenId = await this.userModel
        .find({
          $or: [{ citizenId: req.citizenId }],
          _id: { $ne: new Types.ObjectId(userId) },
        })
        .exec();
      if (checkCitizenId.length > 0) {
        throw new Error('Số căn cước công dân đã tồn tại !');
      }
      userData.fullName = req.fullName ? req.fullName : userData.fullName;
      userData.dateOfBirth = req.dateOfBirth ? req.dateOfBirth : userData.dateOfBirth;
      userData.citizenId = req.citizenId ? req.citizenId : userData.citizenId;
      userData.email = req.email ? req.email : userData.email;
      userData.phone = req.phone ? req.phone : userData.phone;
      userData.address = req.address ? req.address : userData.address;
      userData.roleId = req.roleId ? new Types.ObjectId(req.roleId) : userData.roleId;
      userData.position = req.position ? req.position : userData.position;
      userData.department = req.department ? req.department : userData.department;
      userData.image = req.image ? req.image : userData.image;
      userData.status = req.status ? req.status : userData.status;
      await userData.save();
      await this.indexUserDocument(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async detail(userId: string) {
    try {
      const userData = await this.userModel
        .findById(
          new Types.ObjectId(userId),
          '_id username isTempPassword fullName dateOfBirth citizenId email phone address roleId position department image',
        )
        .exec();
      if (!userData) {
        throw new Error('Người dùng không tồn tại !');
      }
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async delete(userId: string) {
    try {
      const userData = await this.userModel.findById(new Types.ObjectId(userId)).exec();
      if (!userData) {
        throw new Error('Người dùng không tồn tại !');
      }
      userData.status = STATUS.INACTIVE;
      await userData.save();
      await this.indexUserDocument(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async updateAvatar(userId: string, newAvatarUrl: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.image) {
      const oldUrl = user.image;
      const key = oldUrl.split(`${this.bucketName}/`)[1];
      if (key) {
        try {
          await this.fileService.deleteFileByKey(key);
        } catch (err) {
          console.warn('Failed to delete old avatar:', err.message);
        }
      }
    }

    user.image = newAvatarUrl;
    await user.save();
    await this.indexUserDocument(user);

    return user.image;
  }

  async getStatsUser() {
    try {
      const totalUsers = await this.userModel.countDocuments();
      const activeUsers = await this.userModel.countDocuments({ status: STATUS.ACTIVE });
      const inactiveUsers = await this.userModel.countDocuments({ status: STATUS.INACTIVE });
      const newUsers = await this.userModel.countDocuments({ isTempPassword: true });
      return { totalUsers, activeUsers, inactiveUsers, newUsers };
    } catch (error) {
      throw error;
    }
  }

  async exportUsersToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    worksheet.columns = [
      { header: 'STT', key: 'index', width: 6 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 18 },
      { header: 'Citizen ID', key: 'citizenId', width: 20 },
      { header: 'Date Of Birth', key: 'dateOfBirth', width: 18 },
      { header: 'Address', key: 'address', width: 35 },
      { header: 'Role Name', key: 'roleName', width: 25 },
      { header: 'Role Code', key: 'roleCode', width: 20 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    const users = await this.userModel
      .find()
      .populate('roleId', 'roleName roleCode')
      .lean();

    users.forEach((user, index) => {
      worksheet.addRow({
        index: index + 1,
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        citizenId: user.citizenId || '',
        dateOfBirth: user.dateOfBirth ? this.formatDate(user.dateOfBirth) : '',
        address: user.address || '',
        roleName: (user.roleId as any)?.roleName || '',
        roleCode: (user.roleId as any)?.roleCode || '',
        position: user.position || '',
        department: user.department || '',
        status: user.status || '',
        createdAt: user.createdAt ? this.formatDateTime(user.createdAt) : '',
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    const nodeBuffer = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer));
    return {
      buffer: nodeBuffer,
      fileName: `users-${Date.now()}.xlsx`,
    };
  }

  async importUsersFromExcel(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên file Excel');
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as unknown as ExcelJS.Buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new BadRequestException('File Excel không chứa dữ liệu');
    }

    const headerMap = this.buildHeaderMap(worksheet.getRow(1));
    const requiredHeaders = {
      fullName: this.getColumnIndex(headerMap, ['full name', 'họ và tên']),
      email: this.getColumnIndex(headerMap, ['email']),
      phone: this.getColumnIndex(headerMap, ['phone', 'số điện thoại']),
      citizenId: this.getColumnIndex(headerMap, ['citizen id', 'cccd', 'căn cước']),
    };

    Object.entries(requiredHeaders).forEach(([key, value]) => {
      if (!value) {
        throw new BadRequestException(`Thiếu cột dữ liệu bắt buộc cho ${key}`);
      }
    });

    const optionalHeaders = {
      dateOfBirth: this.getColumnIndex(headerMap, ['date of birth', 'ngày sinh']),
      address: this.getColumnIndex(headerMap, ['address', 'địa chỉ']),
      roleCode: this.getColumnIndex(headerMap, ['role code', 'mã vai trò']),
      position: this.getColumnIndex(headerMap, ['position', 'chức vụ']),
      department: this.getColumnIndex(headerMap, ['department', 'phòng ban']),
      status: this.getColumnIndex(headerMap, ['status', 'trạng thái']),
    };

    const roleCache = new Map<string, string>();
    const summary = {
      totalRows: 0,
      success: 0,
      failed: [] as { row: number; fullName?: string; reason: string }[],
    };

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      if (this.isRowEmpty(row)) {
        continue;
      }

      summary.totalRows += 1;
      const fullName = this.getCellString(row, requiredHeaders.fullName!);
      const email = this.getCellString(row, requiredHeaders.email!);
      const phone = this.getCellString(row, requiredHeaders.phone!);
      const citizenId = this.getCellString(row, requiredHeaders.citizenId!);

      try {
        const dateOfBirth = this.getCellDate(row, optionalHeaders.dateOfBirth);
        const address = this.getCellString(row, optionalHeaders.address);
        const roleCode = this.getCellString(row, optionalHeaders.roleCode)?.toUpperCase();
        const position = this.getCellString(row, optionalHeaders.position);
        const department = this.getCellString(row, optionalHeaders.department);
        const statusValue = this.getCellString(row, optionalHeaders.status);

        let roleId: string | undefined;
        if (roleCode) {
          roleId = await this.getRoleIdByCode(roleCode, roleCache);
        }

        const payload = {
          fullName,
          email,
          phone,
          citizenId,
          address,
          position,
          department,
          status: statusValue || STATUS.ACTIVE,
        } as UserDto;

        if (dateOfBirth) {
          payload.dateOfBirth = dateOfBirth;
        }
        if (roleId) {
          payload.roleId = roleId;
        }

        await this.create(payload);
        summary.success += 1;
      } catch (error: any) {
        summary.failed.push({
          row: rowNumber,
          fullName,
          reason: error?.message || 'Import failed',
        });
      }
    }

    return summary;
  }

  async generateUserName(fullName: string): Promise<string> {
    const removeVietnameseTones = (str: string) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
    };

    const normalizedFullName = removeVietnameseTones(fullName.trim().toLowerCase());
    const parts = normalizedFullName.split(/\s+/);

    if (parts.length < 2) throw new Error('Tên không hợp lệ. Cần ít nhất họ và tên.');

    const lastName = parts[parts.length - 1];
    const middleAndFirst = parts.slice(0, parts.length - 1);
    const initials = middleAndFirst.map((word) => word[0]).join('');
    const baseUserName = lastName + initials;

    const existingUsers: { username: string }[] = await this.userModel
      .find({ username: new RegExp(`^${baseUserName}\\d*$`, 'i') })
      .select('username')
      .lean();

    const suffixes = existingUsers.map((user) => {
      const match = user.username.match(new RegExp(`^${baseUserName}(\\d*)$`, 'i'));
      return match ? parseInt(match[1] || '0', 10) : 0;
    });

    const isBaseTaken = existingUsers.some(
      (user) => user.username.toLowerCase() === baseUserName.toLowerCase(),
    );

    const maxSuffix = suffixes.length > 0 ? Math.max(...suffixes) : 0;
    const newUserName = isBaseTaken ? `${baseUserName}${maxSuffix + 1}` : baseUserName;

    return newUserName;
  }

  generateRandomPassword(length: number = 8): string {
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const allChars = upperChars + lowerChars + numberChars;
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      password += allChars[randomIndex];
    }
    return password;
  }

  private formatDate(date: Date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private formatDateTime(date: Date) {
    const d = new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').slice(0, 19);
  }

  private buildHeaderMap(row: ExcelJS.Row) {
    const map = new Map<string, number>();
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const key = String((cell.value as any) || '')
        .trim()
        .toLowerCase();
      if (key) {
        map.set(key, colNumber);
      }
    });
    return map;
  }

  private getColumnIndex(map: Map<string, number>, candidates: string[]) {
    for (const candidate of candidates) {
      if (map.has(candidate)) {
        return map.get(candidate);
      }
    }
    return undefined;
  }

  private isRowEmpty(row: ExcelJS.Row) {
    if (row.cellCount === 0) {
      return true;
    }
    for (let i = 1; i <= row.actualCellCount; i++) {
      const cell = row.getCell(i);
      if (cell && cell.value !== null && cell.value !== undefined && cell.value !== '') {
        return false;
      }
    }
    return true;
  }

  private getCellString(row: ExcelJS.Row, column?: number) {
    if (!column) {
      return '';
    }
    const cell = row.getCell(column);
    const value = cell?.value;
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object' && 'text' in value) {
      return String((value as any).text ?? '').trim();
    }
    return String(value).trim();
  }

  private getCellDate(row: ExcelJS.Row, column?: number) {
    if (!column) {
      return undefined;
    }
    const cell = row.getCell(column);
    const value = cell?.value;
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
      return date;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return undefined;
  }

  private async getRoleIdByCode(roleCode: string, cache: Map<string, string>) {
    if (cache.has(roleCode)) {
      return cache.get(roleCode);
    }
    const role = await this.roleModel.findOne({ roleCode }).select('_id').lean();
    if (!role) {
      throw new Error(`Không tìm thấy vai trò với mã ${roleCode}`);
    }
    cache.set(roleCode, role._id.toString());
    return role._id.toString();
  }

  private async initializeElasticsearch() {
    if (!process.env.ELASTICSEARCH_NODE) {
      this.logger.warn('ELASTICSEARCH_NODE is not configured. Skipping Elasticsearch setup.');
      return;
    }
    try {
      await this.elasticsearchService.ensureIndex(this.usersIndex, {
        settings: {
          analysis: {
            analyzer: {
              vn_fullname: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding'],
              },
            },
          },
        },
        mappings: {
          properties: {
            fullName: { type: 'text', analyzer: 'vn_fullname', search_analyzer: 'vn_fullname' },
            email: { type: 'keyword' },
            status: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      await this.bootstrapUsersIndex();
      this.isElasticsearchReady = true;
    } catch (error) {
      this.logger.warn(`Failed to initialize Elasticsearch: ${error.message}`);
      this.isElasticsearchReady = false;
    }
  }

  private async bootstrapUsersIndex() {
    if (!process.env.ELASTICSEARCH_NODE) return;
    try {
      const count = await this.elasticsearchService.count(this.usersIndex);
      if (count > 0) {
        return;
      }
      const users = await this.userModel.find({}, 'fullName email status createdAt').lean().exec();
      if (!users.length) {
        return;
      }
      await this.elasticsearchService.bulk(
        this.usersIndex,
        users.map((user) => ({
          id: user._id.toString(),
          document: this.mapUserToIndex(user),
        })),
      );
    } catch (error) {
      this.logger.warn(`Failed to bootstrap Elasticsearch index: ${error.message}`);
    }
  }

  private mapUserToIndex(user: any) {
    return {
      fullName: user.fullName || '',
      email: user.email || '',
      status: user.status || '',
      createdAt: user.createdAt || getCurrentDateVN(),
    };
  }

  private async indexUserDocument(user: any) {
    if (!this.isElasticsearchReady || !process.env.ELASTICSEARCH_NODE) {
      return;
    }
    try {
      const plain = user?.toObject ? user.toObject() : user;
      await this.elasticsearchService.indexDocument(
        this.usersIndex,
        plain._id.toString(),
        this.mapUserToIndex(plain),
      );
    } catch (error) {
      this.logger.warn(`Failed to index user ${user?._id}: ${error.message}`);
    }
  }
}
