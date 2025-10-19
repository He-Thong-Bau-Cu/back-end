import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Logger } from '@nestjs/common';

@Injectable()
export class DatabaseProvider implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit() {
    this.connection.on('connected', () => {
      Logger.log('Kết nối cơ sở dữ liệu thành công', 'Database');
    });
    this.connection.on('error', (error) => {
      Logger.error(`Lỗi kết nối cơ sở dữ liệu: ${error}`, '', 'Database');
    });
    this.connection.on('disconnected', () => {
      Logger.warn('Mất kết nối cơ sở dữ liệu', 'Database');
    });
  }
}
