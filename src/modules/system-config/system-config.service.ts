import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from 'src/database/schemas/systemConfig.schema';
import { SearchSystemConfigDto } from './dto/search-system-config.dto';
import { paginate } from 'src/common/dto/paignation';
import { CreateSystemConfigDto } from './dto/create-system-config.dto';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectModel(SystemConfig.name)
    private readonly systemConfigModel: Model<SystemConfigDocument>,
  ) {}

  async search(payload: SearchSystemConfigDto) {
    const filter: Record<string, any> = {};
    const regexFilters: Record<string, any>[] = [];

    if (payload.configKey) {
      filter.configKey = { $regex: payload.configKey, $options: 'i' };
    }

    if (payload.groupType) {
      filter.groupType = { $regex: payload.groupType, $options: 'i' };
    }

    if (payload.textSearch) {
      const regex = { $regex: payload.textSearch, $options: 'i' };
      regexFilters.push({ configKey: regex }, { groupType: regex });
    }

    if (regexFilters.length) {
      filter.$or = regexFilters;
    }

    const data = await this.systemConfigModel.find(filter).sort({ createdAt: -1 }).exec();
    return paginate(data, payload.page, payload.limit);
  }

  async create(payload: CreateSystemConfigDto, userId: string) {
    if (!userId) {
      throw new BadRequestException('Thiếu thông tin người thực hiện thao tác');
    }

    const configKey = payload.configKey.trim().toUpperCase();
    const existed = await this.systemConfigModel.exists({ configKey });

    if (existed) {
      throw new BadRequestException(MESSAGE.SYSTEM_CONFIG_ALREADY_EXIST);
    }

    const created = await this.systemConfigModel.create({
      configKey,
      groupType: payload.groupType.trim().toUpperCase(),
      configValue: this.normalizeConfigValue(payload.configValue),
      createdBy: new Types.ObjectId(userId),
    });

    return created;
  }

  async findById(id: string) {
    const config = await this.systemConfigModel.findById(id).exec();
    if (!config) {
      throw new NotFoundException(MESSAGE.SYSTEM_CONFIG_NOT_FOUND);
    }
    return config;
  }

  async findByKey(configKey: string) {
    const key = configKey.trim().toUpperCase();
    const config = await this.systemConfigModel.findOne({ configKey: key }).exec();
    if (!config) {
      throw new NotFoundException(MESSAGE.SYSTEM_CONFIG_NOT_FOUND);
    }
    return config;
  }

  async update(id: string, payload: UpdateSystemConfigDto, userId: string) {
    if (!userId) {
      throw new BadRequestException('Thiếu thông tin người thực hiện thao tác');
    }

    const config = await this.systemConfigModel.findById(id).exec();
    if (!config) {
      throw new NotFoundException(MESSAGE.SYSTEM_CONFIG_NOT_FOUND);
    }

    if (payload.configKey) {
      const newKey = payload.configKey.trim().toUpperCase();
      if (newKey !== config.configKey) {
        const existed = await this.systemConfigModel.exists({ configKey: newKey });
        if (existed) {
          throw new BadRequestException(MESSAGE.SYSTEM_CONFIG_ALREADY_EXIST);
        }
        config.configKey = newKey;
      }
    }

    if (payload.groupType) {
      config.groupType = payload.groupType.trim().toUpperCase();
    }

    if (payload.configValue !== undefined) {
      config.configValue = this.normalizeConfigValue(payload.configValue);
    }

    config.updatedBy = new Types.ObjectId(userId);
    await config.save();
    return config;
  }

  async remove(id: string) {
    const config = await this.systemConfigModel.findByIdAndDelete(id).exec();
    if (!config) {
      throw new NotFoundException(MESSAGE.SYSTEM_CONFIG_NOT_FOUND);
    }
    return config;
  }

  private normalizeConfigValue(value: any) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.length) {
        return null;
      }

      try {
        return JSON.parse(trimmed);
      } catch (error) {
        // Nếu không phải JSON hợp lệ thì lưu chuỗi gốc
        return trimmed;
      }
    }

    return value;
  }
}

